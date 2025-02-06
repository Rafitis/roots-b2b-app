import InvoicePDF from "@components/invoice/InvoicePDF";
import { PDFDownloadLink } from "@react-pdf/renderer";


const InvoiceDownload = ({ final_items, total, dni, iban }) => (
  <div>
    <PDFDownloadLink
      document={<InvoicePDF items={final_items} total={total} dni={dni} iban={iban} />}
      fileName="factura.pdf"
      style={{
        textDecoration: "none",
        padding: "12px",
        color: "#fff",
        backgroundColor: "#007BFF",
        borderRadius: "50px",
      }}
    >
      {({ loading }) => (loading ? "Generando PDF..." : "Descargar PDF")}
    </PDFDownloadLink>
  </div>
);

export default InvoiceDownload;
