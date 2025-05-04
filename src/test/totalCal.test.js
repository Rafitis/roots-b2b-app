import {assert, test} from "vitest";
import { getCart, itemsStore, removeAllFromCart, updateCartDiscount, updateCartQuantity } from "@hooks/useCart";

test("calcula el total del carrito con descuento", async () => {
    removeAllFromCart();
    const mockCart = [
        {
            color: "",
            discount: 20,
            id: "10001_Pequeño: Talla 36-42_",
            name: "Banda correctora de Juanetes",
            price: "11.99",
            product_id: 10001,
            product_img: "https://cdn.shopify.com/",
            quantity: 12,
            size: "Pequeño: Talla 36-42",
            tag: "ROOTS CARE"
        },
        {
            color: "",
            discount: 20,
            id: "10002_S (35-39)_",
            name: "Espaciadores de dedos",
            price: "12.99",
            product_id: 10002,
            product_img: "https://cdn.shopify.com/",
            quantity: 10,
            size: "S (35-39)",
            tag: "ROOTS CARE"
        }
    ];
    const cart = getCart();
    const vatRate = 21;
    itemsStore.set([...cart, ...mockCart]);
    const {total_sin_iva} = await import("@hooks/useCart").then((module) => module.calculateTotals({vatRate}));
    assert.equal(total_sin_iva.toFixed(2), 219.02);
});

test("calcula el total del carrito sin descuento", async () => {
    removeAllFromCart();
    const mockCart = [
        {
            color: "",
            discount: 0,
            id: "10001_Pequeño: Talla 36-42_",
            name: "Banda correctora de Juanetes",
            price: "11.99",
            product_id: 10001,
            product_img: "https://cdn.shopify.com/",
            quantity: 1,
            size: "Pequeño: Talla 36-42",
            tag: "ROOTS CARE"
        },
        {
            color: "",
            discount: 0,
            id: "10002_S (35-39)_",
            name: "Espaciadores de dedos",
            price: "12.99",
            product_id: 10002,
            product_img: "https://cdn.shopify.com/",
            quantity: 1,
            size: "S (35-39)",
            tag: "ROOTS CARE"
        }
    ];
    const cart = getCart();
    const vatRate = 21;
    itemsStore.set([...cart, ...mockCart]);
    const {total_sin_iva} = await import("@hooks/useCart").then((module) => module.calculateTotals({vatRate}));
    assert.equal(total_sin_iva.toFixed(2), 24.98);
});

test("calcula el total del carrito despues de cambiar la cantidad de un producto", async () => {
    removeAllFromCart();
    const mockCart = [
        {
            color: "",
            discount: 0,
            id: "10001_Pequeño: Talla 36-42_",
            name: "Banda correctora de Juanetes",
            price: "9.91",
            product_id: 10001,
            product_img: "https://cdn.shopify.com/",
            quantity: 1,
            size: "Pequeño: Talla 36-42",
            tag: "ROOTS CARE"
        },
        {
            color: "",
            discount: 0,
            id: "10002_S (35-39)_",
            name: "Espaciadores de dedos",
            price: "10.74",
            product_id: 10002,
            product_img: "https://cdn.shopify.com/",
            quantity: 1,
            size: "S (35-39)",
            tag: "ROOTS CARE"
        }
    ]

    const cart = getCart()
    const vatRate = 21;
    itemsStore.set([...cart, ...mockCart])
    const {total_sin_iva} = await import("@hooks/useCart").then((module) => module.calculateTotals({vatRate}));
    assert.equal(total_sin_iva.toFixed(2), 20.65)
    
    const updateItem = {
        color: "",
        discount: 0,
        id: "10002_S (35-39)_",
        name: "Espaciadores de dedos",
        price: "12.99",
        product_id: 10002,
        product_img: "https://cdn.shopify.com/",
        quantity: 1,
        size: "S (35-39)",
        tag: "ROOTS CARE"
    }
    updateCartQuantity(updateItem, 2)
    updateCartDiscount(updateItem.tag, updateItem.product_id)
    const updatedCart = getCart()
    assert.equal(updatedCart[1].quantity, 2) // El item con id 8595970195787_S (35-39)_ tiene una nueva cantidad de 2
    const new_total = await import("@hooks/useCart").then((module) => module.calculateTotals({vatRate}));
    assert.equal(new_total.total_sin_iva.toFixed(2), 24.95)
})