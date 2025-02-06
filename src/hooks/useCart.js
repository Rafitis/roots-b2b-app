import { persistentAtom } from '@nanostores/persistent'

export const itemsStore = persistentAtom('cart', [], {
  encode: JSON.stringify,
  decode: JSON.parse,
})

function updateCartDiscount(tag, product_id){
   // Busco todos los elementos con el mismo ID
   const sameModelProduct = itemsStore.get('cart').filter((item) => item.product_id === product_id)

   let total_quantity = 0
   if (sameModelProduct) {
    sameModelProduct.forEach((item) => {
      total_quantity += item.quantity
    })
  }

  const cart = itemsStore.get('cart')
  cart.forEach((item) => {
    if (item.product_id === product_id) {
      item.discount = calculateDiscount(tag, total_quantity)
    }
  })
  
  itemsStore.set(itemsStore.get('cart'))
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

export function addToCart({tag, product, quantity, size, color}) {
  
  if (!quantity || quantity < 1) return
  // Buscamos si hay un producto ya añadido con elmismo ID, talla y color.
  const key = generateKey(product.id, size, color);
  const productAlreadyAdded = itemsStore.get('cart').find((item) => item.id === key)

  // Si existe, incrementamos la cantidad
  if (productAlreadyAdded) {
    productAlreadyAdded.quantity += quantity
    itemsStore.set(itemsStore.get('cart'))
    updateCartDiscount(tag, product.id)
    return
  }
  
  const discount = calculateDiscount(tag, quantity)
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
  }
  
  // Si no existe, añadimos el producto
  itemsStore.set([...itemsStore.get('cart'), newItem])
  updateCartDiscount(tag, product.id)
}

export function removeFromCart(element) {
  const key = generateKey(element.product_id, element.size, element.color);
  const newCart = itemsStore.get('cart').filter((item) => item.id !== key);
  itemsStore.set(newCart)
  updateCartDiscount(element.tag, element.product_id)
  return itemsStore.get('cart')
}

export function removeAllFromCart() {
  return itemsStore.set([])

}

export function getCart() {
  return itemsStore.get('cart')
}