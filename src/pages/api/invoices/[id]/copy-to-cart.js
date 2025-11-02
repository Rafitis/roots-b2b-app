/**
 * POST /api/invoices/[id]/copy-to-cart.js
 *
 * Copia los items de una factura al carrito para edición:
 * 1. Obtiene la factura por ID
 * 2. Extrae items_data
 * 3. Retorna los items en formato compatible con Nanostores
 *
 * El frontend (admin) debería:
 * - Limpiar el carrito actual
 * - Cargar estos items
 * - Redirigir a /carrito para editar
 * - Al guardar, creará una NUEVA factura con nuevo número
 * - Marcará la original como 'cancelled'
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Faltan variables de entorno: SUPABASE_URL, SUPABASE_SERVICE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const POST = async ({ request, params }) => {
  try {
    const { id } = params;

    // 1. Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invoice ID inválido'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Obtener la factura
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('id, invoice_number, items_data, company_name, nif_cif, address, country, status, shopify_order_number, surcharge_applied, surcharge_amount')
      .eq('id', id)
      .single();

    if (fetchError || !invoice) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Factura no encontrada'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Validar que tenga items_data
    if (!invoice.items_data || !Array.isArray(invoice.items_data)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'La factura no tiene datos de items'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Validar que la factura no esté cancelada
    if (invoice.status === 'cancelled') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No se puede copiar una factura cancelada'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Retornar datos para cargar en el carrito
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Datos de factura listos para editar',
        invoice_id: invoice.id,
        original_invoice_number: invoice.invoice_number,
        items: invoice.items_data,
        customer_info: {
          fiscal_name: invoice.company_name,
          nif_cif: invoice.nif_cif,
          address: invoice.address,
          country: invoice.country,
          shopify_order_number: invoice.shopify_order_number,
          isRecharge: invoice.surcharge_applied || false
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in /api/invoices/[id]/copy-to-cart:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
