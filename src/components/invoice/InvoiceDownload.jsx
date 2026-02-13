// InvoiceDownload.jsx
import React, { useState, useEffect } from 'react';
import {
  Document,
  Page,
  Text,
  StyleSheet,
  pdf
} from '@react-pdf/renderer';
import InvoicePDF from '@components/invoice/InvoicePDF';
import ErrorBoundary from '@components/errors/ErrorBoundary';
import { useTranslations } from '@i18n/utils';
import { useI18n } from '@hooks/useI18n';
import { getCart, getCartTotals } from '@hooks/useCart';
import toast from 'react-hot-toast'

// Estilo mínimo para la página de fallback
const fallbackStyles = StyleSheet.create({
  page: { padding: 30, fontSize: 12, textAlign: 'center' }
});

const CombinedInvoice = React.memo( ({
  regularItems = [],
  preOrderItems = [],
  dni,
  iban,
  selectedCustomer,
  title
}) => {
  // Asegurarse que los arrays son válidos
  const safeRegularItems = Array.isArray(regularItems) ? regularItems : [];
  const safePreOrderItems = Array.isArray(preOrderItems) ? preOrderItems : [];
  
  const hasAny = safeRegularItems.length > 0 || safePreOrderItems.length > 0;

  return (
    <Document>
      {hasAny ? (
        <>
          {regularItems.length > 0 && (
            <InvoicePDF
              onlyPage={true}
              title={title}
              items={regularItems}
              dni={dni}
              iban={iban}
              selectedCustomer={selectedCustomer}
              preSale={false}
            />
          )}
          {preOrderItems.length > 0 && (
            <InvoicePDF
              onlyPage={true}
              title={`${title || 'Factura'} Preventa`}
              items={preOrderItems}
              dni={dni}
              iban={iban}
              selectedCustomer={selectedCustomer}
              preSale={true}
            />
          )}
        </>
      ) : (
        // Fallback si no hay ningún item
        <Page size="A4" style={fallbackStyles.page}>
          <Text>No hay artículos para generar factura.</Text>
        </Page>
      )}
    </Document>
  );
});

