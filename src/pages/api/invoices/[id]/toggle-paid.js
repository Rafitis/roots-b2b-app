/**
 * PATCH /api/invoices/[id]/toggle-paid.js
 *
 * Marca una factura como pagada o pendiente (toggle del booleano is_paid)
 * Solo accesible por administradores
 *
 * Body opcional: { is_paid: boolean } para forzar un valor concreto.
 * Si no se envía body, invierte el valor actual.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Faltan variables de entorno: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const PATCH = async ({ request, params, locals }) => {
  try {
    if (!locals?.isAdmin) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 403, headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invoice ID inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let explicitValue = null;
    try {
      const body = await request.json();
      if (typeof body?.is_paid === 'boolean') {
        explicitValue = body.is_paid;
      }
    } catch {
      // body vacío o inválido — usamos toggle del valor actual
    }

    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('id, is_paid')
      .eq('id', id)
      .single();

    if (fetchError || !invoice) {
      return new Response(
        JSON.stringify({ success: false, error: 'Factura no encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const newValue = explicitValue !== null ? explicitValue : !invoice.is_paid;

    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        is_paid: newValue,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error toggling paid status:', updateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Error al actualizar estado de pago',
          details: updateError.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        invoice_id: id,
        is_paid: newValue
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in /api/invoices/[id]/toggle-paid:', error);
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
