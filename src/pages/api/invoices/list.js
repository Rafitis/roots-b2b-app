/**
 * GET /api/invoices/list.js
 *
 * Retorna lista de facturas con soporte para filtros
 * Solo accesible por usuarios autenticados como admin (middleware lo valida)
 *
 * Query Parameters:
 * - date_from: Fecha inicio (YYYY-MM-DD)
 * - date_to: Fecha fin (YYYY-MM-DD)
 * - nif: NIF/CIF a buscar
 * - company: Nombre de empresa a buscar
 * - status: Estado (pending_review, shopify_draft, completed, cancelled)
 * - is_paid: Filtrar por estado de pago ('true' | 'false')
 * - page: Número de página (default: 1)
 * - per_page: Resultados por página (default: 50, max: 100)
 */

import { createClient } from '@supabase/supabase-js';
import { parseInvoiceFilters, applyInvoiceFilters } from '../../../lib/invoice-filters.js';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Faltan variables de entorno: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Validar y sanitizar parámetros
    const page = Math.max(1, parseInt(params.page) || 1);
    const perPage = Math.min(100, Math.max(10, parseInt(params.per_page) || 50));

    const { filters, error: filterError } = parseInvoiceFilters(params);
    if (filterError) {
      return new Response(
        JSON.stringify({ success: false, error: filterError }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const { nif, company, status, isPaid } = filters;

    // Construir query base
    let query = supabase
      .from('invoices')
      .select('*', { count: 'exact' });

    // Aplicar filtros
    query = applyInvoiceFilters(query, filters);

    // Ordenar por fecha descendente (más recientes primero)
    query = query.order('created_at', { ascending: false });

    // Aplicar paginación
    const offset = (page - 1) * perPage;
    query = query.range(offset, offset + perPage - 1);

    // Ejecutar query
    const { data: invoices, error, count } = await query;

    if (error) {
      console.error('Error fetching invoices:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Error al obtener facturas',
          details: error.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Retornar respuesta
    return new Response(
      JSON.stringify({
        success: true,
        invoices: invoices || [],
        pagination: {
          page,
          per_page: perPage,
          total_count: count || 0,
          total_pages: Math.ceil((count || 0) / perPage)
        },
        filters: {
          date_from: params.date_from || null,
          date_to: params.date_to || null,
          nif: nif,
          company: company,
          status: status || null,
          is_paid: isPaid
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in /api/invoices/list:', error);
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
