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

// Estilo mínimo para la página de fallback
const fallbackStyles = StyleSheet.create({
  page: { padding: 30, fontSize: 12, textAlign: 'center' }
});

const CombinedInvoice = React.memo( ({
  regularItems,
  preOrderItems,
  dni,
  iban,
  selectedCustomer,
  title
}) => {
  // Asegurarse que los arrays son válidos
  const safeRegularItems = Array.isArray(regularItems) ? regularItems : [];
  const safePreOrderItems = Array.isArray(preOrderItems) ? preOrderItems : [];
  
  const hasAny = safeRegularItems.length > 0 || safePreOrderItems.length > 0;

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Dar tiempo para que react-pdf se inicialice
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return <span>Preparando documento...</span>;
  }

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

  return (
    <ErrorBoundary>
      <PDFDownloadLink
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
        fileName="factura.pdf"
        style={linkStyle}
      >
        {({ loading, error }) => {
          if (error) {
            console.error('Error generando factura combinada:', error);
            return 'Error generando factura';
          }
          return loading ? 'Generando factura...' : 'Descargar factura';
        }}
      </PDFDownloadLink>
    </ErrorBoundary>
  );
};

export default InvoiceDownload;
