import { c as createComponent, a as createAstro, r as renderTemplate, m as maybeRenderHead, d as addAttribute, b as renderComponent } from '../chunks/astro/server_BFFKcOHT.mjs';
import { $ as $$Layout } from '../chunks/Layout_CypyUPBc.mjs';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { useState } from 'react';
import { persistentAtom } from '@nanostores/persistent';
import toast, { Toaster } from 'react-hot-toast';
import { g as getUser } from '../chunks/auth_DjuBR8u0.mjs';
export { renderers } from '../renderers.mjs';

function CartIcon() {
  return /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "icon icon-tabler icons-tabler-outline icon-tabler-shopping-cart", children: [
    /* @__PURE__ */ jsx("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    /* @__PURE__ */ jsx("path", { d: "M6 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }),
    /* @__PURE__ */ jsx("path", { d: "M17 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }),
    /* @__PURE__ */ jsx("path", { d: "M17 17h-11v-14h-2" }),
    /* @__PURE__ */ jsx("path", { d: "M6 5l14 1l-1 7h-13" })
  ] });
}
function LinkIcon() {
  return /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "#64748b", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "icon icon-tabler icons-tabler-outline icon-tabler-link", children: [
    /* @__PURE__ */ jsx("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    /* @__PURE__ */ jsx("path", { d: "M9 15l6 -6" }),
    /* @__PURE__ */ jsx("path", { d: "M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464" }),
    /* @__PURE__ */ jsx("path", { d: "M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463" })
  ] });
}

const itemsStore = persistentAtom('cart', [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

function updateCartDiscount(tag, product_id){
   // Busco todos los elementos con el mismo ID
   const sameModelProduct = itemsStore.get('cart').filter((item) => item.product_id === product_id);

   let total_quantity = 0;
   if (sameModelProduct) {
    sameModelProduct.forEach((item) => {
      total_quantity += item.quantity;
    });
  }

  const cart = itemsStore.get('cart');
  cart.forEach((item) => {
    if (item.product_id === product_id) {
      item.discount = calculateDiscount(tag, total_quantity);
    }
  });
  
  itemsStore.set(itemsStore.get('cart'));
}

function calculateDiscount(tag,quantity) {
  if (tag === "ROOTS CARE" || tag === "CALCETINES") {
    if (quantity >= 52) return 30; // 15% de descuento
    if (quantity >= 16) return 25; // 10% de descuento
    if (quantity >= 2) return 20; // 5% de descuento
    return 0;
  }
  return 0;
}

function generateKey(product_id, size, color) {
  return `${product_id}_${size}_${color}`;
}

function addToCart({tag, product, quantity, size, color}) {
  
  if (!quantity || quantity < 1) return
  // Buscamos si hay un producto ya añadido con elmismo ID, talla y color.
  const key = generateKey(product.id, size, color);
  const productAlreadyAdded = itemsStore.get('cart').find((item) => item.id === key);

  // Si existe, incrementamos la cantidad
  if (productAlreadyAdded) {
    productAlreadyAdded.quantity += quantity;
    itemsStore.set(itemsStore.get('cart'));
    updateCartDiscount(tag, product.id);
    return
  }
  
  const discount = calculateDiscount(tag, quantity);
  const newItem = {
    id: key,
    product_img: product.img,
    product_id: product.id,
    name: product.name,
    quantity: quantity,
    discount: discount,
    size: size,
    color: color,
    price: product.Precio,
    tag: tag
  };
  
  // Si no existe, añadimos el producto
  itemsStore.set([...itemsStore.get('cart'), newItem]);
  updateCartDiscount(tag, product.id);
}

function AddButton({ product, tag }) {
  const notify = () => toast.success("Producto añadido al carrito");
  function handleAddElementToCart() {
    console.log(quantity, sizeSelected, colorSelected);
    addToCart({ tag, product, quantity, size: sizeSelected, color: colorSelected });
    const quantityInput = document.getElementById("cantidad-producto" + product.id);
    console.log(quantityInput);
    quantityInput.value = "";
    setQuantity(0);
    setColorSelected("");
    setSizeSelected("");
    notify();
  }
  const [quantity, setQuantity] = useState(0);
  const [colorSelected, setColorSelected] = useState("");
  const [sizeSelected, setSizeSelected] = useState("");
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { class: "flex flex-row gap-2 pb-4", children: [
      product?.Colores && /* @__PURE__ */ jsxs("select", { defaultValue: "Color", class: "select select-bordered w-full max-w-xs", onChange: (e) => setColorSelected(e.target.value), children: [
        /* @__PURE__ */ jsx("option", { disabled: true, children: "Color" }),
        product?.Colores.map((color) => /* @__PURE__ */ jsx("option", { value: color, children: color }, color))
      ] }, "color"),
      product?.Talla && /* @__PURE__ */ jsxs("select", { defaultValue: "Talla", class: "select select-bordered w-full max-w-xs", onChange: (e) => setSizeSelected(e.target.value), children: [
        /* @__PURE__ */ jsx("option", { disabled: true, children: "Talla" }),
        product?.Talla.map((size) => /* @__PURE__ */ jsx("option", { value: size, children: size }, size))
      ] }, "size")
    ] }),
    /* @__PURE__ */ jsx("div", { class: "pb-2", children: /* @__PURE__ */ jsx("input", { id: "cantidad-producto" + product?.id, type: "text", placeholder: "Cantidad", class: "input input-bordered w-full max-w-xs", onChange: (e) => setQuantity(Number(e.target.value)) }) }),
    /* @__PURE__ */ jsx("div", { class: "card-actions justify-center pb-4", children: /* @__PURE__ */ jsxs("button", { className: "btn btn-primary btn-md", onClick: handleAddElementToCart, children: [
      /* @__PURE__ */ jsx(Toaster, { position: "top-right", reverseOrder: false }),
      /* @__PURE__ */ jsx(CartIcon, {}),
      "Añadir producto"
    ] }) })
  ] });
}

