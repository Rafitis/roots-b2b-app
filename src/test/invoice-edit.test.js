/**
 * Tests para verificar que la edición de facturas mantiene los descuentos correctamente
 *
 * Este test previene el bug donde al editar una factura, los items pierden
 * los campos product_id y tag, causando que los descuentos se pierdan.
 */

import { assert, describe, test, beforeEach } from "vitest";
import {
  removeAllFromCart,
  addToCartMultiple,
  getCart,
  calculateDiscount,
  updateCartQuantity,
  updateCartDiscount
} from "@hooks/useCart";

describe("Edición de facturas - Preservación de descuentos", () => {

  beforeEach(() => {
    // Limpiar carrito antes de cada test
    removeAllFromCart();
  });

  test("items_data debe incluir todos los campos necesarios para recalcular descuentos", () => {
    // Simular items en el carrito (con todos los campos)
    const cartItems = [
      {
        id: "46841358745931",
        product_id: 8001, // Campo crítico
        tag: "ROOTS CARE", // Campo crítico
        name: "Pelota de masaje y acupresión.",
        size: null,
        color: "Default Title",
        price: 9.91,
        quantity: 4,
        discount: 30,
        isPreOrder: false,
        product_img: "https://cdn.shopify.com/example.jpg",
        sku: "RB-070"
      },
      {
        id: "50514992169291",
        product_id: 8002, // Campo crítico
        tag: "CALCETINES", // Campo crítico
        name: "Calcetines 5 dedos- Media Caña",
        size: "35-39",
        color: "Gris",
        price: 9.08,
        quantity: 40,
        discount: 35,
        isPreOrder: false,
        product_img: "https://cdn.shopify.com/example2.jpg",
        sku: "CALC-35-39-GRIS"
      }
    ];

    // Simular lo que hace InvoiceDownload.jsx al guardar items_data
    const itemsData = cartItems.map(item => {
      const single_price = Number(item.price);
      const discountFactor = 1 - Number(item.discount) / 100;
      const total = (item.quantity * single_price * discountFactor).toFixed(2);

      return {
        id: item.id,
        product_id: item.product_id, // ✅ Debe incluirse
        tag: item.tag, // ✅ Debe incluirse
        name: item.name,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        price: single_price,
        discount: item.discount,
        total: parseFloat(total),
        product_img: item.product_img,
        isPreOrder: item.isPreOrder,
        sku: item.sku // ✅ Debe incluirse
      };
    });

    // VERIFICACIÓN: items_data debe tener product_id y tag
    assert.isDefined(itemsData[0].product_id, "items_data debe incluir product_id");
    assert.isDefined(itemsData[0].tag, "items_data debe incluir tag");
    assert.isDefined(itemsData[0].sku, "items_data debe incluir sku");

    assert.equal(itemsData[0].product_id, 8001);
    assert.equal(itemsData[0].tag, "ROOTS CARE");
    assert.equal(itemsData[1].tag, "CALCETINES");
  });

  test("addToCartMultiple debe mantener descuentos cuando se cargan items desde factura", () => {
    // Simular items cargados desde items_data (con product_id y tag)
    const itemsFromInvoice = [
      {
        id: "46841358745931",
        product_id: 8001,
        tag: "ROOTS CARE",
        name: "Pelota de masaje y acupresión.",
        size: null,
        color: "Default Title",
        price: 9.91,
        quantity: 4,
        discount: 30,
        isPreOrder: false,
        product_img: "https://cdn.shopify.com/example.jpg",
        sku: "RB-070"
      },
      {
        id: "50514992169291",
        product_id: 8002,
        tag: "CALCETINES",
        name: "Calcetines 5 dedos- Media Caña",
        size: "35-39",
        color: "Gris",
        price: 9.08,
        quantity: 40,
        discount: 35,
        isPreOrder: false,
        product_img: "https://cdn.shopify.com/example2.jpg",
        sku: "CALC-35-39-GRIS"
      }
    ];

    // Cargar items al carrito (simula edición de factura)
    addToCartMultiple(itemsFromInvoice);

    // Obtener carrito actualizado
    const cart = getCart();

    // VERIFICACIÓN: Los descuentos deben mantenerse
    assert.equal(cart.length, 2, "Debe haber 2 items en el carrito");

    const item1 = cart.find(i => i.id === "46841358745931");
    const item2 = cart.find(i => i.id === "50514992169291");

    assert.isDefined(item1, "Item 1 debe estar en el carrito");
    assert.isDefined(item2, "Item 2 debe estar en el carrito");

    // Los descuentos deben mantenerse correctamente
    // Item 1: 4 unidades de ROOTS CARE → descuento 30%
    assert.equal(item1.discount, 30, "Item 1 debe mantener descuento del 30%");
    assert.equal(item1.product_id, 8001, "Item 1 debe tener product_id");
    assert.equal(item1.tag, "ROOTS CARE", "Item 1 debe tener tag");

    // Item 2: 40 unidades de CALCETINES → descuento 35%
    assert.equal(item2.discount, 35, "Item 2 debe mantener descuento del 35%");
    assert.equal(item2.product_id, 8002, "Item 2 debe tener product_id");
    assert.equal(item2.tag, "CALCETINES", "Item 2 debe tener tag");
  });

  test("addToCartMultiple SIN product_id/tag debe fallar o dar descuento 0%", () => {
    // Simular items ANTIGUOS sin product_id ni tag (bug actual)
    const itemsWithoutRequiredFields = [
      {
        id: "46841358745931",
        // ❌ Falta product_id
        // ❌ Falta tag
        name: "Pelota de masaje y acupresión.",
        size: null,
        color: "Default Title",
        price: 9.91,
        quantity: 4,
        discount: 30,
        isPreOrder: false,
        product_img: "https://cdn.shopify.com/example.jpg"
      }
    ];

    // Cargar items sin product_id/tag
    addToCartMultiple(itemsWithoutRequiredFields);

    const cart = getCart();
    const item = cart[0];

    // VERIFICACIÓN: Sin tag, el descuento se recalcula a 0%
    // porque calculateDiscount(undefined, quantity) retorna 0
    assert.equal(item.discount, 0, "Sin tag, el descuento debe ser 0%");
    assert.isUndefined(item.product_id, "product_id debe ser undefined");
    assert.isUndefined(item.tag, "tag debe ser undefined");
  });

  test("calculateDiscount debe retornar 0 cuando tag es undefined", () => {
    // VERIFICACIÓN: Esta es la causa raíz del bug
    const discount1 = calculateDiscount(undefined, 10);
    const discount2 = calculateDiscount(undefined, 50);
    const discount3 = calculateDiscount("INVALID_TAG", 50);

    assert.equal(discount1, 0, "calculateDiscount(undefined, 10) debe retornar 0");
    assert.equal(discount2, 0, "calculateDiscount(undefined, 50) debe retornar 0");
    assert.equal(discount3, 0, "calculateDiscount('INVALID_TAG', 50) debe retornar 0");
  });

  test("calculateDiscount debe aplicar descuentos correctos por tier", () => {
    // VERIFICACIÓN: Función básica de descuentos
    assert.equal(calculateDiscount("ROOTS CARE", 1), 0, "1 unidad → 0%");
    assert.equal(calculateDiscount("ROOTS CARE", 2), 30, "2 unidades → 30%");
    assert.equal(calculateDiscount("ROOTS CARE", 16), 35, "16 unidades → 35%");
    assert.equal(calculateDiscount("ROOTS CARE", 52), 40, "52 unidades → 40%");

    assert.equal(calculateDiscount("CALCETINES", 2), 30, "2 calcetines → 30%");
    assert.equal(calculateDiscount("CALCETINES", 16), 35, "16 calcetines → 35%");
    assert.equal(calculateDiscount("CALCETINES", 52), 40, "52 calcetines → 40%");
  });

  test("INTEGRACIÓN: simular carga desde BD con items_data completo", () => {
    // Simular items_data guardado en la BD (estructura real después del fix)
    const itemsDataFromDB = `[
      {
        "id": "46841358745931",
        "product_id": 8001,
        "tag": "ROOTS CARE",
        "name": "Pelota de masaje y acupresión.",
        "size": null,
        "color": "Default Title",
        "price": 9.91,
        "quantity": 4,
        "discount": 30,
        "total": 27.75,
        "product_img": "https://cdn.shopify.com/example.jpg",
        "sku": "RB-070",
        "isPreOrder": false
      },
      {
        "id": "50514992169291",
        "product_id": 8002,
        "tag": "CALCETINES",
        "name": "Calcetines 5 dedos- Media Caña",
        "size": "35-39",
        "color": "Gris",
        "price": 9.08,
        "quantity": 40,
        "discount": 35,
        "total": 236.08,
        "product_img": "https://cdn.shopify.com/example2.jpg",
        "sku": "CALC-35-39-GRIS",
        "isPreOrder": false
      }
    ]`;

    // Parsear como se hace en el endpoint copy-to-cart
    const items = JSON.parse(itemsDataFromDB);

    // Cargar al carrito (simula el flujo real)
    addToCartMultiple(items);

    const cart = getCart();

    // VERIFICACIÓN: Items deben tener todos los campos y descuentos correctos
    assert.equal(cart.length, 2);

    const item1 = cart.find(i => i.id === "46841358745931");
    const item2 = cart.find(i => i.id === "50514992169291");

    // Item 1: Verificar campos
    assert.equal(item1.product_id, 8001);
    assert.equal(item1.tag, "ROOTS CARE");
    assert.equal(item1.sku, "RB-070");
    assert.equal(item1.discount, 30, "4 unidades ROOTS CARE → 30%");

    // Item 2: Verificar campos
    assert.equal(item2.product_id, 8002);
    assert.equal(item2.tag, "CALCETINES");
    assert.equal(item2.sku, "CALC-35-39-GRIS");
    assert.equal(item2.discount, 35, "40 unidades CALCETINES → 35%");
  });

  test("edición de factura: modificar cantidad debe recalcular descuento correctamente", () => {
    // Simular factura con descuento del 30% (2-15 unidades)
    const itemsFromInvoice = [
      {
        id: "50514992169291",
        product_id: 8002,
        tag: "CALCETINES",
        name: "Calcetines 5 dedos- Media Caña",
        size: "35-39",
        color: "Gris",
        price: 9.08,
        quantity: 10, // 10 unidades → descuento 30%
        discount: 30,
        isPreOrder: false,
        product_img: "https://cdn.shopify.com/example.jpg",
        sku: "CALC-35-39-GRIS"
      }
    ];

    addToCartMultiple(itemsFromInvoice);

    let cart = getCart();
    assert.equal(cart[0].discount, 30, "Inicialmente 10 unidades → 30%");

    // Simular que el usuario aumenta la cantidad a 20
    // (esto debería aumentar el descuento a 35%)
    const item = cart[0];

    updateCartQuantity(item, 20);
    updateCartDiscount(item.tag, item.product_id);

    cart = getCart();
    assert.equal(cart[0].quantity, 20, "Cantidad debe actualizarse a 20");
    assert.equal(cart[0].discount, 35, "20 unidades → descuento debe subir a 35%");
  });
});
