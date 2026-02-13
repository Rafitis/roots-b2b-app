/**
 * Tests para el sistema de productos admin
 *
 * Verifica:
 * 1. Lógica de precio con overrides (price_override vs shopify_price, /1.21)
 * 2. Shape de datos de getNestedCatalog() (compatibilidad con componentes)
 * 3. completeOldInvoiceItems (query directa a Supabase)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock de Supabase ──────────────────────────────────────────────────────────

// Almacén mutable para controlar respuestas del mock
let mockSupabaseResponse = { data: [], error: null };
let lastQuery = {};

const mockSelect = vi.fn(() => {
  // Si hay un .in() encadenado, devuelve el response
  return {
    eq: vi.fn(() => ({
      order: vi.fn(() => Promise.resolve(mockSupabaseResponse))
    })),
    in: vi.fn(() => Promise.resolve(mockSupabaseResponse)),
    order: vi.fn(() => Promise.resolve(mockSupabaseResponse))
  };
});

const mockFrom = vi.fn((table) => {
  lastQuery.table = table;
  return { select: mockSelect };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom
  }))
}));

// ── Test Data ─────────────────────────────────────────────────────────────────

const MOCK_SUPABASE_PRODUCTS = [
  {
    shopify_product_id: 9001,
    shopify_name: 'Zapatilla Modelo A',
    display_name: 'Modelo A Custom',
    tags: ['Zapatillas', 'Nuevas'],
    imagen: 'https://cdn.shopify.com/model-a.jpg',
    shopify_price: '120.00',
    price_override: '100.00',
    is_visible: true,
    link_a_shopify: 'https://shop.com/products/model-a',
    product_variants: [
      {
        shopify_variant_id: 90011,
        sku: 'MOD-A-38-NEGRO',
        talla: '38',
        color: 'Negro',
        precio: '120.00',
        stock_actual: 5
      },
      {
        shopify_variant_id: 90012,
        sku: 'MOD-A-40-NEGRO',
        talla: '40',
        color: 'Negro',
        precio: '120.00',
        stock_actual: 0
      }
    ]
  },
  {
    shopify_product_id: 9002,
    shopify_name: 'Calcetín Básico',
    display_name: null, // Sin override de nombre
    tags: ['CALCETINES'],
    imagen: 'https://cdn.shopify.com/calcetin.jpg',
    shopify_price: '15.00',
    price_override: null, // Sin override de precio
    is_visible: true,
    link_a_shopify: 'https://shop.com/products/calcetin',
    product_variants: [
      {
        shopify_variant_id: 90021,
        sku: 'CALC-35-BLANCO',
        talla: '35-39',
        color: 'Blanco',
        precio: '15.00',
        stock_actual: 100
      }
    ]
  }
];

// ── Tests: Lógica de precio ───────────────────────────────────────────────────

describe('Lógica de precio con overrides', () => {

  it('debe usar price_override cuando existe', () => {
    const product = MOCK_SUPABASE_PRODUCTS[0];
    const precioBase = product.price_override || product.shopify_price || 0;
    expect(precioBase).toBe('100.00');
  });

  it('debe usar shopify_price cuando price_override es null', () => {
    const product = MOCK_SUPABASE_PRODUCTS[1];
    const precioBase = product.price_override || product.shopify_price || 0;
    expect(precioBase).toBe('15.00');
  });

  it('debe usar 0 cuando ambos precios son null', () => {
    const product = { ...MOCK_SUPABASE_PRODUCTS[1], shopify_price: null, price_override: null };
    const precioBase = product.price_override || product.shopify_price || 0;
    expect(precioBase).toBe(0);
  });

  it('debe dividir por 1.21 para obtener precio sin IVA', () => {
    const precioBase = '100.00';
    const precioSinIVA = (parseFloat(precioBase) / 1.21).toFixed(2);
    expect(precioSinIVA).toBe('82.64');
  });

  it('debe calcular precio sin IVA correctamente para distintos valores', () => {
    const testCases = [
      { input: '120.00', expected: '99.17' },
      { input: '15.00', expected: '12.40' },
      { input: '0', expected: '0.00' },
      { input: '48.40', expected: '40.00' },
    ];

    testCases.forEach(({ input, expected }) => {
      const result = (parseFloat(input) / 1.21).toFixed(2);
      expect(result).toBe(expected);
    });
  });
});

// ── Tests: Shape de datos de getNestedCatalog ─────────────────────────────────

describe('Shape de datos del catálogo (compatibilidad)', () => {

  /**
   * Simula la transformación que hace getNestedCatalog()
   * Extraído de stock_info.js para testear la lógica pura
   */
  function transformProductsToShape(products) {
    return products
      .filter(product => {
        if (!product.tags || product.tags.length === 0) return true;
        const tagsLower = product.tags.map(t => t.toLowerCase());
        return !tagsLower.includes('bundle');
      })
      .map(product => {
        const nombre = product.display_name || product.shopify_name;
        const precioBase = product.price_override || product.shopify_price || 0;
        const precioSinIVA = (parseFloat(precioBase) / 1.21).toFixed(2);

        return {
          ID_producto: product.shopify_product_id,
          nombre: nombre,
          tags: product.tags || [],
          imagen: product.imagen,
          link_a_shopify: product.link_a_shopify,
          status: 'active',
          variants: (product.product_variants || []).map(variant => ({
            ID_sku: variant.shopify_variant_id,
            SKU: variant.sku,
            talla: variant.talla,
            color: variant.color,
            precio: precioSinIVA,
            stock_actual: variant.stock_actual || 0
          }))
        };
      });
  }

  it('debe transformar productos al shape esperado por los componentes', () => {
    const catalog = transformProductsToShape(MOCK_SUPABASE_PRODUCTS);

    expect(catalog).toHaveLength(2);

    // Producto 1: con overrides
    const p1 = catalog[0];
    expect(p1.ID_producto).toBe(9001);
    expect(p1.nombre).toBe('Modelo A Custom'); // display_name override
    expect(p1.tags).toEqual(['Zapatillas', 'Nuevas']);
    expect(p1.imagen).toBe('https://cdn.shopify.com/model-a.jpg');
    expect(p1.link_a_shopify).toBe('https://shop.com/products/model-a');
    expect(p1.status).toBe('active');
    expect(p1.variants).toHaveLength(2);

    // Variante 1
    expect(p1.variants[0].ID_sku).toBe(90011);
    expect(p1.variants[0].SKU).toBe('MOD-A-38-NEGRO');
    expect(p1.variants[0].talla).toBe('38');
    expect(p1.variants[0].color).toBe('Negro');
    expect(p1.variants[0].precio).toBe('82.64'); // 100.00 / 1.21
    expect(p1.variants[0].stock_actual).toBe(5);
  });

  it('debe usar shopify_name cuando display_name es null', () => {
    const catalog = transformProductsToShape(MOCK_SUPABASE_PRODUCTS);
    expect(catalog[1].nombre).toBe('Calcetín Básico');
  });

  it('debe filtrar productos con tag "bundle"', () => {
    const productsWithBundle = [
      ...MOCK_SUPABASE_PRODUCTS,
      {
        shopify_product_id: 9999,
        shopify_name: 'Bundle Pack',
        display_name: null,
        tags: ['Bundle', 'Oferta'],
        imagen: null,
        shopify_price: '50.00',
        price_override: null,
        is_visible: true,
        link_a_shopify: 'https://shop.com/products/bundle',
        product_variants: []
      }
    ];

    const catalog = transformProductsToShape(productsWithBundle);
    expect(catalog).toHaveLength(2); // Bundle excluido
    expect(catalog.find(p => p.ID_producto === 9999)).toBeUndefined();
  });

  it('debe manejar productos sin variantes', () => {
    const productsSinVariantes = [{
      ...MOCK_SUPABASE_PRODUCTS[0],
      product_variants: null
    }];

    const catalog = transformProductsToShape(productsSinVariantes);
    expect(catalog[0].variants).toEqual([]);
  });

  it('debe manejar productos sin tags', () => {
    const productsSinTags = [{
      ...MOCK_SUPABASE_PRODUCTS[0],
      tags: null
    }];

    const catalog = transformProductsToShape(productsSinTags);
    expect(catalog[0].tags).toEqual([]);
  });

  it('cada variante debe tener el mismo precio (precio del producto)', () => {
    const catalog = transformProductsToShape(MOCK_SUPABASE_PRODUCTS);
    const p1 = catalog[0];

    // Todas las variantes deben tener el mismo precio
    const precios = p1.variants.map(v => v.precio);
    expect(new Set(precios).size).toBe(1);
    expect(precios[0]).toBe('82.64');
  });

  it('stock_actual debe ser 0 cuando es null/undefined', () => {
    const productsStockNull = [{
      ...MOCK_SUPABASE_PRODUCTS[0],
      product_variants: [{
        shopify_variant_id: 1,
        sku: 'TEST',
        talla: '38',
        color: 'Negro',
        precio: '100.00',
        stock_actual: null
      }]
    }];

    const catalog = transformProductsToShape(productsStockNull);
    expect(catalog[0].variants[0].stock_actual).toBe(0);
  });
});

