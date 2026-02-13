import { createClient } from '@supabase/supabase-js';
import { isUserAdmin } from '@lib/auth.js';

const SUPABASE_URL = import.meta.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_KEY;

/**
 * API de administración de productos
 * 
 * Permite a los admins gestionar el catálogo:
 * - GET: Listar todos los productos con variantes
 * - PUT: Actualizar overrides (display_name, price_override, is_visible)
 * - DELETE: Resetear overrides a defaults
 * 
 * @route /api/admin/products
 * @requires admin authentication
 */

/**
 * GET - Listar todos los productos con sus variantes
 * 
 * Respuesta:
 * {
 *   success: true,
 *   products: [{
 *     shopify_product_id, shopify_name, display_name, tags, imagen,
 *     shopify_price, price_override, is_visible, link_a_shopify,
 *     total_stock, variants: [...]
 *   }]
 * }
 */
export async function GET({ request }) {
  try {
    // Verificar que el usuario es admin
    const isAdmin = await isUserAdmin(request);
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unauthorized: Admin access required' 
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar cliente Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Obtener todos los productos con sus variantes
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        shopify_product_id,
        shopify_name,
        display_name,
        tags,
        imagen,
        shopify_price,
        price_override,
        is_visible,
        link_a_shopify,
        notes,
        last_synced_at,
        product_variants (
          id,
          shopify_variant_id,
          sku,
          talla,
          color,
          precio,
          stock_actual
        )
      `)
      .order('shopify_name', { ascending: true });

    if (error) {
      console.error('[ADMIN API] Error fetching products:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calcular stock total por producto
    const productsWithStock = products.map(product => {
      const totalStock = product.product_variants.reduce(
        (sum, variant) => sum + (variant.stock_actual || 0),
        0
      );

      return {
        ...product,
        total_stock: totalStock,
        variants: product.product_variants
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        products: productsWithStock
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ADMIN API] Error in GET:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * PUT - Actualizar overrides de un producto
 * 
 * Body:
 * {
 *   shopify_product_id: number (required),
 *   display_name?: string | null,
 *   price_override?: number | null,
 *   is_visible?: boolean,
 *   notes?: string | null
 * }
 * 
 * Respuesta:
 * {
 *   success: true,
 *   product: { ... }
 * }
 */
export async function PUT({ request }) {
  try {
    // Verificar que el usuario es admin
    const isAdmin = await isUserAdmin(request);
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unauthorized: Admin access required' 
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Leer y validar body
    const body = await request.json();
    const { shopify_product_id, display_name, price_override, is_visible, notes } = body;

    if (!shopify_product_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required field: shopify_product_id' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar price_override si se proporciona
    if (price_override !== undefined && price_override !== null) {
      const price = parseFloat(price_override);
      if (isNaN(price) || price < 0) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid price_override: must be a positive number or null' 
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Inicializar cliente Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Construir objeto de actualización (solo campos proporcionados)
    const updateData = { updated_at: new Date().toISOString() };
    if (display_name !== undefined) updateData.display_name = display_name;
    if (price_override !== undefined) updateData.price_override = price_override;
    if (is_visible !== undefined) updateData.is_visible = is_visible;
    if (notes !== undefined) updateData.notes = notes;

    // Actualizar producto
    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('shopify_product_id', shopify_product_id)
      .select()
      .single();

    if (error) {
      console.error('[ADMIN API] Error updating product:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!product) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Product not found: ${shopify_product_id}` 
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        product
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ADMIN API] Error in PUT:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * DELETE - Resetear overrides de un producto a defaults
 * 
 * Query params:
 *   ?shopify_product_id=123456
 * 
 * Resetea:
 * - display_name = NULL
 * - price_override = NULL
 * - is_visible = TRUE
 * - notes = NULL
 * 
 * Respuesta:
 * {
 *   success: true,
 *   product: { ... }
 * }
 */
export async function DELETE({ request }) {
  try {
    // Verificar que el usuario es admin
    const isAdmin = await isUserAdmin(request);
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unauthorized: Admin access required' 
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Leer y validar query params
    const url = new URL(request.url);
    const shopify_product_id = url.searchParams.get('shopify_product_id');

    if (!shopify_product_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required query param: shopify_product_id' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar cliente Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Resetear overrides a valores por defecto
    const { data: product, error } = await supabase
      .from('products')
      .update({
        display_name: null,
        price_override: null,
        is_visible: true,
        notes: null,
        updated_at: new Date().toISOString()
      })
      .eq('shopify_product_id', shopify_product_id)
      .select()
      .single();

    if (error) {
      console.error('[ADMIN API] Error resetting product:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!product) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Product not found: ${shopify_product_id}` 
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        product
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ADMIN API] Error in DELETE:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
