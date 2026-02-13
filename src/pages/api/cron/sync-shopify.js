import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_KEY;
const CRON_SECRET = import.meta.env.CRON_SECRET;
const SHOPIFY_API_KEY = import.meta.env.SHOPIFY_API_KEY;
const SHOPIFY_URL = import.meta.env.SHOPIFY_URL;
const API_VERSION = "2025-04";

/**
 * Endpoint de sincronización periódica Shopify → Supabase
 * 
 * Se ejecuta cada hora vía cron-job.org
 * Protegido por CRON_SECRET en el header Authorization
 * 
 * @route POST /api/cron/sync-shopify
 * @header Authorization: Bearer <CRON_SECRET>
 */
export async function POST({ request }) {
  const startTime = Date.now();

  try {
    // 1. Verificar autenticación del cron job
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token || token !== CRON_SECRET) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unauthorized: Invalid or missing CRON_SECRET' 
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Inicializar cliente Supabase con service key (bypass RLS)
    // La service key debe hacer bypass automático, pero necesitamos configurar
    // el esquema de autenticación correctamente
    if (!SUPABASE_SERVICE_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      }
    });

    // 3. Obtener todos los productos activos de Shopify
    console.log('[SYNC] Iniciando sync de Shopify...');
    const shopifyProducts = await getAllProductsFromShopify();
    console.log(`[SYNC] Obtenidos ${shopifyProducts.length} productos de Shopify`);

    const now = new Date().toISOString();

    // 4. Preparar batch de productos
    const productRows = shopifyProducts.map(product => {
      let tagsArray = [];
      if (product.tags) {
        if (typeof product.tags === 'string') {
          tagsArray = product.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
        } else if (Array.isArray(product.tags)) {
          tagsArray = product.tags;
        }
      }

      return {
        shopify_product_id: product.id,
        shopify_name: product.title,
        tags: tagsArray,
        imagen: product.image?.src || null,
        shopify_price: product.variants[0]?.price ? parseFloat(product.variants[0].price) : null,
        link_a_shopify: `https://${SHOPIFY_URL}/products/${product.handle}`,
        last_synced_at: now
      };
    });

    // 5. Batch upsert de productos (una sola query)
    const { data: upsertedProducts, error: productsError } = await supabase
      .from('products')
      .upsert(productRows, {
        onConflict: 'shopify_product_id',
        ignoreDuplicates: false
      })
      .select('id, shopify_product_id');

    if (productsError) {
      console.error('[SYNC] Error batch upserting productos:', productsError);
      throw new Error(`Error upserting productos: ${productsError.message}`);
    }

    const productsUpserted = upsertedProducts.length;
    console.log(`[SYNC] ${productsUpserted} productos upserted`);

    // 6. Crear mapa de shopify_product_id → UUID para las variantes
    const productIdMap = {};
    for (const p of upsertedProducts) {
      productIdMap[p.shopify_product_id] = p.id;
    }

    // 7. Preparar batch de variantes
    const variantRows = [];
    for (const product of shopifyProducts) {
      const productId = productIdMap[product.id];
      if (!productId) continue;

      for (const variant of product.variants) {
        let talla = variant.option2;
        let color = variant.option1;
        if (variant.option1 && /\d/.test(variant.option1)) {
          talla = variant.option1;
          color = variant.option2;
        }

        variantRows.push({
          product_id: productId,
          shopify_variant_id: variant.id,
          sku: variant.sku || null,
          talla: talla || null,
          color: color || null,
          precio: variant.price ? (parseFloat(variant.price) / 1.21).toFixed(2) : null,
          stock_actual: variant.inventory_quantity || 0,
          last_synced_at: now
        });
      }
    }

    // 8. Batch upsert de variantes (una sola query)
    const { data: upsertedVariants, error: variantsError } = await supabase
      .from('product_variants')
      .upsert(variantRows, {
        onConflict: 'shopify_variant_id',
        ignoreDuplicates: false
      })
      .select('id');

    if (variantsError) {
      console.error('[SYNC] Error batch upserting variantes:', variantsError);
      throw new Error(`Error upserting variantes: ${variantsError.message}`);
    }

    const variantsUpserted = upsertedVariants.length;
    const duration = Date.now() - startTime;

    console.log(`[SYNC] Completado: ${productsUpserted} productos, ${variantsUpserted} variantes en ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        products_synced: productsUpserted,
        variants_synced: variantsUpserted,
        duration_ms: duration,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[SYNC] Error general:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Obtiene todos los productos activos de Shopify usando paginación
 * (Reutiliza la lógica de getAllProducts de stock_info.js)
 */
async function getAllProductsFromShopify() {
  let todosLosProductos = [];
  let url = `https://${SHOPIFY_URL}/admin/api/${API_VERSION}/products.json?limit=250&status=active`;

  while (url) {
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error en Shopify API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.products && data.products.length > 0) {
      todosLosProductos = [...todosLosProductos, ...data.products];
    }

    // Verificar si hay página siguiente
    const linkHeader = response.headers.get('Link');
    url = null;

    if (linkHeader) {
      const nextLink = linkHeader.split(',').find(link => link.includes('rel="next"'));
      if (nextLink) {
        const matches = nextLink.match(/<(.*?)>/);
        if (matches && matches[1]) {
          url = matches[1];
        }
      }
    }
  }

  return todosLosProductos;
}
