/**
 * AdminInvoices - Componente principal del dashboard
 *
 * Gestiona:
 * - Estado de filtros
 * - Carga de datos
 * - Paginación
 * - Descarga de facturas
 */

import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import InvoiceFilters from './InvoiceFilters';
import InvoiceTable from './InvoiceTable';

export default function AdminInvoices() {
  // Estado de datos
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 50,
    total_count: 0,
    total_pages: 0
  });

  // Estado de filtros
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    nif: '',
    company: '',
    status: ''
  });

  // Estado de selección (para bulk download)
  const [selectedInvoices, setSelectedInvoices] = useState(new Set());

  /**
   * Cargar facturas desde el endpoint
   * @param {number} pageNum - Número de página (default: 1)
   * @param {object} filtersToUse - Filtros a usar (default: filtros del estado actual)
   */
  const loadInvoices = async (pageNum = 1, filtersToUse = null) => {
    setLoading(true);
    try {
      // Usar filtros pasados como parámetro o los del estado
      const activeFilters = filtersToUse || filters;

      // Construir query string
      const queryParams = new URLSearchParams();
      queryParams.append('page', pageNum);
      queryParams.append('per_page', pagination.per_page);

      if (activeFilters.date_from) queryParams.append('date_from', activeFilters.date_from);
      if (activeFilters.date_to) queryParams.append('date_to', activeFilters.date_to);
      if (activeFilters.nif) queryParams.append('nif', activeFilters.nif);
      if (activeFilters.company) queryParams.append('company', activeFilters.company);
      if (activeFilters.status) queryParams.append('status', activeFilters.status);

      // Llamar endpoint
      const response = await fetch(`/api/invoices/list?${queryParams}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.error || 'Error al cargar facturas');
        return;
      }

      setInvoices(data.invoices);
      setPagination(data.pagination);
      setSelectedInvoices(new Set()); // Limpiar selección al cambiar página

    } catch (error) {
      console.error('Error loading invoices:', error);
      toast.error('Error al cargar facturas');
    } finally {
      setLoading(false);
    }
  };

  // Cargar facturas al montar el componente (primera vez)
  useEffect(() => {
    loadInvoices(1);
  }, []);

  // Cargar facturas cuando cambian los filtros (volver a página 1)
  useEffect(() => {
    if (Object.values(filters).some(v => v)) {
      loadInvoices(1); // Solo recargar si hay filtros activos
    }
  }, [filters]);

  /**
   * Aplicar filtros
   */
  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  /**
   * Limpiar filtros
   */
  const handleClearFilters = () => {
    const clearedFilters = {
      date_from: '',
      date_to: '',
      nif: '',
      company: '',
      status: ''
    };
    setFilters(clearedFilters);
    // Recargar todas las facturas sin filtros pasándolos como parámetro
    loadInvoices(1, clearedFilters);
  };

  /**
   * Cambiar página
   */
  const handlePageChange = (newPage) => {
    loadInvoices(newPage);
  };

  /**
   * Seleccionar/deseleccionar una factura
   */
  const handleSelectInvoice = (invoiceId) => {
    const newSelected = new Set(selectedInvoices);
    if (newSelected.has(invoiceId)) {
      newSelected.delete(invoiceId);
    } else {
      newSelected.add(invoiceId);
    }
    setSelectedInvoices(newSelected);
  };

  /**
   * Seleccionar todas las facturas de la página
   */
  const handleSelectAll = () => {
    if (selectedInvoices.size === invoices.length) {
      // Si todas están seleccionadas, deseleccionar todas
      setSelectedInvoices(new Set());
    } else {
      // Si no todas están seleccionadas, seleccionar todas
      const newSelected = new Set(invoices.map(inv => inv.id));
      setSelectedInvoices(newSelected);
    }
  };

  /**
   * Descargar facturas seleccionadas
   */
  const handleBulkDownload = async () => {
    if (selectedInvoices.size === 0) {
      toast.error('Selecciona al menos una factura');
      return;
    }

    setLoading(true);
    try {
      // Llamar endpoint de bulk download
      const response = await fetch('/api/invoices/bulk-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_ids: Array.from(selectedInvoices)
        })
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Error al descargar facturas');
        return;
      }

      // TODO: Cuando se implemente ZIP, hacer descarga aquí
      // Por ahora es un placeholder
      const data = await response.json();
      toast.success(`${data.files_ready} facturas listas para descargar`);

    } catch (error) {
      console.error('Error in bulk download:', error);
      toast.error('Error al descargar facturas');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Descargar una factura individual
   */
  const handleDownloadInvoice = async (invoiceId, invoiceNumber, companyName) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`);

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Error al descargar PDF');
        return;
      }

      // Obtener nombre del archivo del header Content-Disposition
      const contentDisposition = response.headers.get('content-disposition');
      let fileName = `FACTURA_${invoiceNumber}_${companyName}.pdf`;

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+?)"/);
        if (fileNameMatch) fileName = fileNameMatch[1];
      }

      // Crear blob y descargar
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Descargando: ${fileName}`);

    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Error al descargar factura');
    }
  };

  /**
   * Editar factura (copiar items al carrito)
   * Guarda en localStorage y redirige a /carrito para editar
   */
  const handleEditInvoice = async (invoiceId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/copy-to-cart`, {
        method: 'POST'
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Error al copiar factura al carrito');
        setLoading(false);
        return;
      }

      const data = await response.json();

      // ⚠️ IMPORTANTE: Limpiar los flags para que CartPage sepa que debe cargar los datos nuevos
      localStorage.removeItem('editingInvoiceLoaded');
      localStorage.removeItem('editingInvoiceNumber');
      localStorage.removeItem('editingInvoiceId');
      localStorage.removeItem('editingCustomerInfo');

      // Guardar datos en localStorage para que CartPage los detecte
      localStorage.setItem('editingInvoice', JSON.stringify({
        original_invoice_id: data.invoice_id,
        original_invoice_number: data.original_invoice_number,
        items: data.items,
        customer_info: data.customer_info
      }));

      toast.success(`Factura ${data.original_invoice_number} copiada al carrito`);

      // Redirigir a /carrito
      window.location.href = '/carrito';

    } catch (error) {
      console.error('Error editing invoice:', error);
      toast.error('Error al editar factura');
      setLoading(false);
    }
  };

  /**
   * Eliminar una factura
   */
  const handleDeleteInvoice = async (invoiceId, invoiceNumber) => {
    // Confirmar eliminación
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la factura ${invoiceNumber}? Esta acción no se puede deshacer.`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Error al eliminar factura');
        setLoading(false);
        return;
      }

      // Recargar la lista de facturas
      toast.success(`Factura ${invoiceNumber} eliminada correctamente`);
      loadInvoices(pagination.page);

    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Error al eliminar factura');
      setLoading(false);
    }
  };

  /**
   * Actualizar número de Shopify
   * Soporta actualizar o eliminar (con string vacío)
   */
  const handleUpdateShopifyNumber = async (invoiceId, newNumber) => {
    const trimmedNumber = newNumber.trim();

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/update-shopify-number`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopify_order_number: trimmedNumber })
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Error al actualizar número de Shopify');
        return;
      }

      // Actualizar el estado local
      setInvoices(invoices.map(inv =>
        inv.id === invoiceId
          ? { ...inv, shopify_order_number: trimmedNumber }
          : inv
      ));

      // Mensaje según la acción
      const actionMsg = trimmedNumber ? 'actualizado' : 'eliminado';
      toast.success(`Número de Shopify ${actionMsg}`);
    } catch (error) {
      console.error('Error updating shopify number:', error);
      toast.error('Error al actualizar número de Shopify');
    }
  };

  return (
    <>
      <Toaster position="bottom-center" reverseOrder={false} />

      <div className="space-y-8">
        {/* Filtros */}
        <InvoiceFilters
          filters={filters}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          disabled={loading}
        />

        {/* Tabla de facturas */}
        <InvoiceTable
          invoices={invoices}
          loading={loading}
          pagination={pagination}
          selectedInvoices={selectedInvoices}
          onSelectInvoice={handleSelectInvoice}
          onSelectAll={handleSelectAll}
          onPageChange={handlePageChange}
          onDownload={handleDownloadInvoice}
          onEdit={handleEditInvoice}
          onDelete={handleDeleteInvoice}
          onUpdateShopifyNumber={handleUpdateShopifyNumber}
        />

        {/* Acciones de bulk */}
        {selectedInvoices.size > 0 && (
          <div className="sticky bottom-4 bg-white rounded-lg shadow-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">
                {selectedInvoices.size} factura(s) seleccionada(s)
              </p>
              <button
                onClick={handleBulkDownload}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                {loading ? '⏳ Descargando...' : `📥 Descargar ${selectedInvoices.size}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
