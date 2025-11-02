/**
 * DELETE /api/invoices/[id]
 *
 * Elimina una factura y su PDF asociado
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Faltan variables de entorno: SUPABASE_URL, SUPABASE_SERVICE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const DELETE = async ({ params }) => {
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

    // 2. Obtener la factura para obtener el nombre del archivo PDF
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('id, invoice_number, pdf_storage_path')
      .eq('id', id)
      .single();

    if (fetchError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Factura no encontrada',
          details: fetchError.message
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!invoice) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Factura no encontrada'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Eliminar el PDF de Storage si existe
    if (invoice.pdf_storage_path) {
      try {
        await supabase.storage
          .from('roots-barefoot-invoices')
          .remove([invoice.pdf_storage_path]);
      } catch (storageError) {
        // No interrumpir el flujo si falla el borrado del PDF
      }
    }

    // 4. Eliminar la factura de la BD
    const { error: deleteError } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Error al eliminar factura de la base de datos',
          details: deleteError.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Factura ${invoice.invoice_number} eliminada correctamente`
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in DELETE /api/invoices/[id]:', error);
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
