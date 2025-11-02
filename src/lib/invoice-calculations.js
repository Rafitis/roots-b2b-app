/**
 * CENTRALIZADO: Lógica de cálculos de facturas
 * Fuente única de verdad para todos los cálculos de totales, IVA, envío, descuentos
 *
 * Usada por:
 * - useCart.js
 * - CartPage.jsx
 * - InvoicePDF.jsx
 * - API endpoints
 *
 * Protegida por tests en: src/test/unit/invoice-calculations.test.js
 */

import { vatRates } from '../data/vatRates.js';

/**
 * Zonas con IVA especial (sin IVA o reducido)
 */
const SPECIAL_VAT_ZONES = {
  'ES-CN': 'Canarias',     // Sin IVA
  'ES-CE': 'Ceuta',        // Sin IVA
  'ES-ML': 'Melilla'       // Sin IVA
};

/**
 * Configuración de envío por país
 */
const SHIPPING_CONFIG = {
  ES: {
    cost: 5,           // 5€ envío nacional
    freeOver: 200,     // Gratis si > 200€
    special: ['ES-CN', 'ES-CE', 'ES-ML'] // Canarias/Ceuta/Melilla siempre gratis
  },
  INTERNATIONAL: {
    cost: 15,          // 15€ envío internacional
    freeOver: 400      // Gratis si > 400€
  }
};

/**
 * Descuentos por cantidad y categoría de producto
 */
const DISCOUNT_TIERS = {
  'ROOTS CARE': [
    { min: 0, max: 1, discount: 0 },
    { min: 2, max: 15, discount: 30 },
    { min: 16, max: 51, discount: 35 },
    { min: 52, discount: 40 }
  ],
  'CALCETINES': [
    { min: 0, max: 1, discount: 0 },
    { min: 2, max: 15, discount: 30 },
    { min: 16, max: 51, discount: 35 },
    { min: 52, discount: 40 }
  ]
};

// ============ VALIDACIÓN DE DATOS ============

/**
 * Valida que el country code sea válido
 * @param {string} countryCode - Código de país (ej: 'ES', 'ES-CN', 'FR')
 * @returns {boolean}
 */
export function isValidCountryCode(countryCode) {
  if (!countryCode) return false;

  // Validar especiales (ES-CN, ES-CE, ES-ML)
  if (Object.keys(SPECIAL_VAT_ZONES).includes(countryCode)) {
    return true;
  }

  // Validar países en vatRates
  return countryCode in vatRates;
}

/**
 * Valida que un número sea positivo
 * @param {number} value
 * @returns {boolean}
 */
export function isValidAmount(value) {
  return typeof value === 'number' && !isNaN(value) && value >= 0;
}

/**
 * Valida que quantity sea un número entero positivo
 * @param {number} quantity
 * @returns {boolean}
 */
export function isValidQuantity(quantity) {
  return Number.isInteger(quantity) && quantity > 0;
}

// ============ CÁLCULO DE DESCUENTOS ============

/**
 * Calcula el descuento aplicable según cantidad y tag
 * @param {number} quantity - Cantidad total de items
 * @param {string} tag - Tag del producto ('ROOTS CARE', 'CALCETINES', u otro)
 * @returns {number} Descuento en porcentaje (0-40)
 */
export function calculateDiscount(quantity, tag) {
  // Validar entrada
  if (!isValidQuantity(quantity)) {
    console.warn(`[WARN] Invalid quantity: ${quantity}`);
    return 0;
  }

  const tiers = DISCOUNT_TIERS[tag];

  // Si el tag no está en descuentos, retorna 0
  if (!tiers) {
    return 0;
  }

  // Buscar el tier aplicable
  for (const tier of tiers) {
    const meetsMin = quantity >= tier.min;
    const meetsMax = tier.max === undefined || quantity <= tier.max;

    if (meetsMin && meetsMax) {
      return tier.discount;
    }
  }

  // Fallback: último tier
  return tiers[tiers.length - 1].discount;
}

// ============ CÁLCULO DE IVA ============

/**
 * Obtiene la tasa de IVA aplicable según país
 * @param {string} countryCode - Código de país
 * @returns {number} Porcentaje de IVA (0-27)
 */
export function getVATRate(countryCode) {
  // Zonas sin IVA
  if (countryCode in SPECIAL_VAT_ZONES) {
    return 0;
  }

  // Buscar en vatRates
  return vatRates[countryCode]?.vat || 21; // 21% por defecto (España)
}

/**
 * Calcula el IVA a partir de la base (sin IVA)
 * @param {number} baseAmount - Cantidad sin IVA
 * @param {string} countryCode - Código de país
 * @returns {number} Cantidad de IVA
 */
export function calculateVAT(baseAmount, countryCode) {
  if (!isValidAmount(baseAmount)) {
    console.warn(`[WARN] Invalid amount for VAT: ${baseAmount}`);
    return 0;
  }

  if (!isValidCountryCode(countryCode)) {
    console.warn(`[WARN] Invalid country code: ${countryCode}`);
    return 0;
  }

  const vatRate = getVATRate(countryCode);
  return baseAmount * (vatRate / 100);
}

// ============ CÁLCULO DE ENVÍO ============

/**
 * Calcula el coste de envío según país y total
 * @param {string} countryCode - Código de país
 * @param {number} baseTotal - Total sin envío (sin_iva + iva)
 * @returns {number} Coste de envío
 */
