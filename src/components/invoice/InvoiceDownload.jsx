// InvoiceDownload.jsx
import React, {useMemo, useState, useEffect} from 'react';
import {
  PDFDownloadLink,
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
import toast, { Toaster } from 'react-hot-toast'

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

  // Usa useMemo para evitar recálculos innecesarios
  const preOrderItems = useMemo(() => items.filter(i => i.isPreOrder), [items]);
  const regularItems = useMemo(() => items.filter(i => !i.isPreOrder), [items]);

  const linkStyle = {
    textDecoration: 'none',
    padding: '12px',
    color: '#fff',
    backgroundColor: '#121212',
    borderRadius: '10px',
    display: 'inline-block',
  };

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
   */
  const saveInvoiceToServer = async (pdfBlob) => {
    try {
      setIsSaving(true);

      // Convertir blob a base64
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);

      reader.onload = async () => {
        const pdfBase64 = reader.result;

        // Preparar datos de items para guardar en JSONB
        // Estructura: [{ id, name, color, size, quantity, price, discount, total, product_img }, ...]
        const itemsData = items.map(item => {
          const single_price = Number(item.price);
          const discountFactor = 1 - Number(item.discount) / 100;
          const total = (item.quantity * single_price * discountFactor).toFixed(2);

          return {
            id: item.id,
            name: item.name,
            color: item.color,
            size: item.size,
            quantity: item.quantity,
            price: single_price,
            discount: item.discount,
            total: parseFloat(total),
            product_img: item.product_img,
            isPreOrder: item.isPreOrder || false
          };
        });

        // Preparar datos de factura
        const invoiceData = {
          company_name: customerInfo.fiscal_name,
          nif_cif: customerInfo.nif_cif,
          address: customerInfo.address,
          country: customerInfo.country || 'ES',
          items_count: items.length,
          items_data: itemsData,
          total_amount_eur: totals.total_factura || 0,
          vat_amount: totals.iva || 0,
          surcharge_applied: !!customerInfo.isRecharge,
          surcharge_amount: totals.recargo || 0,
          shipping_amount: totals.shipping || 0,
          is_preorder: preOrderItems.length > 0,
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
            console.log('Factura guardada:', result);

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
        const pdfDocument = (
          <CombinedInvoice
            regularItems={regularItems}
            preOrderItems={preOrderItems}
            dni={dni}
            iban={iban}
            selectedCustomer={customerInfo}
            title={title}
          />
        );

        const pdfBlob = await pdf(pdfDocument).toBlob();
        await saveInvoiceToServer(pdfBlob);
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast.error('Error al generar PDF');
      }
    }
  };

  return (
    <>
      <Toaster position="bottom-center" reverseOrder={false} />
      <ErrorBoundary>
        <PDFDownloadLink
          key={`${regularItems.length}-${preOrderItems.length}`}
          document={
            <CombinedInvoice
              regularItems={regularItems}
              preOrderItems={preOrderItems}
              dni={dni}
              iban={iban}
              selectedCustomer={customerInfo}
              title={title}
            />
          }
          fileName={`${t('download.documentTitle')}.pdf`}
          className="btn btn-primary hover:scale-105 text-white"
          onClick={handleDownloadClick}  // intercepta el click
        >
          {({ loading, error }) => {
              if (error) {
                console.error('Error generando factura combinada:', error);
                return t('download.error');
              }
              return loading
                ? t('download.generating')
                : t('download.message');
            }}
        </PDFDownloadLink>
      </ErrorBoundary>
    </>
  );
};

export default InvoiceDownload;
