import { createClient } from '@supabase/supabase-js';

// En el entorno del servidor puedes usar las variables sin el prefijo PUBLIC_
const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Faltan las variables de entorno para Supabase");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function onRequest(context, next) {
  const { request } = context;

  // Extraemos la URL completa y el pathname
  const url = new URL(request.url);

  // Excluye rutas públicas: /signin, /signup y las que empiecen con /api/auth
  if (
    url.pathname === '/signin' ||
    url.pathname === '/signup' ||
    url.pathname.startsWith('/api/auth')
  ) {
    return next(); // Deja pasar la petición sin verificar la autenticación.
  }

  // Obtén el header "cookie" de la petición
  const cookieHeader = request.headers.get("cookie") || "";
  // Usa una expresión regular para extraer el token de acceso (sb-access-token)
  const tokenMatch = cookieHeader.match(/sb-access-token=([^;]+)/);
  
  if (!tokenMatch) {
    // No se encontró token, redirige al login
    return Response.redirect(new URL("/signin", request.url), 302);
  }
  
  const accessToken = tokenMatch[1];
  // Verifica la sesión utilizando la API de Supabase
  const { data: user, error } = await supabase.auth.getUser(accessToken);
  
  if (error || !user) {
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
  // Si el token es válido, continúa con la siguiente función en la cadena (next)
  return next();
}
