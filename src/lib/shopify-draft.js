/**
 * shopify-draft.js
 *
 * Servicio para interactuar con la API de Shopify (Dev Dashboard app):
 * - Autenticación via client credentials grant (token expira cada 24h)
 * - Buscar clientes por email
 * - Crear Draft Orders con descuento global
 * - Consultar Draft Orders existentes
 *
 * Variables de entorno necesarias:
 *   SHOPIFY_CLIENT_ID     - Client ID de la app en el Dev Dashboard
 *   SHOPIFY_CLIENT_SECRET - Client Secret de la app en el Dev Dashboard
 *   SHOPIFY_URL           - Dominio de la tienda (ej: 50fc84.myshopify.com)
 */

const SHOPIFY_SHOP = import.meta.env.SHOPIFY_URL;
const SHOPIFY_CLIENT_ID = import.meta.env.SHOPIFY_CLIENT_ID;
const SHOPIFY_CLIENT_SECRET = import.meta.env.SHOPIFY_CLIENT_SECRET;
const API_VERSION = '2025-04';

// Caché del token en memoria (válido durante la vida del proceso SSR)
let _cachedToken = null;
let _tokenExpiresAt = 0;

/**
 * Obtiene un access token válido via client credentials grant.
 * Reutiliza el token cacheado si no ha expirado (con margen de 60s).
 * @returns {Promise<string>} Access token
 */
async function getToken() {
  if (_cachedToken && Date.now() < _tokenExpiresAt - 60_000) {
    return _cachedToken;
  }

  const response = await fetch(
    `https://${SHOPIFY_SHOP}/admin/oauth/access_token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: SHOPIFY_CLIENT_ID,
        client_secret: SHOPIFY_CLIENT_SECRET,
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Shopify token request failed ${response.status}: ${errorBody}`);
  }

  const { access_token, expires_in } = await response.json();
  _cachedToken = access_token;
  _tokenExpiresAt = Date.now() + expires_in * 1000;

  return _cachedToken;
}

/**
 * Hace una petición autenticada a la API REST de Shopify.
 * Obtiene el token automáticamente (con renovación si ha expirado).
 * @param {string} path - Ruta relativa (ej: '/customers/search.json')
 * @param {Object} options - Opciones de fetch
 * @returns {Promise<Object>} Respuesta JSON de Shopify
 */
async function shopifyFetch(path, options = {}) {
  const token = await getToken();
  const url = `https://${SHOPIFY_SHOP}/admin/api/${API_VERSION}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Shopify API error ${response.status}: ${errorBody}`);
  }

  return response.json();
}

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
