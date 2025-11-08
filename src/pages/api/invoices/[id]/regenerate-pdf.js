/**
 * POST /api/invoices/[id]/regenerate-pdf.js
 *
 * Regenera el PDF de una factura con el número Shopify actualizado:
 * 1. Obtiene datos completos de la factura de BD
 * 2. Renderiza InvoicePDFServer con @react-pdf/renderer
 * 3. Convierte a PDF buffer
 * 4. Sube a Storage (SOBRESCRIBE el archivo anterior)
 * 5. Actualiza timestamp en BD
 * 6. Retorna confirmación
 *
 * Request: POST /api/invoices/550e8400-e29b-41d4-a716-446655440000/regenerate-pdf
 * Response: { success: true, message: "PDF regenerado...", shopify_order_number: "123456" }
 */

import React from 'react';
import fs from 'fs';
import path from 'path';
import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@supabase/supabase-js';
import InvoicePDFServer from '@components/invoice/InvoicePDFServer.jsx';
import { ui } from '@i18n/ui.ts';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_KEY;
const rootsDni = import.meta.env.ROOTS_DNI;
const rootsIban = import.meta.env.ROOTS_IBAN;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Faltan variables de entorno: SUPABASE_URL, SUPABASE_SERVICE_KEY');
}

if (!rootsDni || !rootsIban) {
  throw new Error('Faltan variables de entorno: ROOTS_DNI, ROOTS_IBAN');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const BUCKET_NAME = 'roots-barefoot-invoices';

// Constantes de Roots Barefoot (desde variables de entorno)
const ROOTS_DNI = rootsDni; // CIF de Roots Barefoot S.L.
const ROOTS_IBAN = rootsIban; // IBAN de Roots Barefoot S.L.

// Función para obtener logo en base64
function getLogoBase64() {
  try {
    // Obtener path del archivo public/B2B_RootsBarefoot.png
    const logoPath = path.join(process.cwd(), 'public', 'B2B_RootsBarefoot.png');
    const logoBuffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch (error) {
    console.error('[regenerate-pdf] Error loading logo:', error);
    return null; // Si falla, no mostrar logo
  }
}

// Función auxiliar para validar UUID
function isValidUUID(id) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

export const POST = async ({ request, params }) => {
  try {
    const { id } = params;

    // 1. Validar UUID
    if (!isValidUUID(id)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invoice ID inválido'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Obtener factura completa con todos los datos
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !invoice) {
      console.error(`[regenerate-pdf] Factura no encontrada:`, fetchError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Factura no encontrada'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Validar que no esté cancelada
    if (invoice.status === 'cancelled') {
      console.error(`[regenerate-pdf] Intento de regenerar factura cancelada: ${id}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No se puede regenerar una factura cancelada'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Validar que tenemos datos esenciales
    if (!invoice.items_data || !Array.isArray(invoice.items_data)) {
      console.error(`[regenerate-pdf] items_data inválido o vacío:`, invoice.items_data);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Factura sin items_data válido',
          details: 'Los datos de items no se pueden renderizar'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Construir objeto de datos para renderizar
    const selectedCustomer = {
      fiscal_name: invoice.company_name,
      nif_cif: invoice.nif_cif,
      address: invoice.address,
      country: invoice.country,
      isRecharge: invoice.surcharge_applied || false
    };

    const invoiceData = {
      items: invoice.items_data,
      dni: ROOTS_DNI,
      iban: ROOTS_IBAN,
      selectedCustomer,
      shopify_order_number: invoice.shopify_order_number || null,
      preSale: invoice.is_preorder || false,
      title: 'Factura',
      translations: ui.es, // Traducciones en español
      logoUrl: getLogoBase64(), // Se pasa el logo al servidor
      onlyPage: false
    };

    // 6. Renderizar PDF en memoria usando @react-pdf/renderer
    let pdfBuffer;
    try {
      // Usar React.createElement en lugar de JSX directo para compatibilidad con .js
      const pdfComponent = React.createElement(InvoicePDFServer, invoiceData);
      pdfBuffer = await renderToBuffer(pdfComponent);
    } catch (renderError) {
      console.error(`[regenerate-pdf] Error renderizando PDF:`, renderError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Error al renderizar PDF',
          details: renderError.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 7. Subir PDF a Storage (SOBRESCRIBE el archivo anterior)
    if (!invoice.pdf_storage_path) {
      console.error(`[regenerate-pdf] pdf_storage_path no encontrado`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'PDF storage path no encontrado en BD'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error: uploadError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .update(invoice.pdf_storage_path, pdfBuffer, {
        upsert: true,
        contentType: 'application/pdf'
      });

    if (uploadError) {
      console.error(`[regenerate-pdf] Error uploading PDF:`, uploadError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Error al subir PDF a Storage',
          details: uploadError.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 8. Actualizar timestamp en BD
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        updated_at: now
      })
      .eq('id', id);

    if (updateError) {
      console.error(`[regenerate-pdf] Error updating timestamps:`, updateError);
      // No es fatal, el PDF fue actualizado en Storage
      // Solo log, retornar éxito de todas formas
    }

    // 9. Retornar respuesta exitosa
    return new Response(
      JSON.stringify({
        success: true,
        message: `PDF regenerado exitosamente${invoice.shopify_order_number ? ` con número Shopify: ${invoice.shopify_order_number}` : ''}`,
        invoice_id: id,
        invoice_number: invoice.invoice_number,
        shopify_order_number: invoice.shopify_order_number || null,
        pdf_storage_path: invoice.pdf_storage_path,
        pdf_last_regenerated_at: now
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Unexpected error in /api/invoices/[id]/regenerate-pdf:', error);
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
