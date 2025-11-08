/**
 * PUT /api/invoices/[id]/update-shopify-number.js
 *
 * Actualiza el número de pedido Shopify de una factura:
 * 1. Valida el ID de la factura
 * 2. Actualiza shopify_order_number en BD
 * 3. El PDF se regenerará con el número cuando se descargue nuevamente desde el admin
 *
 * Request body:
 * {
 *   shopify_order_number: "123456"
 * }
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

    // 2. Parsear body
    const body = await request.json();
    const { shopify_order_number } = body;

    if (typeof shopify_order_number !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'shopify_order_number debe ser texto'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Obtener la factura actual
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
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

    // 4. Validar que la factura no esté cancelada
    if (invoice.status === 'cancelled') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No se puede actualizar una factura cancelada'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Actualizar shopify_order_number en BD
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        shopify_order_number: shopify_order_number.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating shopify_order_number:', updateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Error al actualizar número de Shopify',
          details: updateError.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 6. Llamar a regenerate-pdf automáticamente
    // Esto genera un nuevo PDF con el número Shopify actualizado
    try {
      // Llamar al endpoint regenerate-pdf
      // Usando fetch interno (no requiere URL absoluta en Astro)
      const baseUrl = request.headers.get('origin') || 'http://localhost:3000';
      const regenerateUrl = `${baseUrl}/api/invoices/${id}/regenerate-pdf`;

      const regenerateResponse = await fetch(regenerateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || '',
          ...(request.headers.get('authorization') && {
            'authorization': request.headers.get('authorization')
          })
        }
      });

      if (!regenerateResponse.ok) {
        const regenerateData = await regenerateResponse.json();
        // No es crítico que falle aquí - el número ya fue guardado en BD
        // El PDF se puede regenerar manualmente después si es necesario
      }
    } catch (regenerateError) {
      console.error(`[update-shopify-number] Error calling regenerate-pdf:`, regenerateError);
      // Error al regenerar PDF no es fatal - el número fue guardado en BD
      // Continuamos sin fallar el request
    }

    // 7. Retornar respuesta exitosa
    // El número de Shopify fue actualizado en BD
    // La regeneración del PDF se intentó pero si falló, no es crítico
    return new Response(
      JSON.stringify({
        success: true,
        message: `Número de Shopify actualizado a: ${shopify_order_number}. PDF en proceso de regeneración...`,
        invoice_id: id,
        shopify_order_number
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in /api/invoices/[id]/update-shopify-number:', error);
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
