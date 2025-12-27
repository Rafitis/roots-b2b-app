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

import { getNestedCatalog } from './stock_info.js';

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
 */
export async function completeOldInvoiceItems(items) {
  if (!items?.length) return items;

  // ¿Necesita completarse?
  const needsCompletion = items.some(i => !i.product_id || i.tag === undefined || !i.sku);
  if (!needsCompletion) return items;

  const catalog = await getNestedCatalog();
  if (!catalog?.length) return items;

  return items.map(item => {
    if (item.product_id && item.tag !== undefined && item.sku) return item;

    // Buscar variant en catálogo
    for (const product of catalog) {
      const variant = product.variants.find(v => v.ID_sku === Number(item.id));
      if (variant) {
        const tag = findDiscountTag(product.tags);
        return {
          ...item,
          product_id: item.product_id || product.ID_producto,
          tag: item.tag !== undefined ? item.tag : tag,
          sku: item.sku || variant.SKU
        };
      }
    }

    // Variant no encontrado - retornar con campos null
    return { ...item, product_id: null, tag: null, sku: null };
  });
}
