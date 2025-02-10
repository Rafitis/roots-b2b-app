import { supabase } from "@lib/supabase";

// Función para obtener todos los clientes
export async function getAllCustomers() {
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, address, nif_cif, phone, email, fiscal_name");
  if (error) {
    throw error;
  }
  return data;
}

// Puedes agregar aquí otras funciones como agregar, actualizar o eliminar clientes
export async function getCustomerById(id) {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    throw error;
  }
  return data;
}