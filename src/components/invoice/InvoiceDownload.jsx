import InvoicePDF from "@components/invoice/InvoicePDF";
import {PDFDownloadLink } from '@react-pdf/renderer';
const InvoiceDownload = ({ items, total, dni, iban }) => (
  <div>
    <PDFDownloadLink
      document={<InvoicePDF items={items} total={total} dni={dni} iban={iban} />}
      fileName="factura.pdf"
      style={{
        textDecoration: "none",
        padding: "10px",
        color: "#fff",
        backgroundColor: "#007BFF",
        borderRadius: "5px",
      }}
    >
      {({ loading }) => (loading ? "Generando PDF..." : "Descargar PDF")}
    </PDFDownloadLink>
  </div>
);

export default InvoiceDownload;
