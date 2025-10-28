/**
 * InvoiceTable - Tabla de facturas con paginación
 *
 * Muestra:
 * - Checkbox para seleccionar
 * - Número de factura
 * - Empresa
 * - NIF/CIF
 * - Fecha
 * - Total
 * - Estado
 * - Acciones (descargar, ver)
 */

import React from 'react';

export default function InvoiceTable({
  invoices,
  loading,
  pagination,
  selectedInvoices,
  onSelectInvoice,
  onSelectAll,
  onPageChange,
  onDownload
}) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '📝 Borrador' },
      finalized: { bg: 'bg-green-100', text: 'text-green-800', label: '✅ Finalizada' },
      rehashed: { bg: 'bg-blue-100', text: 'text-blue-800', label: '🔄 Rehecha' }
    };
    const s = statusMap[status] || statusMap.finalized;
    return s;
  };

  if (loading && invoices.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-gray-500">⏳ Cargando facturas...</p>
      </div>
    );
  }

  if (!loading && invoices.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-gray-500">📭 No hay facturas que coincidan con los filtros</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              {/* Checkbox seleccionar todo */}
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={invoices.length > 0 && selectedInvoices.size === invoices.length}
                  onChange={onSelectAll}
                  disabled={loading}
                  className="rounded cursor-pointer disabled:cursor-not-allowed"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Factura</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Empresa</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">NIF/CIF</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Estado</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr
                key={invoice.id}
                className={`border-b border-gray-200 hover:bg-gray-50 transition ${
                  selectedInvoices.has(invoice.id) ? 'bg-blue-50' : ''
                }`}
              >
                {/* Checkbox */}
                <td className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.has(invoice.id)}
                    onChange={() => onSelectInvoice(invoice.id)}
                    disabled={loading}
                    className="rounded cursor-pointer disabled:cursor-not-allowed"
                  />
                </td>

                {/* Número de factura */}
                <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                  {invoice.invoice_number}
                </td>

                {/* Empresa */}
                <td className="px-4 py-3 text-sm text-gray-900">
                  {invoice.company_name}
                </td>

                {/* NIF/CIF */}
                <td className="px-4 py-3 text-sm text-gray-600">
                  {invoice.nif_cif}
                </td>

                {/* Fecha */}
                <td className="px-4 py-3 text-sm text-gray-600">
                  {formatDate(invoice.created_at)}
                </td>

                {/* Total */}
                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                  {formatCurrency(invoice.total_amount_eur)}
                </td>

                {/* Estado */}
                <td className="px-4 py-3 text-center">
                  {(() => {
                    const s = getStatusBadge(invoice.status);
                    return (
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${s.bg} ${s.text}`}>
                        {s.label}
                      </span>
                    );
                  })()}
                </td>

                {/* Acciones */}
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => onDownload(
                      invoice.id,
                      invoice.invoice_number,
                      invoice.company_name
                    )}
                    disabled={loading}
                    className="inline-block px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 disabled:bg-gray-400 transition"
                    title="Descargar PDF"
                  >
                    📥
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {pagination.total_pages > 1 && (
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Mostrando <strong>{(pagination.page - 1) * pagination.per_page + 1}</strong> a{' '}
            <strong>
              {Math.min(pagination.page * pagination.per_page, pagination.total_count)}
            </strong>{' '}
            de <strong>{pagination.total_count}</strong> facturas
          </p>

          <div className="flex gap-2">
            {/* Botón anterior */}
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
            >
              ← Anterior
            </button>

            {/* Número de páginas */}
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  disabled={loading}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    pageNum === pagination.page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            {/* Botón siguiente */}
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.total_pages || loading}
              className="px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
