/**
 * POST /api/invoices/save.js
 *
 * Guarda una factura en Supabase:
 * 1. Inserta metadatos en tabla invoices
 * 2. Sube PDF a Storage bucket roots-barefoot-invoices
 * 3. Retorna invoice_number y URL del PDF
 *
 * Request body:
 * {
 *   invoice_data: { company_name, nif_cif, address, country, items_count, items_data, total_amount_eur, vat_amount, surcharge_applied, surcharge_amount, is_preorder },
 *   pdf_base64: "JVBERi0xLjQK..."
 * }
 */

import { createClient } from '@supabase/supabase-js';
import {
  validateInvoiceData,
  isValidPdf,
  cleanBase64,
  generatePdfStoragePath,
  generatePublicPdfUrl,
  base64ToUint8Array
} from '../../../lib/invoice-service.js';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Faltan variables de entorno: SUPABASE_URL, SUPABASE_SERVICE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const BUCKET_NAME = 'roots-barefoot-invoices';

export const POST = async ({ request }) => {
  try {
    // 1. Parsear body
    const body = await request.json();
    const { invoice_data, pdf_base64 } = body;

    if (!invoice_data || !pdf_base64) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Faltan invoice_data o pdf_base64 en el request'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Validar datos de factura
    const validation = validateInvoiceData(invoice_data);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Validación fallida',
          details: validation.errors
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Validar PDF
    if (!isValidPdf(pdf_base64)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'PDF inválido o vacío'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Insertar en tabla invoices usando función SECURITY DEFINER
    // Esto bypassa RLS correctamente
    const { data: insertedInvoice, error: insertError } = await supabase
      .rpc('save_invoice', {
        p_company_name: invoice_data.company_name.trim(),
        p_nif_cif: invoice_data.nif_cif.toUpperCase().trim(),
        p_address: invoice_data.address.trim(),
        p_country: invoice_data.country.trim(),
        p_items_count: invoice_data.items_count,
        p_total_amount_eur: Math.round(invoice_data.total_amount_eur * 100) / 100,
        p_vat_amount: Math.round(invoice_data.vat_amount * 100) / 100,
        p_surcharge_applied: invoice_data.surcharge_applied || false,
        p_surcharge_amount: invoice_data.surcharge_amount ? Math.round(invoice_data.surcharge_amount * 100) / 100 : 0,
        p_is_preorder: invoice_data.is_preorder || false,
        p_items_data: invoice_data.items_data || null,
        p_previous_invoice_id: invoice_data.previous_invoice_id || null
      });

    if (insertError || !insertedInvoice || insertedInvoice.length === 0) {
      console.error('Error inserting invoice:', insertError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Error al insertar factura en BD',
          details: insertError?.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const invoiceNumber = insertedInvoice[0].invoice_number;
    const invoiceId = insertedInvoice[0].id;

    // 5. Generar ruta de PDF en Storage basada en el invoice_number obtenido
    const pdfStoragePath = generatePdfStoragePath(invoiceNumber);

    // 6. Convertir base64 a bytes y subir a Storage
    const cleanedBase64 = cleanBase64(pdf_base64);
    const pdfBytes = base64ToUint8Array(cleanedBase64);

    const { error: uploadError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .upload(pdfStoragePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);

      // Si falló la subida, eliminar el registro de la BD
      await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Error al subir PDF a Storage',
          details: uploadError.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 7. Actualizar pdf_storage_path en la tabla
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ pdf_storage_path: pdfStoragePath })
      .eq('id', invoiceId);

    if (updateError) {
      console.error('Error updating pdf_storage_path:', updateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Error al actualizar ruta del PDF',
          details: updateError.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 8. Generar URL pública del PDF
    const pdfUrl = generatePublicPdfUrl(supabaseUrl, BUCKET_NAME, pdfStoragePath);

    // 9. Retornar respuesta exitosa
    return new Response(
      JSON.stringify({
        success: true,
        invoice_number: invoiceNumber,
        id: invoiceId,
        pdf_url: pdfUrl,
        message: `Factura guardada correctamente: ${invoiceNumber}`
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in /api/invoices/save:', error);
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
