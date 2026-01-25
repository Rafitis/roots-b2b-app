/**
 * Tests para hooks reactivos del carrito
 * Valida que useCartItems, useCartTotals y getCartTotals funcionen correctamente
 *
 * IMPORTANTE: Estos hooks son la solución al bug de race condition
 * donde se guardaban facturas con totales incorrectos
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  itemsStore,
  useCartItems,
  useCartTotals,
  getCartTotals,
  addToCart,
  removeAllFromCart
} from '@hooks/useCart';

// Mock de producto para tests
const mockProduct = {
  ID_producto: 8587131257163,
  nombre: 'Test Product',
  imagen: 'https://example.com/test.jpg'
};

const mockVariant = {
  ID_sku: 'TEST-SKU-001',
  SKU: 'TEST-SKU-001',
  precio: 10.00,
  talla: 'M',
  color: 'Negro'
};

describe('useCart Hooks - Solución al bug de race condition', () => {

  beforeEach(() => {
    // Limpiar store antes de cada test
    removeAllFromCart();
  });

  afterEach(() => {
    // Limpiar store después de cada test
    removeAllFromCart();
  });

  describe('useCartItems', () => {
    it('retorna array vacío cuando no hay items', () => {
      const { result } = renderHook(() => useCartItems());

      expect(result.current).toEqual([]);
      expect(Array.isArray(result.current)).toBe(true);
    });

    it('retorna items del store reactivamente', () => {
      const { result } = renderHook(() => useCartItems());

      // Inicialmente vacío
      expect(result.current.length).toBe(0);

      // Añadir item
      act(() => {
        addToCart({
          tag: 'ROOTS CARE',
          product: mockProduct,
          quantity: 5,
          variant: mockVariant,
          isPreOrder: false
        });
      });

      // Debería actualizarse automáticamente
      expect(result.current.length).toBe(1);
      expect(result.current[0].id).toBe('TEST-SKU-001');
      expect(result.current[0].quantity).toBe(5);
    });

    it('se actualiza cuando se añaden múltiples items', () => {
      const { result } = renderHook(() => useCartItems());

      act(() => {
        addToCart({
          tag: 'CALCETINES',
          product: mockProduct,
          quantity: 3,
          variant: { ...mockVariant, ID_sku: 'SKU-001' },
          isPreOrder: false
        });

        addToCart({
          tag: 'CALCETINES',
          product: mockProduct,
          quantity: 5,
          variant: { ...mockVariant, ID_sku: 'SKU-002' },
          isPreOrder: false
        });
      });

      expect(result.current.length).toBe(2);
    });

    it('se actualiza cuando se elimina el carrito', () => {
      const { result } = renderHook(() => useCartItems());

      // Añadir items
      act(() => {
        addToCart({
          tag: 'ROOTS CARE',
          product: mockProduct,
          quantity: 5,
          variant: mockVariant,
          isPreOrder: false
        });
      });

      expect(result.current.length).toBe(1);

      // Eliminar todos
      act(() => {
        removeAllFromCart();
      });

      expect(result.current.length).toBe(0);
    });
  });

  describe('useCartTotals', () => {
    const customerInfo = {
      country: 'ES',
      isRecharge: false
    };

    it('retorna totales en cero cuando carrito está vacío', () => {
      const { result } = renderHook(() => useCartTotals(customerInfo, true));

      expect(result.current.total_sin_iva).toBe(0);
      expect(result.current.iva).toBe(0);
      expect(result.current.recargo).toBe(0);
      expect(result.current.total_factura).toBe(0);
    });

    it('calcula totales correctamente con items', () => {
      // Añadir item
      act(() => {
        addToCart({
          tag: 'ROOTS CARE',
          product: mockProduct,
          quantity: 2,  // 2 items = 30% descuento
          variant: { ...mockVariant, precio: 10.00 },
          isPreOrder: false
        });
      });

      const { result } = renderHook(() => useCartTotals(customerInfo, true));

      // 2 * 10€ * 0.7 (30% descuento) = 14€ sin IVA
      expect(result.current.total_sin_iva).toBe(14);
      // 14€ * 21% = 2.94€ IVA
      expect(result.current.iva).toBe(2.94);
      // Sin recargo
      expect(result.current.recargo).toBe(0);
      // 14 + 2.94 + 5 (envío) = 21.94€
      expect(result.current.total_factura).toBe(21.94);
    });

    it('calcula IVA según país correctamente', () => {
      act(() => {
        addToCart({
          tag: 'ROOTS CARE',
          product: mockProduct,
          quantity: 2,
          variant: { ...mockVariant, precio: 10.00 },
          isPreOrder: false
        });
      });

      // España: 21%
      const { result: resultES } = renderHook(() =>
        useCartTotals({ country: 'ES', isRecharge: false }, false)
      );
      expect(resultES.current.vatRate).toBe(21);
      expect(resultES.current.iva).toBe(2.94); // 14 * 0.21

      // Francia: 20%
      const { result: resultFR } = renderHook(() =>
        useCartTotals({ country: 'FR', isRecharge: false }, false)
      );
      expect(resultFR.current.vatRate).toBe(20);
      expect(resultFR.current.iva).toBe(2.8); // 14 * 0.20

      // Canarias: 0%
      const { result: resultCN } = renderHook(() =>
        useCartTotals({ country: 'ES-CN', isRecharge: false }, false)
      );
      expect(resultCN.current.vatRate).toBe(0);
      expect(resultCN.current.iva).toBe(0);
    });

    it('aplica recargo de equivalencia cuando isRecharge=true', () => {
      act(() => {
        addToCart({
          tag: 'ROOTS CARE',
          product: mockProduct,
          quantity: 2,
          variant: { ...mockVariant, precio: 10.00 },
          isPreOrder: false
        });
      });

      const { result } = renderHook(() =>
        useCartTotals({ country: 'ES', isRecharge: true }, false)
      );

      // 14€ * 5.2% = 0.73€ recargo
      expect(result.current.recargo).toBe(0.73);
    });

    it('incluye envío cuando includeShipping=true', () => {
      act(() => {
        addToCart({
          tag: 'ROOTS CARE',
          product: mockProduct,
          quantity: 2,
          variant: { ...mockVariant, precio: 10.00 },
          isPreOrder: false
        });
      });

      // Con envío
      const { result: withShipping } = renderHook(() =>
        useCartTotals(customerInfo, true)
      );
      expect(withShipping.current.shipping).toBe(5); // Envío España

      // Sin envío
      const { result: noShipping } = renderHook(() =>
        useCartTotals(customerInfo, false)
      );
      expect(noShipping.current.shipping).toBe(0);
    });

    it('se actualiza reactivamente cuando cambia el carrito', () => {
      const { result } = renderHook(() => useCartTotals(customerInfo, true));

      // Inicial: vacío
      expect(result.current.total_sin_iva).toBe(0);

      // Añadir item
      act(() => {
        addToCart({
          tag: 'ROOTS CARE',
          product: mockProduct,
          quantity: 2,
          variant: { ...mockVariant, precio: 10.00 },
          isPreOrder: false
        });
      });

      // Actualizado
      expect(result.current.total_sin_iva).toBe(14);

      // Añadir más items
      act(() => {
        addToCart({
          tag: 'ROOTS CARE',
          product: mockProduct,
          quantity: 5,
          variant: { ...mockVariant, ID_sku: 'SKU-002', precio: 10.00 },
          isPreOrder: false
        });
      });

      // Actualizado de nuevo (7 items total = descuento diferente)
      expect(result.current.total_sin_iva).toBeGreaterThan(14);
    });
  });

  describe('getCartTotals (no reactiva)', () => {
    const customerInfo = {
      country: 'ES',
      isRecharge: false
    };

    it('retorna totales actuales sin reactividad', () => {
      // Añadir item directamente al store
      itemsStore.set([{
        id: 'TEST-001',
        product_id: 8587131257163,
        name: 'Test',
        quantity: 2,
        price: 10,
        discount: 30,
        tag: 'ROOTS CARE',
        color: 'Negro',
        size: 'M',
        sku: 'TEST-001',
        product_img: 'https://example.com/test.jpg',
        isPreOrder: false
      }]);

      const totals = getCartTotals(customerInfo, true);

      expect(totals.total_sin_iva).toBe(14);
      expect(totals.iva).toBe(2.94);
      expect(totals.total_factura).toBe(21.94);
    });

    it('devuelve snapshot en el momento de la llamada', () => {
      // Estado inicial
      itemsStore.set([{
        id: 'TEST-001',
        product_id: 8587131257163,
        name: 'Test',
        quantity: 2,
        price: 10,
        discount: 30,
        tag: 'ROOTS CARE',
        color: 'Negro',
        size: 'M',
        sku: 'TEST-001',
        product_img: 'https://example.com/test.jpg',
        isPreOrder: false
      }]);

      const totals1 = getCartTotals(customerInfo, true);

      // Cambiar store
      itemsStore.set([{
        id: 'TEST-001',
        product_id: 8587131257163,
        name: 'Test',
        quantity: 10,
        price: 10,
        discount: 30,
        tag: 'ROOTS CARE',
        color: 'Negro',
        size: 'M',
        sku: 'TEST-001',
        product_img: 'https://example.com/test.jpg',
        isPreOrder: false
      }]);

      const totals2 = getCartTotals(customerInfo, true);

      // Los totales deben ser diferentes
      expect(totals1.total_sin_iva).not.toBe(totals2.total_sin_iva);
      expect(totals1.total_sin_iva).toBe(14);  // 2 items
      expect(totals2.total_sin_iva).toBe(70);  // 10 items
    });
  });

  describe('Consistencia entre hooks y función no reactiva', () => {
    it('useCartTotals y getCartTotals devuelven los mismos valores', () => {
      const customerInfo = {
        country: 'ES',
        isRecharge: false
      };

      // Añadir items
      act(() => {
        addToCart({
          tag: 'ROOTS CARE',
          product: mockProduct,
          quantity: 5,
          variant: { ...mockVariant, precio: 10.00 },
          isPreOrder: false
        });
      });

      // Hook reactivo
      const { result: hookResult } = renderHook(() =>
        useCartTotals(customerInfo, true)
      );

      // Función no reactiva
      const fnResult = getCartTotals(customerInfo, true);

      // Deben coincidir
      expect(hookResult.current.total_sin_iva).toBe(fnResult.total_sin_iva);
      expect(hookResult.current.iva).toBe(fnResult.iva);
      expect(hookResult.current.recargo).toBe(fnResult.recargo);
      expect(hookResult.current.shipping).toBe(fnResult.shipping);
      expect(hookResult.current.total_factura).toBe(fnResult.total_factura);
    });
  });

  describe('Caso real: Bug de 219.58€ vs 718.06€', () => {
    it('previene el bug original detectando diferencias en tiempo real', () => {
      const customerInfo = {
        country: 'ES',
        isRecharge: true
      };

      // Simular: usuario añade 3 items (219.58€)
      act(() => {
        addToCart({
          tag: 'ROOTS CARE',
          product: mockProduct,
          quantity: 16,
          variant: { ...mockVariant, precio: 10.74, ID_sku: 'CARE-SEP-M' },
          isPreOrder: false
        });
      });

      const { result: hookResult } = renderHook(() =>
        useCartTotals(customerInfo, true)
      );

      const totals1 = getCartTotals(customerInfo, true);

      // En este punto, hook y función deberían coincidir
      expect(hookResult.current.total_factura).toBe(totals1.total_factura);

      // Simular: usuario añade más items muy rápido (hasta 718.06€)
      act(() => {
        // Añadir 12 items de calcetines
        for (let i = 0; i < 12; i++) {
          addToCart({
            tag: 'CALCETINES',
            product: mockProduct,
            quantity: 4,
            variant: { ...mockVariant, precio: 9.08, ID_sku: `SOCK-${i}` },
            isPreOrder: false
          });
        }

        // Añadir 6 items de plantillas
        for (let i = 0; i < 6; i++) {
          addToCart({
            tag: 'CALZADO BAREFOOT',
            product: mockProduct,
            quantity: 3,
            variant: { ...mockVariant, precio: 3.3, ID_sku: `PLAN-${i}`, discount: 0 },
            isPreOrder: false
          });
        }
      });

      const totals2 = getCartTotals(customerInfo, true);

      // ✅ Con el nuevo sistema, siempre lee del store actual
      // El total debe ser mucho mayor que el inicial
      expect(totals2.total_factura).toBeGreaterThan(totals1.total_factura);
      // Al menos 4x más grande (múltiples items añadidos)
      expect(totals2.total_factura).toBeGreaterThan(totals1.total_factura * 4);

      // Hook también debe tener el valor actualizado
      expect(hookResult.current.total_factura).toBe(totals2.total_factura);
    });
  });
});
