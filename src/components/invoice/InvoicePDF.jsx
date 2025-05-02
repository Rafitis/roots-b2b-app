// InvoicePDF.jsx
import { Page, Text, View, Image, Document, StyleSheet } from "@react-pdf/renderer";
import { useTranslations } from "@i18n/utils";
import { useI18n } from "@hooks/useI18n";

// Estilos del PDF
const styles = StyleSheet.create({
  invoiceTitle: {
    fontSize: 18,                // más grande que el texto normal
    fontFamily: "Helvetica-Bold",// negrita
    textAlign: "center",         // centrado horizontal
    textDecoration: "underline", // subrayado
    marginBottom: 10,            // espacio bajo el título
  },
  page: {
    padding: 30,
    fontSize: 10,
    backgroundColor: "#fff",
    fontFamily: "Helvetica",
    color: "#262626",
  },
  bold: {
    fontFamily: "Helvetica-Bold",
    fontWeight: 900,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  table: {
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#000",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    padding: 8,
  },
  cell: {
    flex: 2,
    textAlign: "center",
  },
  cell_secondary: {
    flex: 0.8,
    textAlign: "center",
  },
  cell_terciary: {
    flex: 1,
    textAlign: "center",
  },
  cell_title: {
    flex: 2,
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
    fontWeight: 900,
  },
  cell_title_secondary: {
    flex: 0.8,
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
    fontWeight: 900,
  },
  cell_title_terciary: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
    fontWeight: 900,
  },
  total: {
    marginTop: 10,
    textAlign: "right",
  },
  remitente: {
    marginTop: 10,
    textAlign: "left",
  },
});

// Función para formatear el IBAN
function formatIBAN(iban) {
  if (!iban) {
    return "";
  }
  const grupos = iban.match(/.{1,4}/g);
  return grupos ? grupos.join(" ") : "";
}

function formatDate(date) {
  if (!date) {
    return "";
  }
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString("es-ES");
}

function calculateTotal(items) {
  const total = items.reduce((acc, item) => acc + item.quantity * (item.price * (1 - item.discount / 100)), 0);
  return total
}

