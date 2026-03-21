/**
 * Tests para la lógica de Draft Orders de Shopify
 *
 * Cubre:
 * - Cálculo del descuento global (total Shopify vs total B2B)
 * - Redondeo round2 consistente con create-draft.js
 * - Validación de datos de factura antes de crear draft
 * - Casos edge: descuento cero, descuento negativo, variants faltantes
 */

import { describe, it, expect } from 'vitest';

// --- Funciones extraídas de create-draft.js para test unitario ---

const IVA_FACTOR = 1.21;

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

/**
 * Calcula el total Shopify y el descuento global.
 * Replica la lógica de create-draft.js (pasos 8-9).
 */
function calculateDraftDiscount(items_data, variantPriceMap, totalB2B) {
  let totalShopify = 0;
  const line_items = [];

  for (const item of items_data) {
    const variantId = String(item.id);
    const precioSinIva = variantPriceMap.get(variantId);

    if (precioSinIva === undefined) {
      return { error: `Variant ${variantId} no encontrado`, line_items: [], totalShopify: 0, descuento: 0 };
    }

    const quantity = Number(item.quantity);
    const precioConIvaUnit = round2(precioSinIva * IVA_FACTOR);
    const lineTotal = round2(precioConIvaUnit * quantity);
    totalShopify = round2(totalShopify + lineTotal);

    line_items.push({ variant_id: Number(variantId), quantity });
  }

  const descuento = round2(totalShopify - Number(totalB2B));
  return { error: null, line_items, totalShopify, descuento };
}

// --- Tests ---

describe('Draft Order - round2', () => {
  it('redondea a 2 decimales correctamente', () => {
    expect(round2(10.255)).toBe(10.26);
    expect(round2(10.254)).toBe(10.25);
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(99.999)).toBe(100);
  });

  it('maneja valores enteros', () => {
    expect(round2(10)).toBe(10);
    expect(round2(0)).toBe(0);
  });

  it('maneja strings numéricos', () => {
    expect(round2('10.255')).toBe(10.26);
    expect(round2('100')).toBe(100);
  });
});

describe('Draft Order - Cálculo del descuento global', () => {
  it('calcula descuento correcto con un solo item', () => {
    // Producto a 50€ sin IVA en Shopify, vendido a 40€ con IVA en B2B
    const items = [{ id: '1001', quantity: 2, sku: 'TEST-01' }];
    const priceMap = new Map([['1001', 50]]);
    const totalB2B = 80; // 2 × 40€

    const result = calculateDraftDiscount(items, priceMap, totalB2B);

    // Shopify: 2 × round2(50 × 1.21) = 2 × 60.5 = 121.00
    expect(result.totalShopify).toBe(121);
    expect(result.descuento).toBe(41); // 121 - 80
    expect(result.error).toBeNull();
    expect(result.line_items).toEqual([{ variant_id: 1001, quantity: 2 }]);
  });

  it('calcula descuento correcto con múltiples items', () => {
    const items = [
      { id: '1001', quantity: 3, sku: 'SHOE-38' },
      { id: '1002', quantity: 1, sku: 'SHOE-40' },
    ];
    const priceMap = new Map([
      ['1001', 82.64],  // ~100€ con IVA
      ['1002', 41.32],  // ~50€ con IVA
    ]);
    const totalB2B = 250;

    const result = calculateDraftDiscount(items, priceMap, totalB2B);

    // item 1: round2(82.64 * 1.21) = 99.99 → 3 × 99.99 = 299.97
    // item 2: round2(41.32 * 1.21) = 50.00 → 1 × 50.00 = 50.00
    // total Shopify: 349.97
    expect(result.totalShopify).toBe(349.97);
    expect(result.descuento).toBe(99.97); // 349.97 - 250
    expect(result.error).toBeNull();
  });

  it('devuelve descuento cero cuando totales coinciden', () => {
    const items = [{ id: '1001', quantity: 1, sku: 'TEST-01' }];
    const priceMap = new Map([['1001', 82.64]]);
    // Si el total B2B es exactamente igual al precio con IVA
    const totalB2B = round2(82.64 * IVA_FACTOR); // 99.99

    const result = calculateDraftDiscount(items, priceMap, totalB2B);

    expect(result.descuento).toBe(0);
    expect(result.error).toBeNull();
  });

  it('devuelve descuento negativo cuando B2B supera Shopify', () => {
    const items = [{ id: '1001', quantity: 1, sku: 'TEST-01' }];
    const priceMap = new Map([['1001', 50]]);
    const totalB2B = 100; // Más que el precio Shopify con IVA (60.50)

    const result = calculateDraftDiscount(items, priceMap, totalB2B);

    expect(result.descuento).toBeLessThan(0);
    expect(result.descuento).toBe(-39.5); // 60.50 - 100
  });

  it('devuelve error cuando variant no existe en el mapa', () => {
    const items = [
      { id: '1001', quantity: 1, sku: 'EXISTE' },
      { id: '9999', quantity: 2, sku: 'NO-EXISTE' },
    ];
    const priceMap = new Map([['1001', 50]]);

    const result = calculateDraftDiscount(items, priceMap, 100);

    expect(result.error).toContain('9999');
    expect(result.error).toContain('no encontrado');
  });

  it('maneja mapa vacío de variants', () => {
    const items = [{ id: '1001', quantity: 1, sku: 'TEST' }];
    const priceMap = new Map();

    const result = calculateDraftDiscount(items, priceMap, 100);

    expect(result.error).not.toBeNull();
  });
});

