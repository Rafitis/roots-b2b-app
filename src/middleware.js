import { createClient } from '@supabase/supabase-js';

// En el entorno del servidor puedes usar las variables sin el prefijo PUBLIC_
const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Faltan las variables de entorno para Supabase");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Regex hoisted a module scope (js-hoist-regexp: evita recompilar en cada request)
const ACCESS_TOKEN_RE = /sb-access-token=([^;]+)/;

// =============================================================================
// Cache in-memory para autenticación (evita llamadas repetidas a Supabase)
// Clave: accessToken → { user, isAdmin, timestamp }
// TTL: 5 minutos. Se invalida si cambia el token (refresh) o al hacer logout.
// =============================================================================
const authCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function getCached(token) {
  const entry = authCache.get(token);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry;
  authCache.delete(token);
  return null;
}

function setCache(token, user, isAdmin) {
  // Limitar tamaño del cache para evitar memory leaks
  if (authCache.size > 200) {
    const firstKey = authCache.keys().next().value;
    authCache.delete(firstKey);
  }
  authCache.set(token, { user, isAdmin, ts: Date.now() });
}

/**
 * Middleware global para autenticación y autorización
 *
 * Flujo:
 * 1. Rutas públicas (/signin, /signup, /api/auth) → Sin validación
 * 2. Rutas protegidas → Autenticación + check admin (con cache)
 */
export async function onRequest(context, next) {
  const { request } = context;
  const url = new URL(request.url);

  // ============================================================================
  // PASO 1: Excluir rutas públicas
  // ============================================================================
  if (
    url.pathname === '/signin' ||
    url.pathname === '/signup' ||
    url.pathname.startsWith('/api/auth') ||
    url.pathname.startsWith('/api/cron')
  ) {
    return next();
  }

  // ============================================================================
  // PASO 2: Obtener access token
  // ============================================================================
  const cookieHeader = request.headers.get("cookie") || "";
  const tokenMatch = cookieHeader.match(ACCESS_TOKEN_RE);

  if (!tokenMatch) {
    return Response.redirect(new URL("/signin", request.url), 302);
  }

  const accessToken = tokenMatch[1];

  // ============================================================================
  // PASO 3: Autenticación + admin check (con cache in-memory)
  // Primera request: ~370ms (getUser + get_user_profile)
  // Siguientes requests (5 min): ~0ms (cache hit)
  // ============================================================================
  let user, isAdmin;
  const cached = getCached(accessToken);

  if (cached) {
    // Cache hit — sin llamadas a Supabase
    user = cached.user;
    isAdmin = cached.isAdmin;
  } else {
    // Cache miss — validar con Supabase
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      return new Response(null, {
        status: 302,
        headers: {
          "Location": new URL("/signin", request.url).toString(),
          "Set-Cookie": [
            "sb-access-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
            "sb-refresh-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
          ].join("; ")
        }
      });
    }

    user = data.user;

    // Verificar admin en Supabase
    const { data: profile, error: profileError } = await supabase
      .rpc('get_user_profile', { user_id: user.id });

    isAdmin = !profileError && profile?.is_admin === true;

    // Guardar en cache
    setCache(accessToken, user, isAdmin);
  }

  // ============================================================================
  // PASO 4: Autorización de rutas admin
  // ============================================================================
  if (url.pathname.startsWith('/admin') && !isAdmin) {
    if (url.pathname.startsWith('/api/admin/')) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized: Admin access required' }), {
        status: 403, headers: { 'Content-Type': 'application/json' }
      });
    }
    return Response.redirect(new URL("/", request.url), 302);
  }

  // ============================================================================
  // PASO 5: Pasar datos a la página via locals
  // ============================================================================
  context.locals.user = user;
  context.locals.isAdmin = isAdmin;
  return next();
}
