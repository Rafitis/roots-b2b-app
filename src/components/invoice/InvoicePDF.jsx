// InvoicePDF.jsx
import { Page, Text, View, Image, Document, StyleSheet } from "@react-pdf/renderer";
import { useTranslations } from "@i18n/utils";
import { useI18n } from "@hooks/useI18n";
import { calculateTotals } from "@lib/invoice-calculations.js";

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
    width: '35%',      // solo 20% del ancho total
    marginLeft: 'auto',// se alinea a la derecha
    marginTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,   // separación entre filas
  },
  label: {
    flex: 1,           // ocupa todo el espacio sobrante dentro del 20%
    fontSize: 8,
  },
  value: {
    width: 50,         // ancho fijo para la cifra
    textAlign: 'right',// cifra alineada a la derecha de su caja
    fontSize: 8,
  },
  spacer: {
    height: 12,        // hueco antes del Total general
  },
  divider: {
    width: '100%',           // ocupa todo el ancho del contenedor (20% de la página)
    borderTopWidth: 1,       // grosor de la línea
    borderTopColor: '#000',  // color negro
    marginVertical: 4,       // espacio arriba y abajo de la línea
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

// Componente InvoicePDF
const InvoicePDF = ({ items = [], dni, iban, selectedCustomer, onlyPage = false, preSale, title, customDiscount = 0 }) => {
  const { currentLang } = useI18n();
  const t = useTranslations(currentLang);

  // Usar función centralizada que incluye todos los cálculos (IVA, envío, recargo)
  const { total_sin_iva, iva, recargo, shipping, total_factura: total_factura_envio, vatRate } = calculateTotals({
    items,
    countryCode: selectedCustomer.country,
    applyRecharge: selectedCustomer.isRecharge,
    includeShipping: true
  });

  // Aplicar descuento personalizado (solo admin, flujo de edición)
  const discount = Math.min(Math.max(customDiscount || 0, 0), total_factura_envio);
  const total_con_descuento = Math.round((total_factura_envio - discount) * 100) / 100;

  // Calcular total de la factura de preventa.
  let thirty_percent = 0;
  let remaining_balance = 0;
  if (preSale) {
    // Si es preventa, calcula el 30% y el resto sobre el total ya descontado
    thirty_percent = Math.round(total_con_descuento * 0.3 * 100) / 100;
    remaining_balance = Math.round((total_con_descuento - thirty_percent) * 100) / 100;
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
          <View style={{ flexDirection: "row", alignItems: "center", marginRight: 10 }}>
            <Text style={styles.bold}>{t("invoice.invoiceNumber")}: </Text>
            <View style={{ borderBottomWidth: 1, borderBottomColor: "#000", width: 120, height: 20, marginLeft: 10 }} />
          </View>
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
                  <Text style={styles.cell_terciary}>€ {price}</Text>
                  <Text style={styles.cell_terciary}> {discount}</Text>
                  <Text style={styles.cell_terciary}>€ {finalUnitPrice}</Text>
                  <Text style={styles.cell_terciary}>€ {totalPrice}</Text>
                </View>
              );
            })}
        </View>

        {/* Totales No Presale */}
        {!preSale && (
          <View style={styles.total}>
            <View style={styles.totalRow}>
              <Text style={styles.label}>{t("invoice.total.totalNoTax")}</Text>
              <Text style={styles.value}>
                {total_sin_iva.toFixed(2)} €
              </Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.label}>{t("invoice.total.iva")} {vatRate}%</Text>
              <Text style={styles.value}>
                {iva.toFixed(2)} €
              </Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.label}>{t("invoice.total.recharge")} 5,2%</Text>
              <Text style={styles.value}>
                {selectedCustomer.isRecharge ? recargo.toFixed(2) : '-'} €
              </Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.label}>{t("invoice.total.shipping").toUpperCase()}</Text>
              <Text style={styles.value}>
                {shipping.toFixed(2)} €
              </Text>
            </View>

            {discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.label}>{t("invoice.total.customDiscount")}</Text>
                <Text style={styles.value}>-{discount.toFixed(2)} €</Text>
              </View>
            )}

            {/* Espacio antes del separador */}
            <View style={styles.spacer} />

            {/* Línea divisoria */}
            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={[styles.label, styles.bold, { fontSize: 10 }]}>
                {t("invoice.total.total")}
              </Text>
              <Text style={[styles.value, styles.bold, { fontSize: 10 }]}>
                {total_con_descuento.toFixed(2)} €
              </Text>
            </View>
          </View>
        )}
        {/* Totales Presale */}
        {preSale && (
          <View style={styles.total}>
          {/* Líneas normales */}
          <View style={styles.totalRow}>
            <Text style={styles.label}>
              {t("invoice.total.totalNoTax")}
            </Text>
            <Text style={styles.value}>
              {total_sin_iva.toFixed(2)} €
            </Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.label}>
              {t("invoice.total.iva")} 21%
            </Text>
            <Text style={styles.value}>
              {iva.toFixed(2)} €
            </Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.label}>
              {t("invoice.total.recharge")} 5,2%
            </Text>
            <Text style={styles.value}>
              {selectedCustomer.isRecharge ? recargo.toFixed(2) : '-'} €
            </Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.label}>
              {t("invoice.total.shipping").toUpperCase()}
            </Text>
            <Text style={styles.value}>
              {shipping.toFixed(2)} €
            </Text>
          </View>

          {discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.label}>{t("invoice.total.customDiscount")}</Text>
              <Text style={styles.value}>-{discount.toFixed(2)} €</Text>
            </View>
          )}

          {/* Espacio y línea divisoria antes de las líneas en negrita */}
          <View style={styles.spacer} />
          <View style={styles.divider} />

          {/* Líneas en negrita */}
          <View style={styles.totalRow}>
            <Text style={[styles.label, styles.bold]}>
              {t("invoice.total.prepay")} 30%
            </Text>
            <Text style={[styles.value, styles.bold]}>
              {thirty_percent.toFixed(2)} €
            </Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={[styles.label, styles.bold]}>
              {t("invoice.total.pending")}
            </Text>
            <Text style={[styles.value, styles.bold]}>
              {remaining_balance.toFixed(2)} €
            </Text>
          </View>
        </View>
        )}

        {/* Datos de facturación */}
        <View style={styles.remitente}>
          <Text style={styles.bold}>{t("invoice.roots.info")}:</Text>
          <Text>ROOTS BAREFOOT S.L.</Text>
          <Text>CIF: {dni}</Text>
          <Text>contacto@rootsbarefoot.com </Text>
        </View>
        <View style={styles.remitente}>
          <Text>{t("invoice.roots.payment")}</Text>
          <Text>{t("invoice.roots.iban")}: {formatIBAN(iban)}</Text>
          <Text>{t("invoice.roots.address")}: ROOTS BAREFOOT S.L.</Text>
        </View>
      </Page>
  );

  if (onlyPage) {
    return content;
  }
  return <Document>{content}</Document>;
};

export default InvoicePDF;
