// useCart.js
import { persistentAtom } from "@nanostores/persistent";
import { computed } from 'nanostores'
import { vatRates } from "@data/vatRates";
// Definimos el store usando la clave "cart" y un array vacío como valor inicial.
export const itemsStore = persistentAtom("cart", [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

// store derivado para el contador de items (suma de quantities)
export const cartCountStore = computed(itemsStore, (cart) => {
  if (!Array.isArray(cart)) return 0
  return cart.reduce((sum, item) => sum + item.quantity, 0)
})

// Función para obtener el carrito (si no es un array, devuelve [])
export function getCart() {
  const cart = itemsStore.get();
  return Array.isArray(cart) ? cart : [];
}

export function calculateTotal() {
  const cart = getCart();
  const total = cart.reduce((acc, item) => acc + item.quantity * (item.price * (1 - item.discount / 100)), 0);
  return total;
}

// TODO: DEPRECATED, se cambia a variant.ID_sku
function generateKey(product_id, size, color) {
  return `${product_id}_${size}_${color}`;
}

export function calculateDiscount(tag, quantity) {
  if (tag === "ROOTS CARE" || tag === "CALCETINES") {
    if (quantity >= 52) return 40; // 40% de descuento
    if (quantity >= 16) return 35; // 35% de descuento
    if (quantity >= 2) return 30; // 30% de descuento
    return 0;
  }
  return 0;
}

function getTotalItemsSameID(cart, product_id) {
  const sameModelProducts = cart.filter((item) => item.product_id === product_id);
  return sameModelProducts.reduce((acc, item) => acc + item.quantity, 0);
}

export function updateCartDiscount(tag, product_id) {
  const cart = getCart();
  // Filtramos todos los items del mismo producto
  const total_quantity = getTotalItemsSameID(cart, product_id);
  // Actualizamos el descuento de cada uno
  cart.forEach((item) => {
    if (item.product_id === product_id) {
      item.discount = calculateDiscount(tag, total_quantity);
    }
  });
  itemsStore.set(cart);
}

export function updateCartQuantity(item, newQuantity) {
  const cart = getCart();  

  const newCart = cart.map((cartItem) => {
    if (cartItem.id === item.id){
      return { ...cartItem, 
        quantity: newQuantity 
      };
    }
    return cartItem;
  });
  itemsStore.set(newCart);
}

export function addToCart({ tag, product, quantity, variant, isPreOrder }) {
  if (!quantity || quantity < 1) return;
  const key = variant.ID_sku;
  const cart = getCart();
  const productAlreadyAdded = cart.find((item) => item.id === key);

  if (productAlreadyAdded) {
    productAlreadyAdded.quantity += quantity;
    itemsStore.set(cart);
    updateCartDiscount(tag, product.ID_producto);
    return;
  }

  const discount = calculateDiscount(tag, quantity);
  const newItem = {
    id: key,
    product_img: product.imagen,
    product_id: product.ID_producto,
    name: product.nombre,
    quantity: quantity,
    discount: discount,
    size: variant.talla,
    color: variant.color,
    price: variant.precio,
    sku: variant.SKU,
    isPreOrder: isPreOrder,
    tag: tag,
  };

  itemsStore.set([...cart, newItem]);
  updateCartDiscount(tag, product.ID_producto);
}

//TODO: Funcióin para deprecar
export function addToCart_OLD({ tag, product, quantity, size, color }) {
  if (!quantity || quantity < 1) return;
  const key = generateKey(product.id, size, color);
  const cart = getCart();
  const productAlreadyAdded = cart.find((item) => item.id === key);

  if (productAlreadyAdded) {
    productAlreadyAdded.quantity += quantity;
    itemsStore.set(cart);
    updateCartDiscount(tag, product.product_id);
    return;
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
    tag: tag,
  };

  itemsStore.set([...cart, newItem]);
  updateCartDiscount(tag, product.id);
}

export function removeFromCart(element) {
  const key = element.id
  const cart = getCart();
  const newCart = cart.filter((item) => item.id !== key);
  itemsStore.set(newCart);
  updateCartDiscount(element.tag, element.product_id);
  return newCart;
}

export function removeAllFromCart() {
  itemsStore.set([]);
  return [];
}

/**
 * Añadir múltiples items al carrito de una vez
 * Usado cuando se carga un carrito desde una factura para edición
 * Espera items con estructura: { id, name, color, size, quantity, price, discount, product_img, isPreOrder, product_id, tag }
 */
export function addToCartMultiple(items) {
  if (!Array.isArray(items) || items.length === 0) return;

  // Limpiar carrito primero
  itemsStore.set([]);

  // Agregar todos los items
  itemsStore.set(items);

  // Recalcular descuentos por product_id
  const uniqueProductIds = [...new Set(items.map(item => item.product_id))];
  uniqueProductIds.forEach(product_id => {
    const item = items.find(i => i.product_id === product_id);
    if (item) {
      updateCartDiscount(item.tag, product_id);
    }
  });
}

export function calculateTotals({countryCode, isRecharge = false}) {
  const cart = getCart();

  // En Canarias no se aplica IVA
  const isCanaryIslandOrCeutaOrMelilla = countryCode === "ES-CN" || countryCode === "ES-CE" || countryCode === "ES-ML";
  const vatRate = vatRates[countryCode]?.vat || 21;

  const total_sin_iva = cart.reduce((acc, item) => acc + item.quantity * (item.price * (1 - item.discount / 100)), 0);
  const iva = isCanaryIslandOrCeutaOrMelilla ? 0 : total_sin_iva * (vatRate / 100);
  const total_recargo = isRecharge ?? 0 ? (total_sin_iva * 0.052) : 0;
  const total_factura = total_sin_iva + iva + total_recargo;
  return {
    total_sin_iva,
    iva,
    total_recargo,
    total_factura,
  };
}