// Componente InvoicePDF
const InvoicePDF = ({ items = [], dni, iban, selectedCustomer, onlyPage = false, preSale, title }) => {
  const { currentLang } = useI18n();
  const t = useTranslations(currentLang);

  const total_sin_iva = calculateTotal(items);
  const iva = total_sin_iva * 0.21;
  const total_recargo = selectedCustomer.isRecharge ?? 0 ? (total_sin_iva * 0.052) : 0
  const total_fatura = total_sin_iva + iva + total_recargo;
  
  let thirty_percent = 0;
  let remaining_balance = 0;
  if (preSale) {
    thirty_percent = total_fatura * 0.3
    remaining_balance = total_fatura - thirty_percent
  }


  const content = (
      <Page size="A4" style={styles.page}>
        <Text style={styles.invoiceTitle}>{title}</Text>
        {/* Encabezado de facturación */}
        <View style={styles.header}>
          <View>
            <Text style={styles.bold}>{t("invoice.clientDetails")}:</Text>
            <Text>
              <Text style={styles.bold}>{t("invoice.clientName")}</Text>: {selectedCustomer?.fiscal_name}
            </Text>
            <Text>
              <Text style={styles.bold}>{t("invoice.clientNifCif")}</Text>: {selectedCustomer?.nif_cif}
            </Text>
            <Text>
              <Text style={styles.bold}>{t("invoice.clientAddress")}</Text>: {selectedCustomer?.address}
            </Text>
          </View>
          <View>
            <Image src="/B2B_RootsBarefoot.png" style={{ width: 200, height: 150 }} />
          </View>
        </View>
      
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={styles.bold}>{t("invoice.dateTitle")}: {formatDate(new Date())}</Text>
          <Text style={styles.bold}>{t("invoice.invoiceNumber")}: </Text>
        </View>

        <View style={styles.table}>
          {/* Encabezado de la tabla */}
          <View style={[styles.row, { backgroundColor: "#f0f0f0" }]}>
            <Text style={styles.cell_title}>{t("invoice.table.item")}</Text>
            <Text style={styles.cell_title_secondary}>{t("invoice.table.quantity")}</Text>
            <Text style={styles.cell_title_secondary}>{t("invoice.table.color")}</Text>
            <Text style={styles.cell_title_secondary}>{t("invoice.table.size")}</Text>
            <Text style={styles.cell_title_terciary}>{t("invoice.table.pricePVP")}</Text>
            <Text style={styles.cell_title_terciary}>{t("invoice.table.discount")} [%]</Text>
            <Text style={styles.cell_title_terciary}>{t("invoice.table.priceUnit")}</Text>
            <Text style={styles.cell_title_terciary}>{t("invoice.table.total")}</Text>
          </View>

          {Array.isArray(items) &&
            items.map((item) => {
              const price = Number(item.price);
              const discount = Number(item.discount);
              const quantity = Number(item.quantity);
              const finalUnitPrice = (price * (1 - discount / 100)).toFixed(2);
              const totalPrice = (price * (1 - discount / 100) * quantity).toFixed(2);
              return (
                <View key={item.id} style={styles.row}>
                  <Text style={styles.cell}>{item.name}</Text>
                  <Text style={styles.cell_secondary}>{quantity}</Text>
                  <Text style={styles.cell_secondary}>{item.color}</Text>
                  <Text style={styles.cell_secondary}>{item.size}</Text>
                  <Text style={styles.cell_terciary}>€{price}</Text>
                  <Text style={styles.cell_terciary}>{discount}</Text>
                  <Text style={styles.cell_terciary}>€{finalUnitPrice}</Text>
                  <Text style={styles.cell_terciary}>€{totalPrice}</Text>
                </View>
              );
            })}
        </View>

        {/* Totales No Presale */}
        {!preSale && (
          <View style={styles.total}>
            <Text>{t("invoice.total.totalNoTax")} € {total_sin_iva.toFixed(2)}</Text>
            <Text>{t("invoice.total.iva")} 21% € {iva.toFixed(2)}</Text>
            <Text>{t("invoice.total.recharge")} 5,2% € {selectedCustomer.isRecharge ?? 0 ? total_recargo.toFixed(2) : '-'}</Text>
            <Text style={styles.bold}>{t("invoice.total.total")} € {total_fatura.toFixed(2)}</Text>
          </View>
        )}
        {/* Totales Presale */}
        {preSale && (
          <View style={styles.total}>
            <Text>{t("invoice.total.totalNoTax")} € {total_sin_iva.toFixed(2)}</Text>
            <Text>{t("invoice.total.iva")} 21% € {iva.toFixed(2)}</Text>
            <Text>{t("invoice.total.recharge")} 5,2% € {selectedCustomer.isRecharge ?? 0 ? total_recargo.toFixed(2) : '-'}</Text>
            <Text style={styles.bold}>{t("invoice.total.prepay")} 30% € {thirty_percent.toFixed(2)}</Text>
            <Text style={styles.bold}>{t("invoice.total.pending")} € {remaining_balance.toFixed(2)}</Text>
          </View>
        )}

        {/* Datos de facturación */}
        <View style={styles.remitente}>
          <Text style={styles.bold}>{t("invoice.roots.info")}:</Text>
          <Text>Marcos Marra León</Text>
          <Text>DNI: {dni}</Text>
        </View>
        <View style={styles.remitente}>
          <Text>{t("invoice.roots.payment")}</Text>
          <Text>{t("invoice.roots.iban")}: {formatIBAN(iban)}</Text>
          <Text>{t("invoice.roots.address")}: Marcos Marra León</Text>
        </View>
      </Page>
  );

  if (onlyPage) {
    return content;
  }
  return <Document>{content}</Document>;
};

export default InvoicePDF;
