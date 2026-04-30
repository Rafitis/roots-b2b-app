/**
 * shopify-draft.js
 *
 * Operaciones sobre clientes y Draft Orders de Shopify.
 * La autenticación y el fetch genérico viven en `shopify-client.js`.
 */

import { shopifyFetch } from './shopify-client.js';

/**
 * Busca un cliente en Shopify por email.
 * @param {string} email - Email del cliente
 * @returns {Promise<number|null>} ID del cliente en Shopify, o null si no existe
 */
export async function searchCustomerByEmail(email) {
  if (!email) return null;

  const data = await shopifyFetch(
    `/customers/search.json?query=email:${encodeURIComponent(email)}&limit=1`
  );

  const customers = data?.customers || [];
  if (customers.length === 0) return null;

  // Verificar que el email coincide exactamente (la búsqueda puede devolver resultados parciales)
  const exactMatch = customers.find(
    c => c.email?.toLowerCase() === email.toLowerCase()
  );

  return exactMatch ? exactMatch.id : null;
}

/**
 * Crea un Draft Order en Shopify con descuento global.
 * @param {Object} params
 * @param {number} params.customer_id - ID del cliente en Shopify
 * @param {Array}  params.line_items  - Array de { variant_id, quantity }
 * @param {number} params.applied_discount - Descuento en EUR (fixed_amount)
 * @param {string} params.note  - Nota del draft (ej: número de factura B2B)
 * @param {string} params.email - Email del cliente
 * @returns {Promise<Object>} Draft Order creado por Shopify
 */
export async function createDraftOrder({ customer_id, line_items, applied_discount, note, email }) {
  const body = {
    draft_order: {
      customer: { id: customer_id },
      line_items,
      note,
      email,
      use_customer_default_address: true,
      // Descuento global fixed_amount a nivel de Draft Order
      applied_discount: applied_discount > 0 ? {
        value_type: 'fixed_amount',
        value: applied_discount.toFixed(2),
        amount: applied_discount.toFixed(2),
        title: 'Descuento B2B',
        description: 'Descuento B2B aplicado'
      } : undefined
    }
  };

  const data = await shopifyFetch('/draft_orders.json', {
    method: 'POST',
    body: JSON.stringify(body)
  });

  return data.draft_order;
}

/**
 * Obtiene un Draft Order existente de Shopify.
 * @param {number} draftOrderId - ID del Draft Order en Shopify
 * @returns {Promise<Object>} Draft Order
 */
export async function getDraftOrder(draftOrderId) {
  const data = await shopifyFetch(`/draft_orders/${draftOrderId}.json`);
  return data.draft_order;
}
