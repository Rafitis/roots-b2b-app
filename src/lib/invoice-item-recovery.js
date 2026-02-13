/**
 * Completa datos faltantes de items de facturas antiguas
 *
 * ⚠️ DEPRECACIÓN FUTURA:
 * Este archivo solo es necesario para facturas creadas antes de 2025-12-27
 * que no tienen los campos product_id, tag y sku en items_data.
 *
 * Una vez que hayan pasado 6-12 meses (verano 2026), y todas las facturas
 * antiguas hayan sido editadas o ya no sean relevantes, este código se puede
 * eliminar completamente junto con la lógica de detección en copy-to-cart.js
 *
 * Para deprecar:
 * 1. Verificar que no hay facturas antiguas activas sin estos campos
 * 2. Eliminar este archivo
 * 3. Eliminar import y lógica de completeOldInvoiceItems en copy-to-cart.js
 * 4. Eliminar tests relacionados con lazy loading en invoice-edit.test.js
 */

import { supabase } from './supabase.js';

/**
 * Busca el tag que aplica descuento en el array de tags del producto
 * Reutiliza la lógica de calculateDiscount de useCart.js
 */
function findDiscountTag(productTags) {
  if (!Array.isArray(productTags)) return null;

  const tagsUpper = productTags.map(t => String(t).toUpperCase().trim());

  if (tagsUpper.some(t => t.includes('ROOTS CARE'))) return 'ROOTS CARE';
  if (tagsUpper.includes('CALCETINES')) return 'CALCETINES';

  return null;
}

/**
 * Completa items de factura antigua con datos de Shopify
 *
 * Usa una query directa a product_variants + products en Supabase
 * en lugar de cargar todo el catálogo con getNestedCatalog().
 */
export async function completeOldInvoiceItems(items) {
  if (!items?.length) return items;

  // ¿Necesita completarse?
  const needsCompletion = items.some(i => !i.product_id || i.tag === undefined || !i.sku);
  if (!needsCompletion) return items;

  // Recoger los variant IDs que necesitamos buscar
  const variantIds = items
    .filter(i => !i.product_id || i.tag === undefined || !i.sku)
    .map(i => Number(i.id))
    .filter(id => !isNaN(id));

  if (!variantIds.length) return items;

  // Query directa: solo los variants que necesitamos, con datos del producto padre
  const { data: variants, error } = await supabase
    .from('product_variants')
    .select('shopify_variant_id, sku, product_id, products(shopify_product_id, tags)')
    .in('shopify_variant_id', variantIds);

  if (error || !variants?.length) {
    console.error('completeOldInvoiceItems: error fetching variants', error);
    return items.map(item => {
      if (item.product_id && item.tag !== undefined && item.sku) return item;
      return { ...item, product_id: null, tag: null, sku: null };
    });
  }

  // Indexar por variant ID para lookup O(1)
  const variantMap = new Map();
  for (const v of variants) {
    variantMap.set(v.shopify_variant_id, v);
  }

  return items.map(item => {
    if (item.product_id && item.tag !== undefined && item.sku) return item;

    const match = variantMap.get(Number(item.id));
    if (match) {
      const tag = findDiscountTag(match.products?.tags);
      return {
        ...item,
        product_id: item.product_id || match.products?.shopify_product_id,
        tag: item.tag !== undefined ? item.tag : tag,
        sku: item.sku || match.sku
      };
    }

    // Variant no encontrado - retornar con campos null
    return { ...item, product_id: null, tag: null, sku: null };
  });
}
