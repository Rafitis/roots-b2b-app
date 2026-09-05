/**
 * Tests Unitarios: Generación de CSV de facturas
 *
 * Cobertura:
 * - Escape de comas, comillas y saltos de línea
 * - Preservación de acentos/UTF-8
 * - Formato de fila (fecha, importes, estado)
 * - Estructura completa del CSV (cabecera, BOM, separador de líneas)
 */

import { describe, it, expect } from 'vitest';
import {
  escapeCsvField,
  buildInvoiceCsvRow,
  buildInvoiceCsv,
  INVOICE_CSV_HEADERS,
  INVOICE_STATUS_LABELS
} from '../../lib/invoice-csv.js';

describe('Invoice CSV - escapeCsvField', () => {
  it('deja intacto un valor simple sin caracteres especiales', () => {
    expect(escapeCsvField('Acme Corp')).toBe('Acme Corp');
  });

  it('envuelve en comillas un valor que contiene comas', () => {
    expect(escapeCsvField('Calle Mayor, 1')).toBe('"Calle Mayor, 1"');
  });

  it('escapa comillas dobles duplicándolas', () => {
    expect(escapeCsvField('Empresa "La Buena"')).toBe('"Empresa ""La Buena"""');
  });

  it('envuelve en comillas un valor con salto de línea', () => {
    expect(escapeCsvField('Línea 1\nLínea 2')).toBe('"Línea 1\nLínea 2"');
  });

  it('preserva acentos y eñes sin escapar innecesariamente', () => {
    expect(escapeCsvField('Compañía Ñoño S.A.')).toBe('Compañía Ñoño S.A.');
  });

  it('convierte null/undefined a cadena vacía', () => {
    expect(escapeCsvField(null)).toBe('');
    expect(escapeCsvField(undefined)).toBe('');
  });

  it('convierte números a string', () => {
    expect(escapeCsvField(42)).toBe('42');
  });
});

describe('Invoice CSV - escapeCsvField (protección contra CSV/formula injection)', () => {
  it('neutraliza una fórmula que empieza por = anteponiendo comilla simple (y respeta el RFC 4180)', () => {
    // El valor contiene comillas dobles y comas: primero se antepone la
    // comilla simple neutralizadora, luego se aplica el escape RFC 4180
    // habitual (entrecomillado + duplicado de comillas internas).
    expect(escapeCsvField('=HYPERLINK("http://evil","clic")')).toBe(
      '"\'=HYPERLINK(""http://evil"",""clic"")"'
    );
  });

  it('neutraliza una fórmula que empieza por = sin caracteres RFC 4180 especiales', () => {
    expect(escapeCsvField("=cmd|'/c calc'!A0")).toBe("'=cmd|'/c calc'!A0");
  });

  it('neutraliza un valor que empieza por +', () => {
    expect(escapeCsvField('+1234567890')).toBe("'+1234567890");
  });

  it('neutraliza un valor que empieza por -', () => {
    expect(escapeCsvField('-2+3')).toBe("'-2+3");
  });

  it('neutraliza un valor que empieza por @', () => {
    expect(escapeCsvField('@SUM(1,2)')).toBe('"\'@SUM(1,2)"');
  });

  it('neutraliza un valor que empieza por tabulador', () => {
    expect(escapeCsvField('\t=cmd')).toBe("'\t=cmd");
  });

  it('neutraliza un valor que empieza por retorno de carro', () => {
    expect(escapeCsvField('\rmalicious')).toBe('"\'\rmalicious"');
  });

  it('neutraliza aunque haya espacios normales antes del carácter disparador', () => {
    expect(escapeCsvField('  =cmd')).toBe("'  =cmd");
  });

  it('aplica el prefijo neutralizador antes del entrecomillado RFC 4180', () => {
    // La coma fuerza el entrecomillado; la comilla simple debe quedar dentro
    expect(escapeCsvField('=1,2')).toBe('"\'=1,2"');
  });

  it('no altera un valor normal que no empieza por un carácter disparador', () => {
    expect(escapeCsvField('Acme Corp')).toBe('Acme Corp');
    expect(escapeCsvField('Empresa (Grupo) S.A.')).toBe('Empresa (Grupo) S.A.');
    expect(escapeCsvField('B12345678')).toBe('B12345678');
  });

  it('no altera un valor con = en medio pero no al principio', () => {
    expect(escapeCsvField('a=b')).toBe('a=b');
  });
});

