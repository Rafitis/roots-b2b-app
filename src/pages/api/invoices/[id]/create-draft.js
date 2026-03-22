/**
 * POST /api/invoices/[id]/create-draft
 *
 * Crea un Draft Order en Shopify a partir de una factura B2B:
 * 1. Valida que la factura exista y esté en estado 'pending_review'
 * 2. Valida que tenga email de cliente
 * 3. Busca al cliente en Shopify por email
 * 4. Obtiene precios Shopify de los variants desde Supabase
 * 5. Calcula el descuento global (total Shopify - total B2B)
 * 6. Crea el Draft Order en Shopify
 * 7. Actualiza la factura en Supabase con el ID y nombre del draft
 */

import { createClient } from '@supabase/supabase-js';
import { searchCustomerByEmail, createDraftOrder } from '@lib/shopify-draft.js';

const IVA_FACTOR = 1.21;

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export const POST = async ({ params, locals }) => {
  if (!locals?.isAdmin) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 403, headers: { 'Content-Type': 'application/json' }
    });
  }
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return json({ success: false, error: 'Faltan variables de entorno: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY' }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { id } = params;

    // 1. Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return json({ success: false, error: 'Invoice ID inválido' }, 400);
    }

    // 2. Obtener la factura
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('id, invoice_number, status, total_amount_eur, items_data, customer_email')
      .eq('id', id)
      .single();

    if (fetchError || !invoice) {
      return json({ success: false, error: 'Factura no encontrada' }, 404);
    }

    // 3. Validar estado
    if (invoice.status !== 'pending_review') {
      return json({
        success: false,
        error: `Solo se puede crear un Draft Order desde una factura en estado 'Pendiente de revisión'. Estado actual: ${invoice.status}`
      }, 400);
    }

    // 4. Validar email
    if (!invoice.customer_email) {
      return json({
        success: false,
        error: 'Esta factura no tiene email de cliente. Edítala y añade el email antes de crear el Draft.'
      }, 400);
    }

    // 5. Validar que tenga items
    if (!invoice.items_data || !Array.isArray(invoice.items_data) || invoice.items_data.length === 0) {
      return json({ success: false, error: 'La factura no tiene items' }, 400);
    }

    // 6. Buscar cliente en Shopify por email
    let customerId;
    try {
      customerId = await searchCustomerByEmail(invoice.customer_email);
    } catch (err) {
      console.error('[create-draft] Error buscando cliente en Shopify:', err);
      return json({ success: false, error: 'Error al conectar con Shopify. Inténtalo de nuevo.' }, 502);
    }

    if (!customerId) {
      return json({
        success: false,
        error: `El cliente con email "${invoice.customer_email}" no existe en Shopify. Créalo primero desde el panel de Shopify.`
      }, 404);
    }

    // 7. Obtener precios Shopify de los variants desde Supabase
    // El join key es items_data[].id = product_variants.shopify_variant_id
    const variantIds = invoice.items_data.map(item => String(item.id));

    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('shopify_variant_id, precio')
      .in('shopify_variant_id', variantIds);

    if (variantsError) {
      console.error('[create-draft] Error obteniendo variants:', variantsError);
      return json({ success: false, error: 'Error al obtener precios de productos' }, 500);
    }

    // Construir mapa variantId -> precio sin IVA
    const variantPriceMap = new Map(
      (variants || []).map(v => [String(v.shopify_variant_id), Number(v.precio)])
    );

    // 8. Construir line_items y calcular total Shopify
    const line_items = [];
    let totalShopify = 0;

    for (const item of invoice.items_data) {
      const variantId = String(item.id);
      const precioSinIva = variantPriceMap.get(variantId);

      if (precioSinIva === undefined) {
        console.warn(`[create-draft] Variant ${variantId} (SKU: ${item.sku}) no encontrado en Supabase. Variants disponibles: ${[...variantPriceMap.keys()]}`);
        return json({
          success: false,
          error: `El producto "${item.name}" (SKU: ${item.sku}) no se encontró en el catálogo. Sincroniza los productos e inténtalo de nuevo.`
        }, 400);
      }

      const quantity = Number(item.quantity);
      const precioConIvaUnit = round2(precioSinIva * IVA_FACTOR);
      const lineTotal = round2(precioConIvaUnit * quantity);
      totalShopify = round2(totalShopify + lineTotal);

      line_items.push({
        variant_id: Number(variantId),
        quantity
      });
    }

    // 9. Calcular descuento global
    const descuento = round2(totalShopify - Number(invoice.total_amount_eur));

    if (descuento < 0) {
      // Esto no debería ocurrir: el total B2B nunca debería superar el precio de tienda
      console.warn(`[create-draft] Descuento negativo: totalShopify=${totalShopify}, totalB2B=${invoice.total_amount_eur}`);
      return json({
        success: false,
        error: `El total de la factura B2B (${invoice.total_amount_eur} €) supera el precio de tienda Shopify (${totalShopify} €). Revisa los precios.`
      }, 400);
    }

    // 10. Crear Draft Order en Shopify
    let draftOrder;
    try {
      draftOrder = await createDraftOrder({
        customer_id: customerId,
        line_items,
        applied_discount: descuento,
        note: `Factura B2B: ${invoice.invoice_number}`,
        email: invoice.customer_email
      });
    } catch (err) {
      console.error('[create-draft] Error creando Draft Order en Shopify:', err);
      return json({
        success: false,
        error: `Error al crear el Draft Order en Shopify: ${err.message}`
      }, 502);
    }

    // 11. Actualizar factura en Supabase
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'shopify_draft',
        shopify_draft_order_id: draftOrder.id,
        shopify_draft_order_name: draftOrder.name,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      // El draft se creó en Shopify pero no se guardó en Supabase
      // Loguear con todos los datos para poder recuperar manualmente
      console.error('[create-draft] Draft creado en Shopify pero error al guardar en Supabase:', {
        invoice_id: id,
        shopify_draft_order_id: draftOrder.id,
        shopify_draft_order_name: draftOrder.name,
        error: updateError
      });
      return json({
        success: false,
        error: 'El Draft Order se creó en Shopify pero hubo un error al guardar en la base de datos. Contacta con soporte.',
        shopify_draft_order_id: draftOrder.id,
        shopify_draft_order_name: draftOrder.name
      }, 500);
    }

    // 12. Respuesta exitosa
    return json({
      success: true,
      message: `Draft Order ${draftOrder.name} creado correctamente en Shopify`,
      draft_order_id: draftOrder.id,
      draft_order_name: draftOrder.name,
      total_shopify: totalShopify,
      descuento_aplicado: descuento,
      status: 'shopify_draft'
    }, 200);

  } catch (error) {
    console.error('Unexpected error in /api/invoices/[id]/create-draft:', error);
    return json({ success: false, error: 'Error interno del servidor', details: error.message }, 500);
  }
};

/**
 * Helper para devolver respuestas JSON consistentes
 */
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
