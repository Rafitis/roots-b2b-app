// InvoiceDownload.jsx
import React, {useMemo, useState, useEffect} from 'react';
import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  StyleSheet
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
  title
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
    backgroundColor: '#007BFF',
    borderRadius: '50px',
    display: 'inline-block'
  };

  const [isReady, setIsReady] = useState(false);

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
    // añade aquí los que necesites...
  };

  // 3. Detectar faltantes
  const missing = Object.entries(requiredFields)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

    
  const handleDownloadClick = (e) => {
    if (missing.length > 0) {
      e.preventDefault();
      // Traduce (o formatea) cada campo que falte
      const labels = missing.map(f => t(`fields.${f}`) || f);
      toast.error(`Por favor completa: ${labels.join(', ')}`);
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
          style={linkStyle}
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
