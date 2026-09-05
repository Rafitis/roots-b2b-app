/**
 * Filtros compartidos para consultar facturas (listado paginado y export CSV)
 *
 * Centraliza el parseo/validación de query params y su aplicación sobre la
 * query builder de Supabase para no duplicar esta lógica entre
 * /api/invoices/list.js y /api/invoices/export.csv.js
 */

const VALID_STATUSES = ['pending_review', 'shopify_draft', 'completed', 'cancelled', 'finalized'];

/**
 * Parsea y valida los query params de filtrado de facturas.
 * @param {Record<string, string>} params - Object.fromEntries(url.searchParams)
 * @returns {{ filters: {dateFrom: string|null, dateTo: string|null, nif: string|null, company: string|null, status: string|null, isPaid: boolean|null}|null, error: string|null }}
 */
export function parseInvoiceFilters(params) {
  // Validar antes de convertir: Date#toISOString() lanza una excepción para
  // fechas inválidas, así que hay que comprobar isNaN sobre el objeto Date
  // ANTES de llamar a toISOString (si no, el error de formato se propagaría
  // como excepción no controlada en vez de devolverse como { error }).
  const dateFromDate = params.date_from ? new Date(params.date_from) : null;
  const dateToDate = params.date_to ? new Date(params.date_to) : null;

  if (dateFromDate && isNaN(dateFromDate.getTime())) {
    return { filters: null, error: 'Formato de date_from inválido (usar YYYY-MM-DD)' };
  }

  if (dateToDate && isNaN(dateToDate.getTime())) {
    return { filters: null, error: 'Formato de date_to inválido (usar YYYY-MM-DD)' };
  }

  const dateFrom = dateFromDate ? dateFromDate.toISOString() : null;
  const dateTo = dateToDate ? dateToDate.toISOString() : null;
  const nif = params.nif?.trim() || null;
  const company = params.company?.trim() || null;
  const status = params.status?.trim() || null;
  const isPaidParam = params.is_paid?.trim();
  const isPaid = isPaidParam === 'true' ? true : isPaidParam === 'false' ? false : null;

  return {
    filters: {
      dateFrom,
      dateTo,
      nif,
      company,
      status: status && VALID_STATUSES.includes(status) ? status : null,
      isPaid
    },
    error: null
  };
}

/**
 * Aplica los filtros parseados a una query builder de Supabase.
 * @param {import('@supabase/supabase-js').PostgrestFilterBuilder} query
 * @param {ReturnType<typeof parseInvoiceFilters>['filters']} filters
 * @returns {import('@supabase/supabase-js').PostgrestFilterBuilder}
 */
export function applyInvoiceFilters(query, filters) {
  let q = query;

  if (filters.dateFrom) {
    q = q.gte('created_at', filters.dateFrom);
  }

  if (filters.dateTo) {
    // Sumar 1 día para incluir toda la fecha_to
    const dateToEnd = new Date(new Date(filters.dateTo).getTime() + 86400000).toISOString();
    q = q.lt('created_at', dateToEnd);
  }

  if (filters.nif) {
    q = q.ilike('nif_cif', `%${filters.nif}%`);
  }

  if (filters.company) {
    q = q.ilike('company_name', `%${filters.company}%`);
  }

  if (filters.status) {
    q = q.eq('status', filters.status);
  }

  if (filters.isPaid !== null) {
    q = q.eq('is_paid', filters.isPaid);
  }

  return q;
}
