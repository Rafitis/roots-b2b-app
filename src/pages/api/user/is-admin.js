import { createClient } from '@supabase/supabase-js';

export const prerender = false;

export const GET = async ({ request }) => {
  try {
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ isAdmin: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get token from cookies
    const cookieHeader = request.headers.get('cookie') || '';
    const tokenMatch = cookieHeader.match(/sb-access-token=([^;]+)/);

    if (!tokenMatch) {
      return new Response(JSON.stringify({ isAdmin: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const accessToken = tokenMatch[1];

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return new Response(JSON.stringify({ isAdmin: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Método 1: Usar RPC function (misma que middleware.js para consistencia)
    const { data: profile, error: rpcError } = await supabase
      .rpc('get_user_profile', { user_id: user.id });

    if (profile && profile.is_admin === true) {
      return new Response(JSON.stringify({ isAdmin: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Método 2: Fallback - Si RPC falla, intentar tabla profiles directamente
    if (rpcError) {
      const { data: directProfile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (directProfile && directProfile.is_admin === true) {
        return new Response(JSON.stringify({ isAdmin: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Método 3: Último recurso - Verificar user_metadata
    if (user.user_metadata?.is_admin === true) {
      return new Response(JSON.stringify({ isAdmin: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Por defecto, no es admin
    return new Response(JSON.stringify({ isAdmin: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en /api/user/is-admin:', error);
    return new Response(JSON.stringify({ isAdmin: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
