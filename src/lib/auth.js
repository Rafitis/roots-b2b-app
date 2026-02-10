import { createClient } from '@supabase/supabase-js';

// En el entorno del servidor usamos las variables sin PUBLIC_
const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Faltan las variables de entorno de Supabase.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Verifica si el usuario actual es admin basado en las cookies
 * Para uso en componentes de servidor (Astro)
 *
 * @param {Request} request - El objeto request de Astro
 * @returns {Promise<boolean>} true si el usuario es admin
 */
export async function isUserAdmin(request) {
  try {
    // Obtener token de las cookies
    const cookieHeader = request.headers.get('cookie') || '';
    const tokenMatch = cookieHeader.match(/sb-access-token=([^;]+)/);

    if (!tokenMatch) {
      return false;
    }

    const accessToken = tokenMatch[1];

    // Obtener usuario
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return false;
    }

    // Verificar admin con RPC (consistente con middleware)
    const { data: profile, error: rpcError } = await supabase
      .rpc('get_user_profile', { user_id: user.id });

    if (profile && profile.is_admin === true) {
      return true;
    }

    // Fallback: tabla profiles directamente
    if (rpcError) {
      const { data: directProfile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (directProfile && directProfile.is_admin === true) {
        return true;
      }
    }

    // Último recurso: user_metadata
    if (user.user_metadata?.is_admin === true) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error verificando admin:', error);
    return false;
  }
}

export const post = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();

  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Falta email o contraseña' }), { status: 400 });
  }

  const { user, session, error } = await supabase.auth.signIn({ email, password });
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 401 });
  }

  // En un entorno real, Supabase maneja las cookies en el cliente,
  // pero aquí devolvemos la sesión y el usuario para que el cliente pueda
  // proceder a guardarlos o redireccionar.
  return new Response(JSON.stringify({ user, session }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};