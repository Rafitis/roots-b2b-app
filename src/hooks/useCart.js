// useCart.js
import { persistentAtom } from "@nanostores/persistent";

// Definimos el store usando la clave "cart" y un array vacío como valor inicial.
export const itemsStore = persistentAtom("cart", [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});


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
  // if (tag === "CALZADO") {
  //   if (quantity >= 40) return 10; // 40% de descuento
  // }
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

export function addToCart({ tag, product, quantity, size, color }) {
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
  const key = generateKey(element.product_id, element.size, element.color);
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
