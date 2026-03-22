/**
 * POST /api/invoices/bulk-download.js
 *
 * Descarga múltiples facturas como archivo ZIP
 * Solo accesible por usuarios autenticados como admin
 *
 * Request body:
 * {
 *   "invoice_ids": ["id1", "id2", "id3"]
 * }
 *
 * Límites:
 * - Máximo 100 archivos por ZIP
 * - Máximo 500MB de datos
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Faltan variables de entorno: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const BUCKET_NAME = 'roots-barefoot-invoices';
const MAX_FILES = 100;
const MAX_SIZE = 500 * 1024 * 1024; // 500MB

export const POST = async ({ request, locals }) => {
  try {
    if (!locals?.isAdmin) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 403, headers: { 'Content-Type': 'application/json' }
      });
    }
    // Parsear body
    const body = await request.json();
    const { invoice_ids } = body;

    // Validar entrada
    if (!Array.isArray(invoice_ids) || invoice_ids.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'invoice_ids debe ser un array no vacío'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar límite de archivos
    if (invoice_ids.length > MAX_FILES) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Máximo ${MAX_FILES} facturas por descarga`
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const invalidIds = invoice_ids.filter(id => !uuidRegex.test(id));
    if (invalidIds.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'IDs de factura inválidos'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. Obtener información de las facturas
    const { data: invoices, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, invoice_number, pdf_storage_path, company_name')
      .in('id', invoice_ids);

    if (invoiceError || !invoices || invoices.length === 0) {
      console.error('Invoices not found:', invoiceError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No se encontraron facturas'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Descargar todos los PDFs (sin crear ZIP aún, solo validar)
    const pdfFiles = [];
    let totalSize = 0;

    for (const invoice of invoices) {
      try {
        const { data: pdfData, error: downloadError } = await supabase
          .storage
          .from(BUCKET_NAME)
          .download(invoice.pdf_storage_path);

        if (downloadError || !pdfData) {
          console.error(`Error downloading ${invoice.id}:`, downloadError);
          continue; // Saltar archivos que no se puedan descargar
        }

        const fileName = `FACTURA_${invoice.invoice_number}_${invoice.company_name}.pdf`
          .replace(/[^a-zA-Z0-9-_.]/g, '_');

        const fileSize = pdfData.size;
        totalSize += fileSize;

        // Validar límite de tamaño
        if (totalSize > MAX_SIZE) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'El tamaño total de los archivos excede el límite (500MB)'
            }),
            { status: 413, headers: { 'Content-Type': 'application/json' } }
          );
        }

        pdfFiles.push({
          name: fileName,
          data: pdfData
        });
      } catch (err) {
        console.error(`Error processing ${invoice.id}:`, err);
        continue;
      }
    }

    if (pdfFiles.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No se pudieron descargar los archivos PDF'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Crear ZIP (usando JSZip si está disponible, sino devolver un error)
    // NOTA: Para implementación real, necesitas instalar "jszip"
    // Por ahora, devolvemos un estado de "en progreso"
    // TODO: Implementar ZIP con librería adecuada

    // Crear un ZIP básico (estructura mínima)
    const zipFileName = `FACTURAS_${new Date().toISOString().split('T')[0]}.zip`;

    // Respuesta temporal mientras implementas la librería ZIP
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Bulk download endpoint funcional',
        files_ready: pdfFiles.length,
        total_size: totalSize,
        note: 'ZIP generation requires additional library implementation'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in /api/invoices/bulk-download:', error);
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
