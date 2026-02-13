/**
 * InvoiceTable - Tabla de facturas con paginación
 */

import { Download, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
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
      await onUpdateShopifyNumber(invoiceId, newNumber);
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
      draft: { classes: 'bg-warning/10 text-warning', label: 'Borrador' },
      finalized: { classes: 'bg-success/10 text-success', label: 'Finalizada' },
      rehashed: { classes: 'bg-info/10 text-info', label: 'Rehecha' },
      cancelled: { classes: 'bg-error/10 text-error', label: 'Cancelada' }
    };
    return statusMap[status] || statusMap.finalized;
  };

  if (loading && invoices.length === 0) {
    return (
      <div className="card-b2b p-12 text-center">
        <span className="loading loading-spinner loading-md text-roots-clay"></span>
        <p className="text-sm text-roots-clay mt-2">Cargando facturas...</p>
      </div>
    );
  }

  if (!loading && invoices.length === 0) {
    return (
      <div className="card-b2b p-12 text-center">
        <p className="text-sm text-roots-clay">No hay facturas que coincidan con los filtros</p>
      </div>
    );
  }

  return (
    <div className="card-b2b overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-base-200/60 sticky top-0 z-10">
            <tr className="text-left text-xs font-medium text-roots-earth uppercase tracking-wider">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={invoices.length > 0 && selectedInvoices.size === invoices.length}
                  onChange={onSelectAll}
                  disabled={loading}
                  className="checkbox checkbox-sm border-base-300"
                />
              </th>
              <th className="px-4 py-3">Factura</th>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3 text-center">País</th>
              <th className="px-4 py-3">NIF/CIF</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-center">Pedido Shopify</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-300/40">
            {invoices.map((invoice) => (
              <tr
                key={invoice.id}
                className={[
                  'hover:bg-base-200/30 transition-colors',
                  selectedInvoices.has(invoice.id) ? 'bg-primary/5' : ''
                ].join(' ')}
              >
                <td className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.has(invoice.id)}
                    onChange={() => onSelectInvoice(invoice.id)}
                    disabled={loading}
                    className="checkbox checkbox-sm border-base-300"
                  />
                </td>

                <td className="px-4 py-3 font-semibold text-roots-bark">
                  {invoice.invoice_number}
                </td>

                <td className="px-4 py-3 text-roots-bark">
                  {invoice.company_name}
                </td>

                <td className="px-4 py-3 text-center text-roots-earth font-mono text-xs">
                  {invoice.country || '—'}
                </td>

                <td className="px-4 py-3 text-roots-earth">
                  {invoice.nif_cif}
                </td>

                <td className="px-4 py-3 text-roots-earth tabular-nums">
                  {formatDate(invoice.created_at)}
                </td>

                <td className="px-4 py-3 font-semibold text-roots-bark text-right tabular-nums">
                  {formatCurrency(invoice.total_amount_eur)}
                </td>

                <td className="px-4 py-3 text-center">
                  <input
                    type="text"
                    value={editingShopifyNumbers[invoice.id] !== undefined ? editingShopifyNumbers[invoice.id] : (invoice.shopify_order_number || '')}
                    onChange={(e) => handleShopifyNumberChange(invoice.id, e.target.value)}
                    onBlur={() => handleShopifyNumberBlur(invoice.id)}
                    placeholder="—"
                    disabled={loading || invoice.status === 'cancelled'}
                    className="w-28 px-2 py-1 text-xs text-center border border-base-300 rounded bg-base-100 focus:border-roots-clay focus:outline-none disabled:bg-base-200 disabled:cursor-not-allowed transition-colors"
                  />
                </td>

                <td className="px-4 py-3 text-center">
                  {(() => {
                    const s = getStatusBadge(invoice.status);
                    return (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${s.classes}`}>
                        {s.label}
                      </span>
                    );
                  })()}
                </td>

                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-center">
                    <button
                      onClick={() => onDownload(invoice.id, invoice.invoice_number, invoice.company_name)}
                      disabled={loading}
                      className="p-1.5 rounded text-roots-clay hover:text-roots-bark hover:bg-base-200 disabled:opacity-40 transition-colors"
                      title="Descargar PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {invoice.status !== 'cancelled' && (
                      <button
                        onClick={() => onEdit(invoice.id)}
                        disabled={loading}
                        className="p-1.5 rounded text-roots-clay hover:text-roots-bark hover:bg-base-200 disabled:opacity-40 transition-colors"
                        title="Editar factura"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(invoice.id, invoice.invoice_number)}
                      disabled={loading}
                      className="p-1.5 rounded text-roots-clay hover:text-error hover:bg-error/10 disabled:opacity-40 transition-colors"
                      title="Eliminar factura"
                    >
                      <Trash2 className="w-4 h-4" />
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
        <div className="bg-base-200/40 border-t border-base-300/40 px-4 py-3 flex items-center justify-between">
          <p className="text-xs text-roots-earth">
            Mostrando <span className="font-medium text-roots-bark">{(pagination.page - 1) * pagination.per_page + 1}</span> a{' '}
            <span className="font-medium text-roots-bark">
              {Math.min(pagination.page * pagination.per_page, pagination.total_count)}
            </span>{' '}
            de <span className="font-medium text-roots-bark">{pagination.total_count}</span> facturas
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="p-1.5 rounded text-roots-earth hover:text-roots-bark hover:bg-base-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                disabled={loading}
                className={[
                  'min-w-[28px] h-7 rounded text-xs font-medium transition-colors',
                  pageNum === pagination.page
                    ? 'bg-primary text-primary-content'
                    : 'text-roots-earth hover:bg-base-200 disabled:cursor-not-allowed'
                ].join(' ')}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.total_pages || loading}
              className="p-1.5 rounded text-roots-earth hover:text-roots-bark hover:bg-base-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
