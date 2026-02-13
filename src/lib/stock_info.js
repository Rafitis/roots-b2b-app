
import { EXCLUDE_ID_PROUDUCTS, SHOES_DATA } from "@data/products.js";
import { productsName } from "@i18n/ui";
import { createClient } from '@supabase/supabase-js';

const API_KEY = import.meta.env.SHOPIFY_API_KEY;
const SHOPIFY_URL = import.meta.env.SHOPIFY_URL;
const API_VERSION = "2025-04";
const SUPABASE_URL = import.meta.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_KEY;

/**
 * Función que obtiene todos los productos de la tienda utilizando paginación simple.
 * 
 * @deprecated Esta función solo se usa en el endpoint de sync (/api/cron/sync-shopify)
 * El catálogo cliente ahora lee desde Supabase vía getNestedCatalog()
 * No eliminar hasta verificar que no hay dependencias ocultas
 */
async function getAllProducts() {
  let todosLosProductos = [];
  let url = `https://${SHOPIFY_URL}/admin/api/${API_VERSION}/products.json?limit=250&status=active`;

  // Prepara las credenciales de autenticación (Básica)

  while (url) {
      const response = await fetch(url, {
        headers: {
          'X-Shopify-Access-Token': API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error en la API: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      
      // Si hay productos en esta página, agregarlos al array
      if (data.products && data.products.length > 0) {
        todosLosProductos = [...todosLosProductos, ...data.products];
      }
      
      // Verificar si hay una página siguiente
      const linkHeader = response.headers.get('Link');
      url = null; // Reiniciar URL
      
      if (linkHeader) {
        // Buscar el enlace para la siguiente página
        const nextLink = linkHeader.split(',').find(link => link.includes('rel="next"'));
        if (nextLink) {
          // Extraer la URL de la siguiente página
          const matches = nextLink.match(/<(.*?)>/);
          if (matches && matches[1]) {
            url = matches[1];
          }
        }
      }
    }

  return todosLosProductos;
}

/**
 * Extrae la información requerida de cada producto y de cada variante (SKU).
 * Se asume que:
 * - `option1` representa el color.
 * - `option2` representa la talla.
 * 
 * @deprecated Esta función solo se usaba con getAllProducts()
 * Ya no se llama desde el catálogo cliente
 * No eliminar hasta verificar que no hay dependencias ocultas
 */
function extractProductsInfo(products) {
  const productsInfo = [];
  const exclude_products_id = [10362115359051, 10370887778635, 10370888139083]

  products
    .filter((product) => !exclude_products_id.includes(product.id))
    .forEach(product => {
    const productId = product.id;
    const nombre = product.title;
    // Imagen principal del producto (se usa la primera imagen del producto)
    const imagen = product.image ? product.image.src : null;
    const tags = product.tags; // Usualmente un string separado por comas
    const shopifyLink = `https://${SHOPIFY_URL}/products/${product.handle}`;
    // Estado: activo si 'published_at' existe; de lo contrario, inactivo.
    const status = product.published_at ? "active" : "inactive";

    // Cada producto puede tener varias variantes, cada una con su SKU.
    product.variants.forEach(variant => {
      const sku = variant.sku;
      const talla = variant.option1; // Se asume que es la talla
      const color = variant.option2; // Se asume que es el color
      const precio = variant.price;
      // Inventario: en este ejemplo se toma inventory_quantity
      const stock_actual = variant.inventory_quantity || 0;
      // Se agrega el ID de la variante (SKU)
      const ID_sku = variant.id;

      const productoFormateado = {
        ID_producto: productId,
        imagen: imagen,
        tags: tags,
        link_a_shopify: shopifyLink,
        nombre: nombre,
        SKU: sku,
        ID_sku: ID_sku,
        talla: talla,
        color: color,
        precio: precio,
        status: status,
        stock_actual: stock_actual
      };

      productsInfo.push(productoFormateado);
    });
  });

  return productsInfo;
}

/**
 * Función principal que orquesta la obtención de productos,
 * extrae la información requerida y filtra aquellos productos que tienen un SKU asignado.
 * 
 * @deprecated CÓDIGO MUERTO - No tiene consumidores en el código actual
 * Candidato a eliminación en el futuro (verificar con búsqueda global primero)
 */
export async function getProductsBySKU() {
  const products = await getAllProducts();
  const productsInfo = extractProductsInfo(products);
  return productsInfo.filter(p => p.SKU);
}

/**
 * @deprecated Esta función usaba SHOES_DATA (hardcoded)
 * Ahora getNestedCatalog() lee price_override desde Supabase
 * Mantener por si hay dependencias ocultas
 */
const getProductPrice = (product) => {
  // Se calcula el precio sin IVA.
  if (SHOES_DATA[product.id]) {
    return (parseFloat(SHOES_DATA[product.id].price) / 1.21).toFixed(2)
  }
  return (parseFloat(product.variants[0].price) / 1.21).toFixed(2)
}

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
        }))
      };
    });

    return catalog;
  } catch (error) {
    console.error('[getNestedCatalog] Error general:', error);
    return [];
  }
}