// ── Tests: completeOldInvoiceItems ────────────────────────────────────────────

describe('completeOldInvoiceItems', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseResponse = { data: [], error: null };
  });

  it('debe retornar items sin cambios si ya están completos', async () => {
    const { completeOldInvoiceItems } = await import('@lib/invoice-item-recovery.js');

    const items = [
      { id: '123', product_id: 9001, tag: 'Zapatillas', sku: 'MOD-A-38' }
    ];

    const result = await completeOldInvoiceItems(items);
    expect(result).toEqual(items);
    // No debería haber llamado a Supabase
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('debe retornar items sin cambios si array está vacío', async () => {
    const { completeOldInvoiceItems } = await import('@lib/invoice-item-recovery.js');

    const result = await completeOldInvoiceItems([]);
    expect(result).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('debe retornar null/undefined sin cambios', async () => {
    const { completeOldInvoiceItems } = await import('@lib/invoice-item-recovery.js');

    expect(await completeOldInvoiceItems(null)).toBeNull();
    expect(await completeOldInvoiceItems(undefined)).toBeUndefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('debe completar items con datos de Supabase', async () => {
    // Configurar mock de respuesta Supabase
    mockSupabaseResponse = {
      data: [
        {
          shopify_variant_id: 90011,
          sku: 'MOD-A-38-NEGRO',
          product_id: 'uuid-123',
          products: {
            shopify_product_id: 9001,
            tags: ['Zapatillas', 'Nuevas']
          }
        }
      ],
      error: null
    };

    const { completeOldInvoiceItems } = await import('@lib/invoice-item-recovery.js');

    const items = [
      { id: '90011', name: 'Zapatilla Modelo A' }
      // Falta product_id, tag, sku
    ];

    const result = await completeOldInvoiceItems(items);

    expect(result[0].product_id).toBe(9001);
    expect(result[0].sku).toBe('MOD-A-38-NEGRO');
    expect(result[0].tag).toBeNull(); // No es ROOTS CARE ni CALCETINES
    expect(result[0].name).toBe('Zapatilla Modelo A'); // Nombre preservado
  });

  it('debe retornar null en campos cuando variant no se encuentra', async () => {
    mockSupabaseResponse = { data: [], error: null };

    const { completeOldInvoiceItems } = await import('@lib/invoice-item-recovery.js');

    const items = [
      { id: '99999', name: 'Producto Inexistente' }
    ];

    const result = await completeOldInvoiceItems(items);

    expect(result[0].product_id).toBeNull();
    expect(result[0].tag).toBeNull();
    expect(result[0].sku).toBeNull();
  });

  it('debe manejar errores de Supabase gracefully', async () => {
    mockSupabaseResponse = { data: null, error: { message: 'Connection failed' } };

    const { completeOldInvoiceItems } = await import('@lib/invoice-item-recovery.js');

    const items = [
      { id: '90011', name: 'Test' }
    ];

    const result = await completeOldInvoiceItems(items);

    // Debería retornar items con campos null, no lanzar error
    expect(result[0].product_id).toBeNull();
    expect(result[0].tag).toBeNull();
    expect(result[0].sku).toBeNull();
  });

  it('debe detectar tag ROOTS CARE correctamente', async () => {
    mockSupabaseResponse = {
      data: [
        {
          shopify_variant_id: 12345,
          sku: 'RB-070',
          product_id: 'uuid-456',
          products: {
            shopify_product_id: 8001,
            tags: ['Roots Care', 'Bienestar']
          }
        }
      ],
      error: null
    };

    const { completeOldInvoiceItems } = await import('@lib/invoice-item-recovery.js');

    const items = [{ id: '12345', name: 'Pelota masaje' }];
    const result = await completeOldInvoiceItems(items);

    expect(result[0].tag).toBe('ROOTS CARE');
  });

  it('debe detectar tag CALCETINES correctamente', async () => {
    mockSupabaseResponse = {
      data: [
        {
          shopify_variant_id: 67890,
          sku: 'CALC-35-BLANCO',
          product_id: 'uuid-789',
          products: {
            shopify_product_id: 9002,
            tags: ['Calcetines', 'Accesorios']
          }
        }
      ],
      error: null
    };

    const { completeOldInvoiceItems } = await import('@lib/invoice-item-recovery.js');

    const items = [{ id: '67890', name: 'Calcetín' }];
    const result = await completeOldInvoiceItems(items);

    expect(result[0].tag).toBe('CALCETINES');
  });

  it('debe preservar campos existentes y solo completar los faltantes', async () => {
    mockSupabaseResponse = {
      data: [
        {
          shopify_variant_id: 90011,
          sku: 'MOD-A-38-NEGRO',
          product_id: 'uuid-123',
          products: {
            shopify_product_id: 9001,
            tags: ['Zapatillas']
          }
        }
      ],
      error: null
    };

    const { completeOldInvoiceItems } = await import('@lib/invoice-item-recovery.js');

    // Item con product_id pero sin sku ni tag
    const items = [
      { id: '90011', product_id: 5555, name: 'Test' }
    ];

    const result = await completeOldInvoiceItems(items);

    // product_id existente NO debe sobreescribirse
    expect(result[0].product_id).toBe(5555);
    // sku faltante debe completarse
    expect(result[0].sku).toBe('MOD-A-38-NEGRO');
  });
});

// ── Tests: findDiscountTag (lógica interna) ──────────────────────────────────

describe('findDiscountTag', () => {

  // Reimplementar la función para testing (es interna, no exportada)
  function findDiscountTag(productTags) {
    if (!Array.isArray(productTags)) return null;
    const tagsUpper = productTags.map(t => String(t).toUpperCase().trim());
    if (tagsUpper.some(t => t.includes('ROOTS CARE'))) return 'ROOTS CARE';
    if (tagsUpper.includes('CALCETINES')) return 'CALCETINES';
    return null;
  }

  it('debe retornar ROOTS CARE para tags que contienen "Roots Care"', () => {
    expect(findDiscountTag(['Roots Care', 'Bienestar'])).toBe('ROOTS CARE');
    expect(findDiscountTag(['ROOTS CARE'])).toBe('ROOTS CARE');
    expect(findDiscountTag(['roots care'])).toBe('ROOTS CARE');
  });

  it('debe retornar CALCETINES para tags que incluyen "Calcetines"', () => {
    expect(findDiscountTag(['Calcetines', 'Accesorios'])).toBe('CALCETINES');
    expect(findDiscountTag(['CALCETINES'])).toBe('CALCETINES');
  });

  it('debe retornar null para tags sin descuento', () => {
    expect(findDiscountTag(['Zapatillas', 'Nuevas'])).toBeNull();
    expect(findDiscountTag([])).toBeNull();
  });

  it('debe retornar null para input no-array', () => {
    expect(findDiscountTag(null)).toBeNull();
    expect(findDiscountTag(undefined)).toBeNull();
    expect(findDiscountTag('string')).toBeNull();
  });

  it('ROOTS CARE tiene prioridad sobre CALCETINES', () => {
    expect(findDiscountTag(['Roots Care', 'Calcetines'])).toBe('ROOTS CARE');
  });
});
