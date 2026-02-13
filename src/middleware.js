import { createClient } from '@supabase/supabase-js';

// En el entorno del servidor puedes usar las variables sin el prefijo PUBLIC_
const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Faltan las variables de entorno para Supabase");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Middleware global para autenticación y autorización
 *
 * Flujo:
 * 1. Rutas públicas (/signin, /signup, /api/auth) → Sin validación
 * 2. Rutas protegidas (todo lo demás) → Requiere autenticación
 * 3. Rutas admin (/admin/*) → Requiere autenticación + is_admin=TRUE
 */
export async function onRequest(context, next) {
  const { request } = context;

  // Extraemos la URL completa y el pathname
  const url = new URL(request.url);

  // ============================================================================
  // PASO 1: Excluir rutas públicas (sin requerir autenticación)
  // ============================================================================
  if (
    url.pathname === '/signin' ||
    url.pathname === '/signup' ||
    url.pathname.startsWith('/api/auth') ||
    url.pathname.startsWith('/api/cron')  // Endpoints de cron jobs (usan Authorization header)
  ) {
    return next(); // Deja pasar sin verificar autenticación
  }

  // ============================================================================
  // PASO 2: Validar autenticación para todas las otras rutas
  // ============================================================================
  const cookieHeader = request.headers.get("cookie") || "";
  const tokenMatch = cookieHeader.match(/sb-access-token=([^;]+)/);

  if (!tokenMatch) {
    // No hay token, redirige a /signin
    return Response.redirect(new URL("/signin", request.url), 302);
  }

  const accessToken = tokenMatch[1];

  // Obtener datos del usuario desde el token
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    // Token inválido o expirado, redirige a /signin y limpia cookies
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

  // ============================================================================
  // PASO 3: Validar autorización para rutas ADMIN
  // ============================================================================
  if (url.pathname.startsWith('/admin')) {
    // Obtener el perfil del usuario usando RPC (SECURITY DEFINER para evitar recursión)
    const { data: profile, error: profileError } = await supabase
      .rpc('get_user_profile', { user_id: user.id });

    // Si hay error o el usuario NO es admin, rechazar acceso
    if (profileError || !profile || !profile.is_admin) {
      // Usuario autenticado pero NO es admin, redirige a /
      return Response.redirect(new URL("/", request.url), 302);
    }
  }

  // ============================================================================
  // PASO 4: Si todo está bien, continuar
  // ============================================================================
  return next();
}
