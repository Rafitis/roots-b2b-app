import { EXCLUDE_ID_PROUDUCTS, SHOES_DATA } from "@data/products.js";

const API_KEY = import.meta.env.SHOPIFY_API_KEY;
const SHOPIFY_URL = import.meta.env.SHOPIFY_URL;

export async function getShopifyProducts() {

  if (!API_KEY) {
    throw new Error("No se ha definido la clave de API de Shopify")
  }
  const data = await fetch(
    `https://${SHOPIFY_URL}/admin/api/2024-01/products.json?status=active`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": API_KEY
      }
    }).then((response) =>
    response.json()
  );

  const getProductPrice = (product) => {
    // Se calcula el precio sin IVA.
    if (SHOES_DATA[product.id]) {
      return (parseFloat(SHOES_DATA[product.id].price) / 1.21).toFixed(2)
    }
    return (parseFloat(product.variants[0].price) / 1.21).toFixed(2)
  }

  const products = data.products
    .filter((product) => !EXCLUDE_ID_PROUDUCTS.includes(product.id))
    .map((product) => ({
        id: product.id,
        img: product.images[0]?.src,
        tags: product.tags,
        link: `https://rootsbarefoot.com/products/${product.handle}`,
        name: product.title,
        Talla: product.options.find((option) => option.name === "Talla")?.values,
        Colores: product.options.find((option) => option.name === "Color")?.values,
        Cantidad: 0,
        Precio: getProductPrice(product),
        Status: product.status,
      })
    )


  function groupByExactTag(products) {
    return products.reduce((acc, product) => {
      // Usamos el string completo de 'tags' como clave.
      const tag = product.tags || "SIN_TAG";
      // Si está vacío, lo marcamos con "SIN_TAG" o lo que prefieras.

      // Inicializamos el array si no existe
      if (!acc[tag]) {
        acc[tag] = [];
      }

      // Añadimos el producto
      acc[tag].push(product);
      return acc;
    }, {});
  }

  const groupedByExactTag = groupByExactTag(products);

  return groupedByExactTag
}