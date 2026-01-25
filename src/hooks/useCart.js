// useCart.js
import { persistentAtom } from "@nanostores/persistent";
import { computed } from 'nanostores'
import { useStore } from '@nanostores/react';
import { useMemo } from 'react';
import { calculateTotals as calculateTotalsLib } from "@lib/invoice-calculations.js";
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
  // Actualizamos el descuento creando un nuevo array (sin mutar)
  const updatedCart = cart.map((item) => {
    if (item.product_id === product_id) {
      return {
        ...item,
        discount: calculateDiscount(tag, total_quantity)
      };
    }
    return item;
  });
  itemsStore.set(updatedCart);
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
    color: variant.color || '', // Normalizar null/undefined a string vacío
    price: Number(variant.precio), // Convertir a número para validación
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
    color: color || '', // Normalizar null/undefined a string vacío
    price: Number(product.Precio), // Convertir a número para validación
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

  // Normalizar datos de los items (convertir tipos)
  const normalizedItems = items.map(item => ({
    ...item,
    color: item.color || '', // Normalizar null/undefined a string vacío
    price: Number(item.price), // Convertir a número para validación
  }));

  // Agregar todos los items normalizados
  itemsStore.set(normalizedItems);

  // Recalcular descuentos por product_id
  const uniqueProductIds = [...new Set(normalizedItems.map(item => item.product_id))];
  uniqueProductIds.forEach(product_id => {
    const item = normalizedItems.find(i => i.product_id === product_id);
    if (item) {
      updateCartDiscount(item.tag, product_id);
    }
  });
}

/**
 * Calcula todos los totales de una factura (sin incluir envío)
 * Usa la función centralizada de invoice-calculations.js
 *
 * @param {string} countryCode - Código de país (ej: 'ES', 'FR', 'ES-CN')
 * @param {boolean} isRecharge - Si aplicar recargo de equivalencia (5.2%)
 * @returns {Object} { total_sin_iva, iva, total_recargo, total_factura }
 */
export function calculateTotals({countryCode = 'ES', isRecharge = false}) {
  const cart = getCart();

  // Usar función centralizada que NO incluye envío (para compatibilidad con store)
  return calculateTotalsLib({
    items: cart,
    countryCode,
    applyRecharge: isRecharge,
    includeShipping: false
  });
}

// ============================================================================
// HOOKS REACTIVOS - Solución al bug de race condition
// ============================================================================

/**
 * Hook reactivo para obtener items del carrito
 * Se actualiza automáticamente cuando itemsStore cambia (sin delay)
 *
 * VENTAJA: Usa useStore directamente, sin suscripción manual ni setState
 *
 * @returns {Array} Array de items del carrito
 */
export function useCartItems() {
  return useStore(itemsStore);
}

/**
 * Hook reactivo para obtener totales del carrito con memoización
 *
 * SOLUCIÓN AL BUG:
 * - Lee directamente de itemsStore con useStore (sin delay de suscripción)
 * - Memoiza cálculos con useMemo (optimización de performance)
 * - Centraliza lógica (todos los componentes usan la misma fuente)
 * - Elimina race conditions entre estado local de React y localStorage
 *
 * @param {Object} customerInfo - Info del cliente con country e isRecharge
 * @param {boolean} includeShipping - Si incluir envío en totales (default: true)
 * @returns {Object} { total_sin_iva, iva, recargo, shipping, total_factura, vatRate }
 *
 * @example
 * const totals = useCartTotals(customerInfo, true);
 * console.log(totals.total_factura); // Total con IVA + recargo + envío
 */
export function useCartTotals(customerInfo = {}, includeShipping = true) {
  // ✅ Leer items directamente del store (reactivo, sin delay)
  const items = useStore(itemsStore);

  // ✅ Memoizar totales para evitar cálculos innecesarios
  const totals = useMemo(() => {
    const countryCode = customerInfo.country || 'ES';
    const applyRecharge = customerInfo.isRecharge || false;

    return calculateTotalsLib({
      items,
      countryCode,
      applyRecharge,
      includeShipping
    });
  }, [items, customerInfo.country, customerInfo.isRecharge, includeShipping]);

  return totals;
}

/**
 * Función para obtener totales SIN reactividad (para uso en handlers/callbacks)
 * Útil cuando necesitas los totales en el momento exacto de ejecución
 *
 * CASO DE USO: En saveInvoiceToServer(), leer totales AHORA sin depender de props
 *
 * @param {Object} customerInfo - Info del cliente
 * @param {boolean} includeShipping - Si incluir envío
 * @returns {Object} Totales calculados en este instante
 *
 * @example
 * const handleSave = () => {
 *   const currentTotals = getCartTotals(customerInfo, true);
 *   // currentTotals está garantizado actualizado AHORA
 * }
 */
export function getCartTotals(customerInfo = {}, includeShipping = true) {
  const items = itemsStore.get(); // Leer valor actual sin suscripción
  const countryCode = customerInfo.country || 'ES';
  const applyRecharge = customerInfo.isRecharge || false;

  return calculateTotalsLib({
    items,
    countryCode,
    applyRecharge,
    includeShipping
  });
}