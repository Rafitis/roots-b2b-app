/**
 * shopify-client.js
 *
 * Cliente HTTP compartido para la Admin API de Shopify.
 * Autenticación vía client credentials grant (OAuth de la Custom App
 * registrada en el Dev Dashboard). El token se cachea en memoria del
 * proceso SSR y se renueva automáticamente al expirar.
 *
 * Variables de entorno necesarias:
 *   SHOPIFY_URL           - Dominio de la tienda (ej: 50fc84.myshopify.com)
 *   SHOPIFY_CLIENT_ID     - Client ID de la app en el Dev Dashboard
 *   SHOPIFY_CLIENT_SECRET - Client Secret de la app en el Dev Dashboard
 */

const SHOPIFY_SHOP = import.meta.env.SHOPIFY_URL;
const SHOPIFY_CLIENT_ID = import.meta.env.SHOPIFY_CLIENT_ID;
const SHOPIFY_CLIENT_SECRET = import.meta.env.SHOPIFY_CLIENT_SECRET;

export const SHOPIFY_API_VERSION = '2025-04';

let _cachedToken = null;
let _tokenExpiresAt = 0;

/**
 * Obtiene un access token válido vía client credentials grant.
 * Reutiliza el token cacheado si no ha expirado (margen de 60s).
 * @returns {Promise<string>}
 */
export async function getToken() {
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
 * Devuelve la Response cruda de una petición autenticada a Shopify.
 * Útil cuando se necesita acceso a headers (ej: `Link` para paginación).
 * Acepta tanto rutas relativas (`/products.json`) como URLs absolutas
 * (las que devuelve Shopify en el header `Link` para la página siguiente).
 *
 * @param {string} pathOrUrl
 * @param {RequestInit} [options]
 * @returns {Promise<Response>}
 */
export async function shopifyFetchRaw(pathOrUrl, options = {}) {
  const token = await getToken();
  const url = pathOrUrl.startsWith('http')
    ? pathOrUrl
    : `https://${SHOPIFY_SHOP}/admin/api/${SHOPIFY_API_VERSION}${pathOrUrl}`;

  return fetch(url, {
    ...options,
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

/**
 * Petición autenticada a la Admin API que devuelve el JSON parseado.
 * Lanza si la respuesta no es 2xx.
 *
 * @param {string} path - Ruta relativa (ej: '/customers/search.json')
 * @param {RequestInit} [options]
 * @returns {Promise<any>}
 */
export async function shopifyFetch(path, options = {}) {
  const response = await shopifyFetchRaw(path, options);

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Shopify API error ${response.status}: ${errorBody}`);
  }

  return response.json();
}
