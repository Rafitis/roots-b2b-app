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

import { Download, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function InvoiceTable({
  invoices,
  loading,
  pagination,
  selectedInvoices,
  onSelectInvoice,
  onSelectAll,
  onPageChange,
  onDownload,
  onEdit,
  onDelete,
  onUpdateShopifyNumber
}) {
  
  const [editingShopifyNumbers, setEditingShopifyNumbers] = useState({});

  const handleShopifyNumberChange = (invoiceId, newValue) => {
    setEditingShopifyNumbers(prev => ({
      ...prev,
      [invoiceId]: newValue
    }));
  };

  const handleShopifyNumberBlur = async (invoiceId) => {
    const newNumber = editingShopifyNumbers[invoiceId];
    if (newNumber !== undefined) {
      // Esperar a que se complete la actualización antes de limpiar
      await onUpdateShopifyNumber(invoiceId, newNumber);
      // Limpiar el estado local después de que se complete
      setEditingShopifyNumbers(prev => {
        const updated = { ...prev };
        delete updated[invoiceId];
        return updated;
      });
    }
  };

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
      rehashed: { bg: 'bg-blue-100', text: 'text-blue-800', label: '🔄 Rehecha' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: '❌ Cancelada' }
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
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">País</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">NIF/CIF</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Pedido Shopify</th>
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

                {/* País */}
                <td className="px-4 py-3 text-center text-sm text-gray-600 font-mono">
                  {invoice.country || '—'}
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

                {/* Pedido Shopify */}
                <td className="px-4 py-3 text-center">
                  <input
                    type="text"
                    value={editingShopifyNumbers[invoice.id] !== undefined ? editingShopifyNumbers[invoice.id] : (invoice.shopify_order_number || '')}
                    onChange={(e) => handleShopifyNumberChange(invoice.id, e.target.value)}
                    onBlur={() => handleShopifyNumberBlur(invoice.id)}
                    placeholder="—"
                    disabled={loading || invoice.status === 'cancelled'}
                    className="w-32 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
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
                <td className="px-4 py-3 text-center flex gap-2 justify-center">
                  <div className="tooltip" data-tip="Descargar PDF">
                    <button
                      onClick={() => onDownload(
                        invoice.id,
                        invoice.invoice_number,
                        invoice.company_name
                      )}
                      disabled={loading}
                      className="btn btn-primary btn-sm"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                  {invoice.status !== 'cancelled' && (
                    <div className="tooltip" data-tip="Editar factura">
                      <button
                        onClick={() => onEdit(invoice.id)}
                        disabled={loading}
                        className="btn btn-secondary btn-sm"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  )}
                  <div className="tooltip" data-tip="Eliminar factura">
                    <button
                      onClick={() => onDelete(invoice.id, invoice.invoice_number)}
                      disabled={loading}
                      className="btn btn-error btn-sm"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
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
