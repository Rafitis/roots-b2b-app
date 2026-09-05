/**
 * Tests Unitarios: Filtros de facturas (parseInvoiceFilters)
 *
 * Módulo compartido entre /api/invoices/list.js y /api/invoices/export.csv.js.
 *
 * Cobertura:
 * - Comportamiento tri-estado de is_paid
 * - Whitelist de status
 * - Rechazo de fechas mal formadas
 */

import { describe, it, expect } from 'vitest';
import { parseInvoiceFilters } from '../../lib/invoice-filters.js';

describe('parseInvoiceFilters - is_paid (tri-estado)', () => {
  it('is_paid="true" se interpreta como true', () => {
    const { filters, error } = parseInvoiceFilters({ is_paid: 'true' });
    expect(error).toBeNull();
    expect(filters.isPaid).toBe(true);
  });

  it('is_paid="false" se interpreta como false', () => {
    const { filters, error } = parseInvoiceFilters({ is_paid: 'false' });
    expect(error).toBeNull();
    expect(filters.isPaid).toBe(false);
  });

  it('is_paid ausente se interpreta como null (sin filtrar)', () => {
    const { filters, error } = parseInvoiceFilters({});
    expect(error).toBeNull();
    expect(filters.isPaid).toBeNull();
  });

  it('is_paid con valor no reconocido se interpreta como null', () => {
    const { filters, error } = parseInvoiceFilters({ is_paid: 'maybe' });
    expect(error).toBeNull();
    expect(filters.isPaid).toBeNull();
  });
});

describe('parseInvoiceFilters - whitelist de status', () => {
  it('acepta cada status válido de la whitelist', () => {
    const validStatuses = ['pending_review', 'shopify_draft', 'completed', 'cancelled', 'finalized'];
    for (const status of validStatuses) {
      const { filters, error } = parseInvoiceFilters({ status });
      expect(error).toBeNull();
      expect(filters.status).toBe(status);
    }
  });

  it('un status inválido queda en null (no se filtra por él)', () => {
    const { filters, error } = parseInvoiceFilters({ status: 'no_existe' });
    expect(error).toBeNull();
    expect(filters.status).toBeNull();
  });

  it('status ausente queda en null', () => {
    const { filters, error } = parseInvoiceFilters({});
    expect(error).toBeNull();
    expect(filters.status).toBeNull();
  });
});

describe('parseInvoiceFilters - rechazo de fechas mal formadas', () => {
  it('rechaza date_from con formato inválido sin lanzar excepción', () => {
    expect(() => parseInvoiceFilters({ date_from: 'fecha-invalida' })).not.toThrow();
    const { filters, error } = parseInvoiceFilters({ date_from: 'fecha-invalida' });
    expect(filters).toBeNull();
    expect(error).toBe('Formato de date_from inválido (usar YYYY-MM-DD)');
  });

  it('rechaza date_to con formato inválido sin lanzar excepción', () => {
    expect(() => parseInvoiceFilters({ date_to: '32/13/2024' })).not.toThrow();
    const { filters, error } = parseInvoiceFilters({ date_to: '32/13/2024' });
    expect(filters).toBeNull();
    expect(error).toBe('Formato de date_to inválido (usar YYYY-MM-DD)');
  });

  it('acepta fechas válidas YYYY-MM-DD sin error', () => {
    const { filters, error } = parseInvoiceFilters({ date_from: '2026-01-01', date_to: '2026-01-31' });
    expect(error).toBeNull();
    expect(filters.dateFrom).toBe(new Date('2026-01-01').toISOString());
    expect(filters.dateTo).toBe(new Date('2026-01-31').toISOString());
  });

  it('date_from/date_to ausentes quedan en null sin error', () => {
    const { filters, error } = parseInvoiceFilters({});
    expect(error).toBeNull();
    expect(filters.dateFrom).toBeNull();
    expect(filters.dateTo).toBeNull();
  });
});
