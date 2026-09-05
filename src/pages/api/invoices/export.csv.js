/**
 * GET /api/invoices/export.csv
 *
 * Exporta a CSV (contabilidad) el resultado completo de un filtro de
 * facturas, sin el límite de paginación de list.js.
 * Solo accesible por usuarios autenticados como admin (middleware lo valida)
 *
 * Query Parameters (mismos que list.js, sin page/per_page):
 * - date_from: Fecha inicio (YYYY-MM-DD)
 * - date_to: Fecha fin (YYYY-MM-DD)
 * - nif: NIF/CIF a buscar
 * - company: Nombre de empresa a buscar
 * - status: Estado (pending_review, shopify_draft, completed, cancelled, finalized)
 * - is_paid: Filtrar por estado de pago ('true' | 'false')
 */

import { createClient } from '@supabase/supabase-js';
import { parseInvoiceFilters, applyInvoiceFilters } from '../../../lib/invoice-filters.js';
import { buildInvoiceCsv } from '../../../lib/invoice-csv.js';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Faltan variables de entorno: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CSV_SELECT_COLUMNS = 'invoice_number, created_at, company_name, nif_cif, country, items_count, total_amount_eur, vat_amount, surcharge_amount, status';

// Supabase/PostgREST aplica un límite de filas por página (db-max-rows,
// típicamente 1000) que trunca el resultado en silencio si no se pagina
// explícitamente. Para exportar el resultado COMPLETO del filtro,
// recorremos con .range() acumulando páginas hasta agotar los resultados.
const PAGE_SIZE = 1000;
// Tope de seguridad para no iterar sin fin ante datos inesperados
// (100 páginas x 1000 filas = 100.000 facturas).
const MAX_PAGES = 100;

/**
 * Obtiene TODAS las filas que cumplen los filtros, paginando explícitamente
 * con .range() para evitar el truncado silencioso por el límite por defecto
 * de Supabase/PostgREST.
 * @param {ReturnType<typeof parseInvoiceFilters>['filters']} filters
 * @returns {Promise<{ data: Array<object>|null, error: Error|null }>}
 */
async function fetchAllInvoices(filters) {
  const allRows = [];

  for (let pageIndex = 0; pageIndex < MAX_PAGES; pageIndex++) {
    const offset = pageIndex * PAGE_SIZE;

    let query = supabase
      .from('invoices')
      .select(CSV_SELECT_COLUMNS);

    query = applyInvoiceFilters(query, filters);
    query = query
      .order('created_at', { ascending: false })
      // Desempate estable: sin un segundo criterio, dos facturas con el mismo
      // created_at podrian duplicarse u omitirse en el borde entre paginas.
      .order('id', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    const { data, error } = await query;

    if (error) {
      return { data: null, error };
    }

    const page = data || [];
    allRows.push(...page);

    if (page.length < PAGE_SIZE) {
      return { data: allRows, error: null };
    }
  }

  return {
    data: null,
    error: new Error(`Se alcanzó el límite de seguridad de ${MAX_PAGES * PAGE_SIZE} facturas al exportar`)
  };
}

export const GET = async ({ request, locals }) => {
  try {
    if (!locals?.isAdmin) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 403, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parsear query parameters
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);

    const { filters, error: filterError } = parseInvoiceFilters(params);
    if (filterError) {
      return new Response(
        JSON.stringify({ success: false, error: filterError }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Se exporta el resultado completo del filtro paginando internamente
    // (ver fetchAllInvoices) para no depender del límite de fila por
    // defecto de Supabase/PostgREST ni del límite de paginación de list.js.
    const { data: invoices, error } = await fetchAllInvoices(filters);

    if (error) {
      console.error('Error fetching invoices for CSV export:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Error al obtener facturas',
          details: error.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const csv = buildInvoiceCsv(invoices || []);
    const fileName = `facturas-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('Unexpected error in /api/invoices/export.csv:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
