import { createClient } from '@supabase/supabase-js';

// En el entorno del servidor usamos las variables sin PUBLIC_
const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Faltan las variables de entorno de Supabase.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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