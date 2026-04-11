import { productsName } from "@i18n/ui";
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export function translateProducts(products, currentLang) {
  return products.map(product => ({
    ...product,
    nombre: productsName[currentLang][product.ID_producto] || product.nombre,
    tags: product.tags.map(tag => productsName[currentLang][tag] || tag),
    variants: product.variants.map(variant => ({
      ...variant,
      color: productsName[currentLang][variant.color] || variant.color,
      talla: productsName[currentLang][variant.talla] || variant.talla
    }))
  }));
}

/**
 * Obtiene el catálogo completo desde Supabase (productos + variantes)
 * con los overrides del admin aplicados
 * 
 * Reemplaza las llamadas en vivo a Shopify por lectura de la DB
 * que se sincroniza cada hora vía cron
 */
export async function getNestedCatalog() {
  try {
    // Crear cliente Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Obtener productos con variantes desde Supabase
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        shopify_product_id,
        shopify_name,
        display_name,
        tags,
        imagen,
        shopify_price,
        price_override,
        is_visible,
        link_a_shopify,
        product_variants (
          shopify_variant_id,
          sku,
          talla,
          color,
          precio,
          stock_actual
        )
      `)
      .eq('is_visible', true)
      .order('shopify_name', { ascending: true });

    if (error) {
      console.error('[getNestedCatalog] Error fetching from Supabase:', error);
      return [];
    }

    if (!Array.isArray(products)) {
      console.error('[getNestedCatalog] Expected array, got:', products);
      return [];
    }

    // Filtrar productos con lógica de negocio
    const filteredProducts = products.filter(product => {
      // Excluir productos con tag "bundle" (lógica de negocio)
      if (!product.tags || product.tags.length === 0) return true;

      const tagsLower = product.tags.map(t => t.toLowerCase());
      return !tagsLower.includes('bundle');
    });

    // Mapear a formato esperado por los componentes
    const catalog = filteredProducts.map(product => {
      // Aplicar overrides de admin
      const nombre = product.display_name || product.shopify_name;
      
      // Calcular precio: usar price_override si existe, sino shopify_price
      // Ambos vienen CON IVA, dividir por 1.21 para obtener precio sin IVA
      const precioBase = product.price_override || product.shopify_price || 0;
      const precioSinIVA = (parseFloat(precioBase) / 1.21).toFixed(2);

      return {
        ID_producto: product.shopify_product_id,
        nombre: nombre,
        tags: product.tags || [],
        imagen: product.imagen,
        link_a_shopify: product.link_a_shopify,
        status: 'active', // Todos los productos en Supabase son activos (filtrados en el sync)
        variants: (product.product_variants || []).map(variant => ({
          ID_sku: variant.shopify_variant_id,
          SKU: variant.sku,
          talla: variant.talla,
          color: variant.color,
          precio: precioSinIVA, // Precio del producto aplicado a todas las variantes
          stock_actual: variant.stock_actual || 0
        })).sort((a, b) => {
          const tallaA = parseFloat(a.talla) || 0;
          const tallaB = parseFloat(b.talla) || 0;
          return tallaA - tallaB;
        })
      };
    });

    return catalog;
  } catch (error) {
    console.error('[getNestedCatalog] Error general:', error);
    return [];
  }
}
