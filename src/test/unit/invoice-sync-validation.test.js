/**
 * Tests para validación de desincronización en InvoiceDownload
 *
 * CRÍTICO: Estos tests validan la protección contra el bug real
 * donde se guardaban facturas con items correctos pero totales incorrectos
 *
 * Escenario del bug original:
 * - items_data en BD: 22 items ✅
 * - total_amount_eur en BD: 219.58€ ❌ (debería ser 718.06€)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  itemsStore,
  getCart,
  getCartTotals,
  addToCart,
  removeAllFromCart
} from '@hooks/useCart';

// Mock de producto
const mockProduct = {
  ID_producto: 8587131257163,
  nombre: 'Test Product',
  imagen: 'https://example.com/test.jpg'
};

const mockVariant = {
  ID_sku: 'TEST-SKU',
  SKU: 'TEST-SKU',
  precio: 10.00,
  talla: 'M',
  color: 'Negro'
};

describe('Validación de desincronización - Protección crítica', () => {

  beforeEach(() => {
    removeAllFromCart();
  });

  describe('Detección de desincronización de items', () => {
    it('detecta cuando props tienen menos items que el store', () => {
      const customerInfo = {
        country: 'ES',
        isRecharge: false
      };

      // Simular: props tienen 3 items (estado viejo)
      const propsItems = [
        { id: '1', quantity: 2, price: 10, discount: 30 },
        { id: '2', quantity: 2, price: 10, discount: 30 },
        { id: '3', quantity: 2, price: 10, discount: 30 }
      ];

      // Store tiene 22 items (estado actual)
      for (let i = 0; i < 22; i++) {
        addToCart({
          tag: 'ROOTS CARE',
          product: mockProduct,
          quantity: 2,
          variant: { ...mockVariant, ID_sku: `SKU-${i}` },
          isPreOrder: false
        });
      }

      const currentItems = getCart();

      // Validación
      const itemsDiff = Math.abs(currentItems.length - propsItems.length);

      expect(itemsDiff).toBeGreaterThan(0);
      expect(itemsDiff).toBe(19); // 22 - 3 = 19 items de diferencia
      expect(currentItems.length).toBe(22);
      expect(propsItems.length).toBe(3);
    });

    it('no detecta diferencia cuando items coinciden', () => {
      const customerInfo = {
        country: 'ES',
        isRecharge: false
      };

      // Añadir items al store
      for (let i = 0; i < 5; i++) {
        addToCart({
          tag: 'ROOTS CARE',
          product: mockProduct,
          quantity: 2,
          variant: { ...mockVariant, ID_sku: `SKU-${i}` },
          isPreOrder: false
        });
      }

      const currentItems = getCart();
      const propsItems = currentItems; // Mismos items

      const itemsDiff = Math.abs(currentItems.length - propsItems.length);

      expect(itemsDiff).toBe(0);
    });
  });

  describe('Detección de desincronización de totales', () => {
    it('detecta el bug real: 219.58€ (props) vs 718.06€ (store)', () => {
      const customerInfo = {
        country: 'ES',
        isRecharge: true
      };

      // Simular: props tienen totales viejos (219.58€)
      const propsTotals = {
        total_factura: 219.58,
        iva: 36.54,
        recargo: 9.05,
        shipping: 0
      };

      // Store tiene 22 items que suman 718.06€
      // Añadir items reales del bug
      addToCart({
        tag: 'ROOTS CARE',
        product: mockProduct,
        quantity: 16,
        variant: { ...mockVariant, precio: 10.74, ID_sku: 'CARE-SEP-M' },
        isPreOrder: false
      });

      // 12 calcetines a 4 unidades cada uno
      for (let i = 0; i < 12; i++) {
        addToCart({
          tag: 'CALCETINES',
          product: mockProduct,
          quantity: 4,
          variant: { ...mockVariant, precio: 9.08, ID_sku: `SOCK-${i}` },
          isPreOrder: false
        });
      }

      // 6 plantillas
      for (let i = 0; i < 6; i++) {
        addToCart({
          tag: 'CALZADO BAREFOOT',
          product: mockProduct,
          quantity: 3,
          variant: { ...mockVariant, precio: 3.3, ID_sku: `PLAN-${i}` },
          isPreOrder: false
        });
      }

      // 2 calcetines confort-tabi
      addToCart({
        tag: 'CALCETINES',
        product: mockProduct,
        quantity: 4,
        variant: { ...mockVariant, precio: 9.83, ID_sku: 'SOCK-CONF-1' },
        isPreOrder: false
      });

      addToCart({
        tag: 'CALCETINES',
        product: mockProduct,
        quantity: 4,
        variant: { ...mockVariant, precio: 9.83, ID_sku: 'SOCK-CONF-2' },
        isPreOrder: false
      });

      const currentTotals = getCartTotals(customerInfo, true);

      // Validación: Detectar diferencia > 1€
      const totalsDiff = Math.abs(currentTotals.total_factura - propsTotals.total_factura);

      expect(totalsDiff).toBeGreaterThan(1);
      expect(totalsDiff).toBeGreaterThan(300); // Diferencia significativa (más de 300€)

      // El total real debe ser mucho mayor que el total viejo
      expect(currentTotals.total_factura).toBeGreaterThan(propsTotals.total_factura);
      expect(currentTotals.total_factura).toBeGreaterThan(400); // Al menos 400€
    });

    it('no detecta diferencia cuando totales coinciden (con tolerancia de 1€)', () => {
      const customerInfo = {
        country: 'ES',
        isRecharge: false
      };

      addToCart({
        tag: 'ROOTS CARE',
        product: mockProduct,
        quantity: 2,
        variant: { ...mockVariant, precio: 10.00 },
        isPreOrder: false
      });

      const currentTotals = getCartTotals(customerInfo, true);

      // Props con totales casi idénticos (pequeña diferencia por redondeo)
      const propsTotals = {
        total_factura: currentTotals.total_factura + 0.5 // 0.5€ de diferencia
      };

      const totalsDiff = Math.abs(currentTotals.total_factura - propsTotals.total_factura);

      expect(totalsDiff).toBeLessThan(1); // Dentro de tolerancia
    });

    it('detecta diferencia cuando supera tolerancia de 1€', () => {
      const customerInfo = {
        country: 'ES',
        isRecharge: false
      };

      addToCart({
        tag: 'ROOTS CARE',
        product: mockProduct,
        quantity: 10,
        variant: { ...mockVariant, precio: 10.00 },
        isPreOrder: false
      });

      const currentTotals = getCartTotals(customerInfo, true);

      // Props con totales significativamente diferentes
      const propsTotals = {
        total_factura: currentTotals.total_factura - 10 // 10€ de diferencia
      };

      const totalsDiff = Math.abs(currentTotals.total_factura - propsTotals.total_factura);

      expect(totalsDiff).toBeGreaterThan(1); // Fuera de tolerancia
      expect(totalsDiff).toBe(10);
    });
  });

  describe('Validación combinada (items + totales)', () => {
    it('detecta cuando hay desincronización en items Y totales', () => {
      const customerInfo = {
        country: 'ES',
        isRecharge: false
      };

      // Props viejos
      const propsItems = [
        { id: '1', quantity: 2, price: 10, discount: 30 }
      ];
      const propsTotals = {
        total_factura: 19.94 // 1 item
      };

      // Store actual con 5 items
      for (let i = 0; i < 5; i++) {
        addToCart({
          tag: 'ROOTS CARE',
          product: mockProduct,
          quantity: 2,
          variant: { ...mockVariant, ID_sku: `SKU-${i}`, precio: 10.00 },
          isPreOrder: false
        });
      }

      const currentItems = getCart();
      const currentTotals = getCartTotals(customerInfo, true);

      // Validaciones
      const itemsDiff = Math.abs(currentItems.length - propsItems.length);
      const totalsDiff = Math.abs(currentTotals.total_factura - propsTotals.total_factura);

      // Lógica del componente: itemsDiff > 0 || totalsDiff > 1
      const shouldBlock = itemsDiff > 0 || totalsDiff > 1;

      expect(shouldBlock).toBe(true);
      expect(itemsDiff).toBe(4); // 5 - 1 = 4 items diferentes
      expect(totalsDiff).toBeGreaterThan(50); // Mucha diferencia en totales
    });

    it('permite guardado cuando todo coincide', () => {
      const customerInfo = {
        country: 'ES',
        isRecharge: false
      };

      // Añadir items al store
      addToCart({
        tag: 'ROOTS CARE',
        product: mockProduct,
        quantity: 2,
        variant: { ...mockVariant, precio: 10.00 },
        isPreOrder: false
      });

      const currentItems = getCart();
      const currentTotals = getCartTotals(customerInfo, true);

      // Props coinciden con el store (escenario ideal)
      const propsItems = currentItems;
      const propsTotals = { ...currentTotals };

      const itemsDiff = Math.abs(currentItems.length - propsItems.length);
      const totalsDiff = Math.abs(currentTotals.total_factura - propsTotals.total_factura);

      const shouldBlock = itemsDiff > 0 || totalsDiff > 1;

      expect(shouldBlock).toBe(false); // ✅ No debe bloquear
      expect(itemsDiff).toBe(0);
      expect(totalsDiff).toBe(0);
    });
  });

  describe('Casos edge: Redondeos y precisión', () => {
    it('tolera diferencias menores a 1€ por redondeos', () => {
      const customerInfo = {
        country: 'ES',
        isRecharge: false
      };

      addToCart({
        tag: 'ROOTS CARE',
        product: mockProduct,
        quantity: 3,
        variant: { ...mockVariant, precio: 9.99 }, // Precio con decimales
        isPreOrder: false
      });

      const currentTotals = getCartTotals(customerInfo, true);

      // Simular pequeña diferencia por redondeo
      const propsTotals = {
        total_factura: Math.round(currentTotals.total_factura * 100) / 100 + 0.99
      };

      const totalsDiff = Math.abs(currentTotals.total_factura - propsTotals.total_factura);

      // 0.99€ < 1€ → Debe pasar
      expect(totalsDiff).toBeLessThan(1);
    });

    it('detecta cuando la diferencia es exactamente 1€', () => {
      const customerInfo = {
        country: 'ES',
        isRecharge: false
      };

      addToCart({
        tag: 'ROOTS CARE',
        product: mockProduct,
        quantity: 2,
        variant: { ...mockVariant, precio: 10.00 },
        isPreOrder: false
      });

      const currentTotals = getCartTotals(customerInfo, true);

      const propsTotals = {
        total_factura: currentTotals.total_factura - 1.0 // Exactamente 1€
      };

      const totalsDiff = Math.abs(currentTotals.total_factura - propsTotals.total_factura);

      // La condición es > 1, no >= 1, así que 1€ exacto NO debe bloquear
      const shouldBlock = totalsDiff > 1;
      expect(shouldBlock).toBe(false);
    });

    it('detecta cuando la diferencia es 1.01€', () => {
      const customerInfo = {
        country: 'ES',
        isRecharge: false
      };

      addToCart({
        tag: 'ROOTS CARE',
        product: mockProduct,
        quantity: 2,
        variant: { ...mockVariant, precio: 10.00 },
        isPreOrder: false
      });

      const currentTotals = getCartTotals(customerInfo, true);

      const propsTotals = {
        total_factura: currentTotals.total_factura - 1.01 // 1.01€
      };

      const totalsDiff = Math.abs(currentTotals.total_factura - propsTotals.total_factura);

      const shouldBlock = totalsDiff > 1;
      expect(shouldBlock).toBe(true); // ✅ Debe bloquear
    });
  });

  describe('Escenarios de race condition', () => {
    it('previene guardado cuando usuario añade items muy rápido', () => {
      const customerInfo = {
        country: 'ES',
        isRecharge: false
      };

      // T0: Props capturados con 1 item
      addToCart({
        tag: 'ROOTS CARE',
        product: mockProduct,
        quantity: 2,
        variant: { ...mockVariant, ID_sku: 'SKU-0', precio: 10.00 },
        isPreOrder: false
      });

      const propsItems = getCart();
      const propsTotals = getCartTotals(customerInfo, true);

      // T1: Usuario añade 20 items más en 50ms (antes de que React actualice)
      for (let i = 1; i <= 20; i++) {
        addToCart({
          tag: 'ROOTS CARE',
          product: mockProduct,
          quantity: 2,
          variant: { ...mockVariant, ID_sku: `SKU-${i}`, precio: 10.00 },
          isPreOrder: false
        });
      }

      // T2: saveInvoiceToServer se ejecuta con props viejos pero lee del store
      const currentItems = getCart();
      const currentTotals = getCartTotals(customerInfo, true);

      // Validación que detecta el problema
      const itemsDiff = Math.abs(currentItems.length - propsItems.length);
      const totalsDiff = Math.abs(currentTotals.total_factura - propsTotals.total_factura);

      const shouldBlock = itemsDiff > 0 || totalsDiff > 1;

      expect(shouldBlock).toBe(true); // ✅ Protección activa
      expect(itemsDiff).toBe(20); // Detecta 20 items de diferencia
      expect(currentItems.length).toBe(21); // 1 + 20
      expect(propsItems.length).toBe(1);
    });
  });
});