const InvoiceDownload = ({
  items = [],
  dni,
  iban,
  customerInfo,
  title,
  totals = {}, // Se espera: { total_sin_iva, iva, recargo, total }
  isEditingMode = false,
  editingInvoiceId = null
}) => {

  const { currentLang } = useI18n();
  const t = useTranslations(currentLang);

  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Dar tiempo para que react-pdf se inicialice
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return <span>{t('download.generating')}</span>;
  }

  // 2. Campos obligatorios
  const requiredFields = {
    name: customerInfo.fiscal_name,
    tin: customerInfo.nif_cif,
    address: customerInfo.address,
  };

  // 3. Detectar faltantes
  const missing = Object.entries(requiredFields)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  /**
   * Genera el PDF en base64 y lo envía al servidor para guardarlo
   *
   * 🛡️ PROTECCIÓN CONTRA RACE CONDITION:
   * Lee items y totales DIRECTAMENTE del store en el momento de guardar
   * para garantizar que siempre se guarden datos actualizados
   */
  const saveInvoiceToServer = async (pdfBlob) => {
    try {
      setIsSaving(true);

      // 🔒 CRÍTICO: Leer items y totales AHORA desde el store
      // No confiar en las props (pueden estar desactualizadas por race condition)
      const currentItems = getCart();
      const currentTotals = getCartTotals(customerInfo, true);

      // ✅ VALIDACIÓN: Detectar desincronización entre props y store
      const itemsDiff = Math.abs(currentItems.length - items.length);
      const totalsDiff = Math.abs(currentTotals.total_factura - (totals.total_factura || 0));

      if (itemsDiff > 0 || totalsDiff > 1) {
        console.error('❌ DESINCRONIZACIÓN DETECTADA:', {
          propsItems: items.length,
          storeItems: currentItems.length,
          propsTotals: totals.total_factura,
          storeTotals: currentTotals.total_factura,
          diff: totalsDiff
        });
        toast.error('Error: Datos desactualizados. Por favor recarga la página.');
        setIsSaving(false);
        return;
      }

      // Convertir blob a base64
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);

      reader.onload = async () => {
        const pdfBase64 = reader.result;

        // Preparar datos de items desde currentItems (store actual)
        const itemsData = currentItems.map(item => {
          const single_price = Number(item.price);
          const discountFactor = 1 - Number(item.discount) / 100;
          const total = (item.quantity * single_price * discountFactor).toFixed(2);

          return {
            id: item.id,
            product_id: item.product_id,
            tag: item.tag,
            name: item.name,
            color: item.color,
            size: item.size,
            quantity: item.quantity,
            price: single_price,
            discount: item.discount,
            total: parseFloat(total),
            product_img: item.product_img,
            sku: item.sku,
            isPreOrder: item.isPreOrder || false
          };
        });

        // Separar preorders desde currentItems
        const currentPreOrderItems = currentItems.filter(i => i.isPreOrder);

        // Preparar datos de factura usando currentTotals (store actual)
        const invoiceData = {
          company_name: customerInfo.fiscal_name,
          nif_cif: customerInfo.nif_cif,
          address: customerInfo.address,
          country: customerInfo.country || 'ES',
          items_count: currentItems.length,
          items_data: itemsData,
          total_amount_eur: currentTotals.total_factura || 0,
          vat_amount: currentTotals.iva || 0,
          surcharge_applied: !!customerInfo.isRecharge,
          surcharge_amount: currentTotals.recargo || 0,
          shipping_amount: currentTotals.shipping || 0,
          is_preorder: currentPreOrderItems.length > 0,
          // Si estamos editando, pasar el ID de la factura original
          previous_invoice_id: isEditingMode ? editingInvoiceId : null,
          // Incluir número de Shopify si existe
          shopify_order_number: customerInfo.shopify_order_number || null
        };

        // Enviar al servidor
        try {
          const response = await fetch('/api/invoices/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              invoice_data: invoiceData,
              pdf_base64: pdfBase64
            })
          });

          const result = await response.json();

          if (response.ok && result.success) {
            // Si estamos en modo edición, marcar la factura original como 'cancelled'
            if (isEditingMode && editingInvoiceId) {
              try {
                await fetch(`/api/invoices/${editingInvoiceId}/cancel`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' }
                });
              } catch (error) {
                console.error('Error cancelling original invoice:', error);
                // No interrumpir el flujo aunque falle cancelar
              }
            }

            const successMessage = isEditingMode
              ? `${t('download.success')} ${result.invoice_number} (Original marcada como cancelada)`
              : `${t('download.success')} ${result.invoice_number}`;

            toast.success(successMessage);

            // Limpiar localStorage de edición si estábamos editando
            if (isEditingMode) {
              localStorage.removeItem('editingInvoice');
              localStorage.removeItem('editingInvoiceLoaded');
              localStorage.removeItem('editingCustomerInfo');
              localStorage.removeItem('editingInvoiceNumber');
              localStorage.removeItem('editingInvoiceId');

              // Redirigir al dashboard de admin después de guardar
              setTimeout(() => {
                window.location.href = '/admin/invoices';
              }, 2000);
            }
          } else {
            // El PDF se descargó pero no se guardó en servidor
            toast.error(result.error || 'Error al guardar en servidor');
            console.error('Error saving invoice:', result);
          }
        } catch (error) {
          console.error('Error calling save endpoint:', error);
          toast.error('Error al guardar factura en servidor');
        } finally {
          setIsSaving(false);
        }
      };

      reader.onerror = () => {
        console.error('Error reading PDF blob');
        toast.error('Error al procesar PDF');
        setIsSaving(false);
      };
    } catch (error) {
      console.error('Error in saveInvoiceToServer:', error);
      toast.error('Error inesperado');
      setIsSaving(false);
    }
  };

  const handleDownloadClick = async (e) => {
    if (missing.length > 0) {
      e.preventDefault();
      // Traduce (o formatea) cada campo que falte
      const labels = missing.map(f => t(`fields.${f}`) || f);
      toast.error(`Por favor completa: ${labels.join(', ')}`);
      return;
    }

    // Generar PDF y guardarlo en servidor
    if (!isSaving) {
      try {
        const currentItems = getCart();
        const currentRegularItems = currentItems.filter(i => !i.isPreOrder);
        const currentPreOrderItems = currentItems.filter(i => i.isPreOrder);

        const pdfDocument = (
          <CombinedInvoice
            regularItems={currentRegularItems}
            preOrderItems={currentPreOrderItems}
            dni={dni}
            iban={iban}
            selectedCustomer={customerInfo}
            title={title}
          />
        );

        const pdfBlob = await pdf(pdfDocument).toBlob();
        const downloadUrl = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${t('download.documentTitle')}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
        await saveInvoiceToServer(pdfBlob);
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast.error('Error al generar PDF');
      }
    }
  };

  return (
    <ErrorBoundary>
      <button
        type="button"
        className="btn btn-primary hover:scale-105 text-white"
        onClick={handleDownloadClick}
        disabled={isSaving}
      >
        {isSaving ? t('download.generating') : t('download.message')}
      </button>
    </ErrorBoundary>
  );
};

export default InvoiceDownload;
