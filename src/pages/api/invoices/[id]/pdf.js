/**
 * GET /api/invoices/[id]/pdf.js
 *
 * Descarga el PDF de una factura específica
 * Solo accesible por usuarios autenticados como admin
 *
 * URL: /api/invoices/550e8400-e29b-41d4-a716-446655440000/pdf
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Faltan variables de entorno: SUPABASE_URL, SUPABASE_SERVICE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const BUCKET_NAME = 'roots-barefoot-invoices';

export const GET = async ({ params }) => {
  try {
    const { id } = params;

    // Validar que el ID es un UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'ID de factura inválido'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. Obtener información de la factura
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, invoice_number, pdf_storage_path, company_name')
      .eq('id', id)
      .single();

    if (invoiceError || !invoice) {
      console.error('Invoice not found:', invoiceError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Factura no encontrada'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Descargar PDF del Storage
    const { data: pdfData, error: downloadError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .download(invoice.pdf_storage_path);

    if (downloadError || !pdfData) {
      console.error('Error downloading PDF:', downloadError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Error al descargar PDF',
          details: downloadError?.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Convertir Blob a ArrayBuffer y luego a Response
    const arrayBuffer = await pdfData.arrayBuffer();

    // Generar nombre de archivo: FACTURA_2025-001_EMPRESA.pdf
    const fileName = `FACTURA_${invoice.invoice_number}_${invoice.company_name}.pdf`
      .replace(/[^a-zA-Z0-9-_.]/g, '_'); // Sanitizar caracteres especiales

    // 4. Retornar PDF con headers correctos
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('Unexpected error in /api/invoices/[id]/pdf:', error);
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
