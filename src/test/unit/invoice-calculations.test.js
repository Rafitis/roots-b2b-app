/**
 * Tests Unitarios: Cálculos de Facturas
 *
 * CRÍTICO: Estos tests protegen la lógica central de cálculos
 * Si hay un cambio, los tests fallan inmediatamente
 *
 * Cobertura:
 * - Cálculo de IVA por país
 * - Descuentos por cantidad y categoría
 * - Envío según país y total
 * - Recargo de equivalencia
 * - Totales completos
 */

import { describe, it, expect } from 'vitest';
import {
  calculateDiscount,
  calculateVAT,
  calculateShipping,
  calculateRecharge,
  calculateTotals,
  calculatePreSaleAmounts,
  getVATRate,
  isValidCountryCode,
  isValidAmount,
  isValidQuantity,
  roundEUR,
  formatEUR
} from '../../lib/invoice-calculations.js';

describe('Invoice Calculations - Core Functions', () => {
  // ============ VALIDACIÓN ============

  describe('Validation Functions', () => {
    describe('isValidCountryCode', () => {
      it('válida un país EU normal', () => {
        expect(isValidCountryCode('ES')).toBe(true);
        expect(isValidCountryCode('FR')).toBe(true);
        expect(isValidCountryCode('DE')).toBe(true);
      });

      it('válida zonas especiales españolas', () => {
        expect(isValidCountryCode('ES-CN')).toBe(true); // Canarias
        expect(isValidCountryCode('ES-CE')).toBe(true); // Ceuta
        expect(isValidCountryCode('ES-ML')).toBe(true); // Melilla
      });

      it('rechaza países inválidos', () => {
        expect(isValidCountryCode('XX')).toBe(false);
        expect(isValidCountryCode('')).toBe(false);
        expect(isValidCountryCode(null)).toBe(false);
        expect(isValidCountryCode(undefined)).toBe(false);
      });
    });

    describe('isValidAmount', () => {
      it('válida números positivos', () => {
        expect(isValidAmount(0)).toBe(true);
        expect(isValidAmount(100)).toBe(true);
        expect(isValidAmount(0.01)).toBe(true);
        expect(isValidAmount(999999.99)).toBe(true);
      });

      it('rechaza números negativos, NaN, e inválidos', () => {
        expect(isValidAmount(-10)).toBe(false);
        expect(isValidAmount(NaN)).toBe(false);
        expect(isValidAmount('100')).toBe(false);
        expect(isValidAmount(null)).toBe(false);
      });
    });

    describe('isValidQuantity', () => {
      it('válida enteros positivos', () => {
        expect(isValidQuantity(1)).toBe(true);
        expect(isValidQuantity(5)).toBe(true);
        expect(isValidQuantity(1000)).toBe(true);
      });

      it('rechaza decimales, cero, y negativos', () => {
        expect(isValidQuantity(0)).toBe(false);
        expect(isValidQuantity(1.5)).toBe(false);
        expect(isValidQuantity(-5)).toBe(false);
        expect(isValidQuantity('5')).toBe(false);
      });
    });
  });

  // ============ DESCUENTOS ============

  describe('calculateDiscount', () => {
    describe('Categoría ROOTS CARE y CALCETINES', () => {
      it('0% descuento para cantidad 1', () => {
        expect(calculateDiscount(1, 'ROOTS CARE')).toBe(0);
        expect(calculateDiscount(1, 'CALCETINES')).toBe(0);
      });

      it('30% descuento para cantidad 2-15', () => {
        expect(calculateDiscount(2, 'ROOTS CARE')).toBe(30);
        expect(calculateDiscount(10, 'ROOTS CARE')).toBe(30);
        expect(calculateDiscount(15, 'ROOTS CARE')).toBe(30);
      });

      it('35% descuento para cantidad 16-51', () => {
        expect(calculateDiscount(16, 'ROOTS CARE')).toBe(35);
        expect(calculateDiscount(30, 'ROOTS CARE')).toBe(35);
        expect(calculateDiscount(51, 'ROOTS CARE')).toBe(35);
      });

      it('40% descuento para cantidad ≥52', () => {
        expect(calculateDiscount(52, 'ROOTS CARE')).toBe(40);
        expect(calculateDiscount(100, 'ROOTS CARE')).toBe(40);
        expect(calculateDiscount(999, 'ROOTS CARE')).toBe(40);
      });
    });

    it('0% descuento para categorías desconocidas', () => {
      expect(calculateDiscount(100, 'UNKNOWN')).toBe(0);
      expect(calculateDiscount(100, 'OTROS')).toBe(0);
    });

    it('maneja cantidades inválidas', () => {
      expect(calculateDiscount(0, 'ROOTS CARE')).toBe(0); // cantidad 0 es inválida
      expect(calculateDiscount(1.5, 'ROOTS CARE')).toBe(0); // decimal es inválido
    });
  });

  // ============ IVA ============

  describe('getVATRate', () => {
    it('0% IVA en zonas especiales españolas', () => {
      expect(getVATRate('ES-CN')).toBe(0); // Canarias
      expect(getVATRate('ES-CE')).toBe(0); // Ceuta
      expect(getVATRate('ES-ML')).toBe(0); // Melilla
    });

    it('IVA correcto por país', () => {
      expect(getVATRate('ES')).toBe(21);  // España
      expect(getVATRate('FR')).toBe(20);  // Francia
      expect(getVATRate('DE')).toBe(19);  // Alemania
      expect(getVATRate('IT')).toBe(22);  // Italia
      expect(getVATRate('GB')).toBe(20);  // Reino Unido
    });

    it('21% por defecto para país desconocido', () => {
      expect(getVATRate('XX')).toBe(21);
    });
  });

  describe('calculateVAT', () => {
    it('calcula IVA correctamente en España (21%)', () => {
      expect(calculateVAT(100, 'ES')).toBe(21);
      expect(calculateVAT(50, 'ES')).toBe(10.5);
      expect(calculateVAT(1000, 'ES')).toBe(210);
    });

    it('0% IVA en Canarias', () => {
      expect(calculateVAT(100, 'ES-CN')).toBe(0);
      expect(calculateVAT(1000, 'ES-CN')).toBe(0);
    });

    it('IVA diferente por país', () => {
      expect(calculateVAT(100, 'FR')).toBe(20);   // 20%
      expect(calculateVAT(100, 'IT')).toBe(22);   // 22%
      expect(calculateVAT(100, 'GB')).toBe(20);   // 20%
    });

    it('maneja cantidades inválidas', () => {
      expect(calculateVAT(-10, 'ES')).toBe(0);
      expect(calculateVAT(NaN, 'ES')).toBe(0);
    });
  });

  // ============ ENVÍO ============

  describe('calculateShipping', () => {
    describe('España continental (ES)', () => {
      it('5€ para totales < 200€', () => {
        expect(calculateShipping('ES', 100)).toBe(5);
        expect(calculateShipping('ES', 199.99)).toBe(5);
      });

      it('gratis para totales ≥ 200€', () => {
        expect(calculateShipping('ES', 200)).toBe(0);
        expect(calculateShipping('ES', 1000)).toBe(0);
      });
    });

    describe('Zonas especiales (Canarias, Ceuta, Melilla)', () => {
      it('siempre gratis', () => {
        expect(calculateShipping('ES-CN', 50)).toBe(0);  // Canarias
        expect(calculateShipping('ES-CE', 50)).toBe(0);  // Ceuta
        expect(calculateShipping('ES-ML', 50)).toBe(0);  // Melilla
        expect(calculateShipping('ES-CN', 500)).toBe(0);
      });
    });

    describe('Internacional', () => {
      it('15€ para totales < 400€', () => {
        expect(calculateShipping('FR', 100)).toBe(15);
        expect(calculateShipping('DE', 399.99)).toBe(15);
      });

      it('gratis para totales ≥ 400€', () => {
        expect(calculateShipping('FR', 400)).toBe(0);
        expect(calculateShipping('IT', 1000)).toBe(0);
      });
    });

    it('maneja países inválidos', () => {
      expect(calculateShipping('XX', 100)).toBe(15); // Fallback a internacional
      expect(calculateShipping('', 100)).toBe(15);
    });
  });

  // ============ RECARGO ============

  describe('calculateRecharge', () => {
    it('0% cuando no se aplica recargo', () => {
      expect(calculateRecharge(100, false)).toBe(0);
      expect(calculateRecharge(1000, false)).toBe(0);
    });

    it('5.2% cuando se aplica recargo', () => {
      expect(calculateRecharge(100, true)).toBe(5.2);
      expect(calculateRecharge(1000, true)).toBe(52);
      expect(calculateRecharge(50, true)).toBe(2.6);
    });

    it('maneja montos inválidos', () => {
      expect(calculateRecharge(-10, true)).toBe(0);
      expect(calculateRecharge(NaN, true)).toBe(0);
    });
  });

  // ============ TOTALES (FUNCIÓN PRINCIPAL) ============

  describe('calculateTotals - CRITICAL FUNCTION', () => {
    it('calcula totales correctamente: España, sin descuento, sin recargo', () => {
      const items = [
        { quantity: 1, price: 100, discount: 0 }
      ];

      const result = calculateTotals({
        items,
        countryCode: 'ES',
        applyRecharge: false,
        includeShipping: true
      });

      expect(result.total_sin_iva).toBe(100);
      expect(result.iva).toBe(21);        // 21%
      expect(result.recargo).toBe(0);
      expect(result.shipping).toBe(5);    // < 200€
      expect(result.total_factura).toBe(126); // 100 + 21 + 0 + 5
    });

    it('calcula totales con descuento aplicado', () => {
      const items = [
        { quantity: 10, price: 100, discount: 30 } // 30% descuento
      ];

      const result = calculateTotals({
        items,
        countryCode: 'ES',
        applyRecharge: false,
        includeShipping: true
      });

      expect(result.total_sin_iva).toBe(700); // 10 * 100 * 0.7
      expect(result.iva).toBe(147);           // 700 * 0.21
      expect(result.shipping).toBe(0);        // 700 + 147 = 847 >= 200€
      expect(result.total_factura).toBe(847); // 700 + 147 + 0 + 0
    });

    it('envío gratis si total > 200€ en España', () => {
      const items = [
        { quantity: 1, price: 250, discount: 0 }
      ];

      const result = calculateTotals({
        items,
        countryCode: 'ES',
        applyRecharge: false,
        includeShipping: true
      });

      expect(result.shipping).toBe(0); // ≥ 200€
      expect(result.total_factura).toBe(302.5); // 250 + 52.5 + 0 + 0
    });

    it('0% IVA en Canarias', () => {
      const items = [
        { quantity: 1, price: 100, discount: 0 }
      ];

      const result = calculateTotals({
        items,
        countryCode: 'ES-CN',
        applyRecharge: false,
        includeShipping: true
      });

      expect(result.iva).toBe(0);
      expect(result.shipping).toBe(0); // Canarias siempre gratis
      expect(result.total_factura).toBe(100); // Solo el precio base
    });

    it('recargo de equivalencia (5.2%)', () => {
      const items = [
        { quantity: 1, price: 100, discount: 0 }
      ];

      const result = calculateTotals({
        items,
        countryCode: 'ES',
        applyRecharge: true,
        includeShipping: true
      });

      expect(result.recargo).toBe(5.2); // 100 * 0.052
      expect(result.total_factura).toBe(131.2); // 100 + 21 + 5.2 + 5
    });

    it('múltiples items con diferentes descuentos', () => {
      const items = [
        { quantity: 1, price: 100, discount: 0 },    // $100
        { quantity: 2, price: 50, discount: 30 }     // 2*50*0.7 = $70
      ];

      const result = calculateTotals({
        items,
        countryCode: 'ES',
        applyRecharge: false,
        includeShipping: true
      });

      expect(result.total_sin_iva).toBe(170); // 100 + 70
      expect(result.iva).toBe(35.7);          // 170 * 0.21
      expect(result.shipping).toBe(0);        // 170 + 35.7 = 205.7 >= 200€
      expect(result.total_factura).toBe(205.7);
    });

    it('carrito vacío', () => {
      const result = calculateTotals({
        items: [],
        countryCode: 'ES',
        applyRecharge: false,
        includeShipping: true
      });

      expect(result.total_sin_iva).toBe(0);
      expect(result.iva).toBe(0);
      expect(result.recargo).toBe(0);
      expect(result.shipping).toBe(0);
      expect(result.total_factura).toBe(0);
    });

    it('sin incluir shipping', () => {
      const items = [
        { quantity: 1, price: 100, discount: 0 }
      ];

      const result = calculateTotals({
        items,
        countryCode: 'ES',
        applyRecharge: false,
        includeShipping: false
      });

      expect(result.shipping).toBe(0);
      expect(result.total_factura).toBe(121); // Sin shipping
    });

    it('maneja items con datos inválidos', () => {
      const items = [
        { quantity: 1, price: 100, discount: 0 },
        { quantity: 0, price: 100, discount: 0 },   // Inválido
        { quantity: -5, price: 100, discount: 0 }   // Inválido
      ];

      const result = calculateTotals({
        items,
        countryCode: 'ES'
      });

      // Solo cuenta el item válido
      expect(result.total_sin_iva).toBe(100);
    });

    it('es robusto con países desconocidos', () => {
      const items = [
        { quantity: 1, price: 100, discount: 0 }
      ];

      const result = calculateTotals({
        items,
        countryCode: 'XX', // País inválido
        applyRecharge: false
      });

      // Debería defaultear a ES (21% IVA)
      expect(result.iva).toBe(21);
      expect(result.total_factura).toBeGreaterThan(0);
    });
  });

  // ============ PREVENTA ============

  describe('calculatePreSaleAmounts', () => {
    it('calcula 30% adelanto y 70% saldo', () => {
      const result = calculatePreSaleAmounts(100);

      expect(result.advance).toBe(30);
      expect(result.remaining).toBe(70);
      expect(result.total).toBe(100);
    });

    it('maneja decimales', () => {
      const result = calculatePreSaleAmounts(99.99);

      expect(result.advance).toBe(30);
      expect(result.remaining + result.advance).toBe(99.99);
    });

    it('maneja montos grandes', () => {
      const result = calculatePreSaleAmounts(10000);

      expect(result.advance).toBe(3000);
      expect(result.remaining).toBe(7000);
    });
  });

  // ============ HELPERS ============

  describe('roundEUR', () => {
    it('redondea a 2 decimales', () => {
      expect(roundEUR(10.125)).toBe(10.13);
      expect(roundEUR(10.124)).toBe(10.12);
      expect(roundEUR(10.1)).toBe(10.1);
    });
  });

  describe('formatEUR', () => {
    it('formatea a EUR español', () => {
      const formatted = formatEUR(100, 'es-ES');
      expect(formatted).toContain('€');
      expect(formatted).toContain('100');
    });

    it('formatea por defecto en es-ES', () => {
      const formatted = formatEUR(100);
      expect(formatted).toContain('€');
    });
  });
});

