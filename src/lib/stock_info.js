
import { EXCLUDE_ID_PROUDUCTS, SHOES_DATA } from "@data/products.js";
import { productsName } from "@i18n/ui";

const API_KEY = import.meta.env.SHOPIFY_API_KEY;
const SHOPIFY_URL = import.meta.env.SHOPIFY_URL;
const API_VERSION = "2025-04";

/**
 * Función que obtiene todos los productos de la tienda utilizando paginación simple.
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
 */
export async function getProductsBySKU() {
  const products = await getAllProducts();
  const productsInfo = extractProductsInfo(products);
  return productsInfo.filter(p => p.SKU);
}

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

export async function getNestedCatalog() {
  const products = await getAllProducts();  // de tu función previa
  const filteredProducts = products.filter(p => !EXCLUDE_ID_PROUDUCTS.includes(p.id));
  const catalog = filteredProducts.map(product => {
    // Desestructuramos lo que nos interesa del producto
    const {
      id: ID_producto,
      title: nombre,
      tags,
      handle,
      image,
      published_at,
      variants
    } = product;
  
    return {
      ID_producto,
      nombre,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      imagen: image ? image.src : null,
      link_a_shopify: `https://${SHOPIFY_URL}/products/${handle}`,
      status: published_at ? "active" : "inactive",
      variants: variants.map(variant => ({
        ID_sku:       variant.id,
        SKU:          variant.sku,
        talla:        variant.option1,
        color:        variant.option2,
        precio:       getProductPrice(product),
        stock_actual: variant.inventory_quantity || 0
      }))
    };
  });

  return catalog;
}
