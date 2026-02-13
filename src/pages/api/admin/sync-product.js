import { createClient } from '@supabase/supabase-js';
import { isUserAdmin } from '@lib/auth.js';

const SUPABASE_URL = import.meta.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_KEY;
const SHOPIFY_API_KEY = import.meta.env.SHOPIFY_API_KEY;
const SHOPIFY_URL = import.meta.env.SHOPIFY_URL;
const API_VERSION = "2025-04";

/**
 * POST /api/admin/sync-product
 * Sincroniza un único producto de Shopify → Supabase
 * 
 * Body: { shopify_product_id: number }
 */
export async function POST({ request }) {
  const startTime = Date.now();

  try {
    const isAdmin = await isUserAdmin(request);
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { shopify_product_id } = body;

    if (!shopify_product_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing shopify_product_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. Obtener producto de Shopify
    const shopifyUrl = `https://${SHOPIFY_URL}/admin/api/${API_VERSION}/products/${shopify_product_id}.json`;
    const shopifyResponse = await fetch(shopifyUrl, {
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!shopifyResponse.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Shopify API error: ${shopifyResponse.status}` 
        }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { product } = await shopifyResponse.json();

    // 2. Preparar datos del producto
    let tagsArray = [];
    if (product.tags) {
      if (typeof product.tags === 'string') {
        tagsArray = product.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      } else if (Array.isArray(product.tags)) {
        tagsArray = product.tags;
      }
    }

    const now = new Date().toISOString();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: 'public' },
      global: { headers: { Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
    });

    // 3. Upsert producto
    const { data: productData, error: productError } = await supabase
      .from('products')
      .upsert({
        shopify_product_id: product.id,
        shopify_name: product.title,
        tags: tagsArray,
        imagen: product.image?.src || null,
        shopify_price: product.variants[0]?.price ? parseFloat(product.variants[0].price) : null,
        link_a_shopify: `https://${SHOPIFY_URL}/products/${product.handle}`,
        last_synced_at: now
      }, {
        onConflict: 'shopify_product_id',
        ignoreDuplicates: false
      })
      .select('id')
      .single();

    if (productError) {
      throw new Error(`Error upserting producto: ${productError.message}`);
    }

    // 4. Preparar y upsert variantes
    const variantRows = product.variants.map(variant => {
      let talla = variant.option2;
      let color = variant.option1;
      if (variant.option1 && /\d/.test(variant.option1)) {
        talla = variant.option1;
        color = variant.option2;
      }

      return {
        product_id: productData.id,
        shopify_variant_id: variant.id,
        sku: variant.sku || null,
        talla: talla || null,
        color: color || null,
        precio: variant.price ? (parseFloat(variant.price) / 1.21).toFixed(2) : null,
        stock_actual: variant.inventory_quantity || 0,
        last_synced_at: now
      };
    });

    const { data: upsertedVariants, error: variantsError } = await supabase
      .from('product_variants')
      .upsert(variantRows, {
        onConflict: 'shopify_variant_id',
        ignoreDuplicates: false
      })
      .select('id');

    if (variantsError) {
      throw new Error(`Error upserting variantes: ${variantsError.message}`);
    }

    const duration = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        product_name: product.title,
        variants_synced: upsertedVariants.length,
        duration_ms: duration
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[SYNC PRODUCT] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