const $$Astro$2 = createAstro();
const $$CardProduct = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$CardProduct;
  const { product, tag } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="card bg-base-100 w-80 shadow-xl"> <figure> <img${addAttribute(product?.img, "src")}${addAttribute(product?.name, "alt")} class="rounded-xl"> </figure> <div class="card-body"> <h2 class="card-title"> ${product?.name} <a${addAttribute(product?.link, "href")} target="_blank" rel="noopener noreferrer"> ${renderComponent($$result, "LinkIcon", LinkIcon, {})} </a> </h2> ${renderComponent($$result, "AddButton", AddButton, { "client:load": true, "product": product, "tag": tag, "client:component-hydration": "load", "client:component-path": "@components/AddButton.jsx", "client:component-export": "default" })} </div> </div>`;
}, "/home/rafitis/2025_projects/rootsbarefoot-b2b-app/src/components/CardProduct.astro", undefined);

const $$Astro$1 = createAstro();
const $$Products = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Products;
  const { products } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<section> ${Object.entries(products).map(([tag, productList]) => renderTemplate`<div style="margin-bottom: 2rem;">  <h2 class="text-2xl font-bold mb-5">${tag}</h2> <div class="divider"></div>  <ul class="flex flex-wrap gap-4"> ${productList.map((product) => renderTemplate`<li class="flex gap-4"> ${renderComponent($$result, "CardProduct", $$CardProduct, { "product": product, "tag": tag })} </li>`)} </ul> </div>`)} </section>`;
}, "/home/rafitis/2025_projects/rootsbarefoot-b2b-app/src/components/Products.astro", undefined);

const EXCLUDE_ID_PROUDUCTS =  [10362115359051, 10370887778635, 10370888139083];
const SHOES_DATA = {
  8841273639243: {
    "name": "Roots Freedom Negras",
    "price": 54.20,
  },
  8853578744139: {
    "name": "Roots Freedom Negras",
    "price": 54.20,
  },
  10080761151819: {
    "name": "Roots Urban Beige",
    "price": 56.25,
  },
  10093317783883: {
    "name": "Roots Urban Grises",
    "price": 56.25,
  },
  8586217324875: {
    "name": "Roots Causal",
    "price": 52.03,
  },
  10296061886795: {
    "name": "Roots Explorer Antracita",
    "price": 59.90,
  },
  10296062443851: {
    "name": "Roots Explorer Oliva",
    "price": 59.90,
  },
  10338027995467: {
    "name": "Roots Platillas Warmer",
    "price": 3.99,
  },
  10221487522123: {
    "name": "Roots Platillas Wider",
    "price": 3.99,
  },
  10407260225867: {
    "name": "Roots Platillas Active",
    "price": 3.99,
  }
};

const API_KEY = "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";
const SHOPIFY_URL = "50fc84.myshopify.com";
async function getShopifyProducts() {
  const data = await fetch(
    `https://${SHOPIFY_URL}/admin/api/2024-01/products.json?status=active`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": API_KEY
      }
    }
  ).then(
    (response) => response.json()
  );
  const getProductPrice = (product) => {
    if (SHOES_DATA[product.id]) {
      return parseFloat(SHOES_DATA[product.id].price).toFixed(2);
    }
    return parseFloat(product.variants[0].price).toFixed(2);
  };
  const products = data.products.filter((product) => !EXCLUDE_ID_PROUDUCTS.includes(product.id)).map(
    (product) => ({
      id: product.id,
      img: product.images[0]?.src,
      tags: product.tags,
      link: `https://rootsbarefoot.com/products/${product.handle}`,
      name: product.title,
      Talla: product.options.find((option) => option.name === "Talla")?.values,
      Colores: product.options.find((option) => option.name === "Color")?.values,
      Cantidad: 0,
      Precio: getProductPrice(product),
      Status: product.status
    })
  );
  function groupByExactTag(products2) {
    return products2.reduce((acc, product) => {
      const tag = product.tags || "SIN_TAG";
      if (!acc[tag]) {
        acc[tag] = [];
      }
      acc[tag].push(product);
      return acc;
    }, {});
  }
  const groupedByExactTag = groupByExactTag(products);
  return groupedByExactTag;
}

const $$Astro = createAstro();
const prerender = false;
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const user = await getUser(Astro2.request);
  if (!user) {
    return Astro2.redirect("/signin");
  }
  const groupedByExactTag = await getShopifyProducts();
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Welcome to Roots Barefoot Budget Generator" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="container mx-auto w-full place-content-center"> ${renderComponent($$result2, "Products", $$Products, { "products": groupedByExactTag })} </main> ` })}`;
}, "/home/rafitis/2025_projects/rootsbarefoot-b2b-app/src/pages/index.astro", undefined);

const $$file = "/home/rafitis/2025_projects/rootsbarefoot-b2b-app/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$Index,
    file: $$file,
    prerender,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