export function calculateShipping(countryCode, baseTotal) {
  if (!isValidAmount(baseTotal)) {
    console.warn(`[WARN] Invalid amount for shipping: ${baseTotal}`);
    return 0;
  }

  // Si carrito está vacío, envío gratis
  if (baseTotal === 0) {
    return 0;
  }

  if (!isValidCountryCode(countryCode)) {
    console.warn(`[WARN] Invalid country code: ${countryCode}`);
    return 15; // Fallback internacional
  }

  // Zonas especiales (Canarias, Ceuta, Melilla): siempre gratis
  if (countryCode in SPECIAL_VAT_ZONES) {
    return 0;
  }

  // España (resto)
  if (countryCode === 'ES') {
    const { cost, freeOver } = SHIPPING_CONFIG.ES;
    return baseTotal >= freeOver ? 0 : cost; // >= no solo >
  }

  // Internacional
  const { cost, freeOver } = SHIPPING_CONFIG.INTERNATIONAL;
  return baseTotal >= freeOver ? 0 : cost; // >= no solo >
}

// ============ CÁLCULO DE RECARGO (EQUIVALENCIA) ============

/**
 * Calcula el recargo de equivalencia (5.2%)
 * Solo aplicable en España, base = total sin IVA
 * @param {number} baseAmount - Total sin IVA
 * @param {boolean} applyRecharge - Si se debe aplicar recargo
 * @returns {number} Cantidad de recargo
 */
export function calculateRecharge(baseAmount, applyRecharge = false) {
  if (!applyRecharge) return 0;

  if (!isValidAmount(baseAmount)) {
    console.warn(`[WARN] Invalid amount for recharge: ${baseAmount}`);
    return 0;
  }

  return baseAmount * 0.052; // 5.2% recargo
}

// ============ CÁLCULO DE TOTALES (FUNCIÓN PRINCIPAL) ============

/**
 * Calcula TODOS los totales de una factura de una sola vez
 * Función principal, usada en cartPage, InvoicePDF, etc
 *
 * @param {Object} params
 * @param {Array} params.items - Array de items del carrito [{quantity, price, discount}, ...]
 * @param {string} params.countryCode - Código de país (ej: 'ES', 'FR', 'ES-CN')
 * @param {boolean} params.applyRecharge - Si aplicar recargo (5.2%)
 * @param {boolean} params.includeShipping - Si incluir envío en el total (default: true)
 * @returns {Object} {
 *   total_sin_iva,      // Base sin IVA
 *   iva,                // IVA aplicado
 *   recargo,            // Recargo de equivalencia (0 si no aplica)
 *   shipping,           // Coste de envío
 *   total_factura,      // Total INCLUIDO envío, IVA, recargo
 *   vatRate             // Porcentaje de IVA aplicado (para referencia)
 * }
 */
export function calculateTotals({
  items = [],
  countryCode = 'ES',
  applyRecharge = false,
  includeShipping = true
}) {
  // Validaciones
  if (!Array.isArray(items)) {
    console.warn('[WARN] Items must be an array');
    items = [];
  }

  if (!isValidCountryCode(countryCode)) {
    console.warn(`[WARN] Invalid country code: ${countryCode}, defaulting to ES`);
    countryCode = 'ES';
  }

  // 1. Calcular base sin IVA (descontando descuentos ya aplicados)
  const total_sin_iva = items.reduce((acc, item) => {
    if (!isValidQuantity(item.quantity) || !isValidAmount(item.price)) {
      console.warn(`[WARN] Invalid item:`, item);
      return acc;
    }

    const discountFactor = 1 - ((item.discount || 0) / 100);
    return acc + (item.quantity * item.price * discountFactor);
  }, 0);

  // 2. Calcular IVA
  const vatRate = getVATRate(countryCode);
  const iva = calculateVAT(total_sin_iva, countryCode);

  // 3. Calcular recargo (equivalencia)
  const recargo = calculateRecharge(total_sin_iva, applyRecharge);

  // 4. Calcular envío
  // El envío se basa en (total_sin_iva + iva) según el negocio
  const subtotalWithVAT = total_sin_iva + iva;
  const shipping = includeShipping ? calculateShipping(countryCode, subtotalWithVAT) : 0;

  // 5. Total final
  const total_factura = total_sin_iva + iva + recargo + shipping;

  return {
    total_sin_iva: Math.round(total_sin_iva * 100) / 100,
    iva: Math.round(iva * 100) / 100,
    recargo: Math.round(recargo * 100) / 100,
    shipping: Math.round(shipping * 100) / 100,
    total_factura: Math.round(total_factura * 100) / 100,
    vatRate: vatRate
  };
}

// ============ CÁLCULO PARA PREVENTA (30% ADELANTO) ============

/**
 * Calcula los porcentajes para preventa (30% adelanto, resto al final)
 * @param {number} totalAmount - Total de la factura (con envío)
 * @returns {Object} {advance: 30%, remaining: 70%}
 */
export function calculatePreSaleAmounts(totalAmount) {
  if (!isValidAmount(totalAmount)) {
    console.warn(`[WARN] Invalid amount for pre-sale: ${totalAmount}`);
    return { advance: 0, remaining: totalAmount };
  }

  const advance = Math.round(totalAmount * 0.3 * 100) / 100;
  const remaining = Math.round((totalAmount - advance) * 100) / 100;

  return {
    advance,
    remaining,
    total: totalAmount
  };
}

// ============ HELPERS ============

/**
 * Redondea a 2 decimales (EUR)
 * @param {number} value
 * @returns {number}
 */
export function roundEUR(value) {
  return Math.round(value * 100) / 100;
}

/**
 * Formatea número a EUR string
 * @param {number} value
 * @param {string} locale - 'es-ES', 'en-US', etc. Default: 'es-ES'
 * @returns {string} '12,34 €'
 */
export function formatEUR(value, locale = 'es-ES') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
}