describe('Invoice CSV - buildInvoiceCsvRow', () => {
  const baseInvoice = {
    invoice_number: '2026-001',
    created_at: '2026-09-05T10:30:00.000Z',
    company_name: 'Acme Corp',
    nif_cif: 'B12345678',
    country: 'ES',
    items_count: 12,
    total_amount_eur: 121.0,
    vat_amount: 21.0,
    surcharge_amount: 0,
    status: 'completed'
  };

  it('construye la fila con base sin IVA derivada (total - iva - recargo)', () => {
    const row = buildInvoiceCsvRow(baseInvoice);
    expect(row).toEqual([
      '2026-001',
      '2026-09-05',
      'Acme Corp',
      'B12345678',
      'ES',
      12,
      '100.00', // base sin IVA
      '21.00',  // IVA
      '0.00',   // recargo
      '121.00', // total
      'Completada'
    ]);
  });

  it('traduce cada estado a su etiqueta legible', () => {
    for (const [status, label] of Object.entries(INVOICE_STATUS_LABELS)) {
      const row = buildInvoiceCsvRow({ ...baseInvoice, status });
      expect(row[10]).toBe(label);
    }
  });

  it('usa el status crudo si no hay etiqueta conocida', () => {
    const row = buildInvoiceCsvRow({ ...baseInvoice, status: 'unknown_status' });
    expect(row[10]).toBe('unknown_status');
  });

  it('resta el recargo de equivalencia de la base sin IVA', () => {
    const row = buildInvoiceCsvRow({
      ...baseInvoice,
      total_amount_eur: 126.2,
      vat_amount: 21.0,
      surcharge_amount: 5.2
    });
    expect(row[6]).toBe('100.00'); // base sin IVA
    expect(row[8]).toBe('5.20');  // recargo
  });

  it('devuelve cadenas vacías/cero seguros ante campos nulos', () => {
    const row = buildInvoiceCsvRow({});
    expect(row[0]).toBe('');
    expect(row[1]).toBe('');
    expect(row[5]).toBe(0);
    expect(row[6]).toBe('0.00');
    expect(row[10]).toBe('');
  });
});

describe('Invoice CSV - buildInvoiceCsv', () => {
  it('empieza con el BOM UTF-8', () => {
    const csv = buildInvoiceCsv([]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it('incluye la cabecera aunque no haya facturas', () => {
    const csv = buildInvoiceCsv([]);
    const firstLine = csv.slice(1).split('\r\n')[0];
    expect(firstLine).toBe(INVOICE_CSV_HEADERS.join(','));
  });

  it('genera una línea por factura, separadas por CRLF', () => {
    const invoices = [
      {
        invoice_number: '2026-001',
        created_at: '2026-01-10T00:00:00.000Z',
        company_name: 'Acme',
        nif_cif: 'B1',
        country: 'ES',
        items_count: 1,
        total_amount_eur: 10,
        vat_amount: 0,
        surcharge_amount: 0,
        status: 'pending_review'
      },
      {
        invoice_number: '2026-002',
        created_at: '2026-01-11T00:00:00.000Z',
        company_name: 'Beta, S.L.',
        nif_cif: 'B2',
        country: 'FR',
        items_count: 2,
        total_amount_eur: 20,
        vat_amount: 0,
        surcharge_amount: 0,
        status: 'cancelled'
      }
    ];

    const csv = buildInvoiceCsv(invoices);
    const lines = csv.slice(1).split('\r\n').filter(Boolean);

    expect(lines).toHaveLength(3); // cabecera + 2 filas
    expect(lines[1]).toContain('2026-001');
    expect(lines[2]).toContain('"Beta, S.L."'); // empresa con coma escapada
    expect(csv.endsWith('\r\n')).toBe(true);
  });
});
