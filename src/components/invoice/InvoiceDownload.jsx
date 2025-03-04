// InvoiceDownload.jsx
import InvoicePDF from "@components/invoice/InvoicePDF";
import { PDFDownloadLink } from "@react-pdf/renderer";
import ErrorBoundary from "@components/errors/ErrorBoundary";

const InvoiceDownload = ({ items = [], total, dni, iban, customerInfo  }) => (
    <ErrorBoundary>
      <PDFDownloadLink
        document={<InvoicePDF 
                    items={items} 
                    total={total} 
                    dni={dni} 
                    iban={iban} 
                    selectedCustomer={customerInfo} />}
        key={Math.random()}
        fileName="factura.pdf"
        style={{
          textDecoration: "none",
          padding: "12px",
          color: "#fff",
          backgroundColor: "#007BFF",
          borderRadius: "50px",
        }}
      >
        {({ loading, error }) => {
          if (error) {
            console.error("Error generando PDF:", error);
            return "Error generando PDF";
          }
          return loading ? "Generando PDF..." : "Descargar PDF";
        }}
      </PDFDownloadLink>
    </ErrorBoundary>
);

export default InvoiceDownload;