// ============ CASOS EXTREMOS (EDGE CASES) ============

describe('Edge Cases & Regressions', () => {
  it('BUG PREVIO: calculateTotals no devolvía shipping (FIXED)', () => {
    const items = [{ quantity: 1, price: 50, discount: 0 }];
    const result = calculateTotals({ items, countryCode: 'ES' });

    expect(result.shipping).toBeDefined();
    expect(result.shipping).toBeGreaterThan(0); // Debe ser 5€
  });

  it('BUG PREVIO: Lógica de envío inconsistente entre componentes (FIXED)', () => {
    // Todos deberían dar el mismo resultado ahora
    const total = 100;
    const shipping1 = calculateShipping('ES', total);
    const totals = calculateTotals({
      items: [{ quantity: 1, price: total, discount: 0 }],
      countryCode: 'ES'
    });

    expect(shipping1).toBe(totals.shipping); // Deben coincidir
  });

  it('BUG PREVIO: IVA duplicado no se recalculaba (FIXED)', () => {
    const items = [
      { quantity: 1, price: 100, discount: 0 },
      { quantity: 1, price: 100, discount: 0 }
    ];

    const result = calculateTotals({
      items,
      countryCode: 'ES'
    });

    // No debería haber IVA duplicado
    expect(result.iva).toBe(42); // (100+100) * 0.21
    expect(result.total_sin_iva).toBe(200);
  });

  it('BUG PREVIO: Descuentos se aplicaban incorrectamente en variantes (FIXED)', () => {
    // Ahora calculateDiscount es agnóstico al tipo de producto
    expect(calculateDiscount(10, 'ROOTS CARE')).toBe(30);
    expect(calculateDiscount(10, 'OTHER')).toBe(0); // Otros no tienen descuento
  });

  it('SEGURIDAD: Previene inyección de cantidades negativas', () => {
    const result = calculateDiscount(-100, 'ROOTS CARE');
    expect(result).toBe(0); // No debería aplicar 40%
  });

  it('SEGURIDAD: Previene NaN en cálculos', () => {
    const items = [
      { quantity: NaN, price: 100, discount: 0 },
      { quantity: 1, price: NaN, discount: 0 }
    ];

    const result = calculateTotals({ items, countryCode: 'ES' });

    expect(isNaN(result.total_factura)).toBe(false);
    expect(result.total_factura).toBeGreaterThanOrEqual(0); // Los items inválidos se ignoran, total >= 0
  });
});
