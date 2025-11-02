/**
 * PUT /api/invoices/[id]/cancel.js
 *
 * Marca una factura como 'cancelled'
 * Se usa cuando se edita una factura y se crea una nueva
 * La factura original se marca como cancelada
 *
 * No requiere parámetros en el body
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Faltan variables de entorno: SUPABASE_URL, SUPABASE_SERVICE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const PUT = async ({ request, params }) => {
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

    // 2. Verificar que la factura existe
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('id, status')
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

    // 3. Validar que no esté ya cancelada
    if (invoice.status === 'cancelled') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Factura ya está cancelada'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Marcar como cancelled
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error cancelling invoice:', updateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Error al cancelar factura',
          details: updateError.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Retornar respuesta exitosa
    return new Response(
      JSON.stringify({
        success: true,
        message: `Factura ${id} marcada como cancelada`,
        invoice_id: id
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in /api/invoices/[id]/cancel:', error);
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