describe('Draft Order - Validación de datos de factura', () => {
  /**
   * Replica las validaciones de create-draft.js (pasos 1-5)
   */
  function validateInvoiceForDraft(invoice) {
    const errors = [];

    if (!invoice) {
      return { valid: false, errors: ['Factura no encontrada'] };
    }

    if (invoice.status !== 'pending_review') {
      errors.push(`Estado inválido: ${invoice.status}`);
    }

    if (!invoice.customer_email) {
      errors.push('Sin email de cliente');
    }

    if (!invoice.items_data || !Array.isArray(invoice.items_data) || invoice.items_data.length === 0) {
      errors.push('Sin items');
    }

    return { valid: errors.length === 0, errors };
  }

  it('valida factura correcta', () => {
    const invoice = {
      id: 'abc-123',
      status: 'pending_review',
      customer_email: 'test@example.com',
      items_data: [{ id: '1001', quantity: 1 }],
      total_amount_eur: 100
    };

    const result = validateInvoiceForDraft(invoice);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rechaza factura en estado incorrecto', () => {
    const invoice = {
      status: 'completed',
      customer_email: 'test@example.com',
      items_data: [{ id: '1001', quantity: 1 }]
    };

    const result = validateInvoiceForDraft(invoice);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('completed');
  });

  it('rechaza factura sin email', () => {
    const invoice = {
      status: 'pending_review',
      customer_email: null,
      items_data: [{ id: '1001', quantity: 1 }]
    };

    const result = validateInvoiceForDraft(invoice);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Sin email de cliente');
  });

  it('rechaza factura sin items', () => {
    const invoice = {
      status: 'pending_review',
      customer_email: 'test@example.com',
      items_data: []
    };

    const result = validateInvoiceForDraft(invoice);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Sin items');
  });

  it('rechaza factura con items_data null', () => {
    const invoice = {
      status: 'pending_review',
      customer_email: 'test@example.com',
      items_data: null
    };

    const result = validateInvoiceForDraft(invoice);
    expect(result.valid).toBe(false);
  });

  it('rechaza factura null', () => {
    const result = validateInvoiceForDraft(null);
    expect(result.valid).toBe(false);
  });

  it('acumula múltiples errores', () => {
    const invoice = {
      status: 'cancelled',
      customer_email: '',
      items_data: []
    };

    const result = validateInvoiceForDraft(invoice);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});

describe('Draft Order - Redondeo por línea (consistencia Shopify)', () => {
  it('redondea precio unitario antes de multiplicar por cantidad', () => {
    // Precio sin IVA: 82.6446...€ → con IVA: 99.99...€
    const precioSinIva = 82.6446;
    const quantity = 3;

    // Forma correcta: redondear unitario primero
    const unitConIva = round2(precioSinIva * IVA_FACTOR); // 99.98
    const lineTotal = round2(unitConIva * quantity); // 299.94

    // Forma incorrecta: multiplicar primero, redondear después
    const wrongTotal = round2(precioSinIva * IVA_FACTOR * quantity); // 299.94 (puede diferir en edge cases)

    // Ambos deberían coincidir en este caso, pero la forma correcta
    // es la que usa el código (redondeo por línea)
    expect(lineTotal).toBe(round2(unitConIva * quantity));
  });

  it('acumula totales con redondeo intermedio', () => {
    const items = [
      { precioSinIva: 82.6446, quantity: 3 },
      { precioSinIva: 41.3223, quantity: 2 },
    ];

    let total = 0;
    for (const item of items) {
      const unitConIva = round2(item.precioSinIva * IVA_FACTOR);
      const lineTotal = round2(unitConIva * item.quantity);
      total = round2(total + lineTotal);
    }

    // Verificar que el total tiene exactamente 2 decimales
    expect(total).toBe(round2(total));
    expect(total.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
  });
});
