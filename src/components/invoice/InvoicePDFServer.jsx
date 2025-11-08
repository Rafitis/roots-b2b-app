/**
 * InvoicePDFServer.jsx
 *
 * Versión de InvoicePDF para renderizado en servidor (sin hooks)
 * Se usa en regenerate-pdf.js para generar PDFs dinámicamente
 *
 * Diferencias con InvoicePDF.jsx:
 * - ❌ SIN hooks: useI18n, useTranslations
 * - ✅ Traducciones como props: translations (objeto con claves)
 * - ✅ Incluye shopify_order_number en el PDF si está disponible
 * - ✅ Compatible con @react-pdf/renderer en servidor
 */

import { Page, Text, View, Image, Document, StyleSheet } from "@react-pdf/renderer";
import { calculateTotals } from "@lib/invoice-calculations.js";

// Estilos del PDF
const styles = StyleSheet.create({
  invoiceTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    textDecoration: "underline",
    marginBottom: 10,
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
    width: '35%',
    marginLeft: 'auto',
    marginTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    flex: 1,
    fontSize: 8,
  },
  value: {
    width: 50,
    textAlign: 'right',
    fontSize: 8,
  },
  spacer: {
    height: 12,
  },
  divider: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#000',
    marginVertical: 4,
  },
  remitente: {
    marginTop: 10,
    textAlign: "left",
  },
  // NUEVO: Estilos para número Shopify
  shopifySection: {
    marginTop: 15,
    marginBottom: 15,
    padding: 8,
    backgroundColor: "#e3f2fd",
    borderWidth: 1,
    borderColor: "#1976d2",
    borderRadius: 4,
  },
  shopifyText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#1565c0",
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

/**
 * InvoicePDFServer - Componente para renderizado en servidor
 *
 * Props:
 * - items: array de items
 * - dni: string (CIF de Roots)
 * - iban: string (IBAN de Roots)
 * - selectedCustomer: { fiscal_name, nif_cif, address, country, isRecharge }
 * - onlyPage: boolean (para retornar solo Page o Document)
 * - preSale: boolean (preventa)
 * - title: string (título de la factura)
 * - translations: object (traducciones en español - desde @i18n/ui.ts)
 * - shopify_order_number: string (número de pedido Shopify - FASE 2.6)
 * - logoUrl: string (URL del logo - FASE 2.6)
 */
const InvoicePDFServer = ({
  items = [],
  dni,
  iban,
  selectedCustomer,
  onlyPage = false,
  preSale,
  title,
  translations,
  shopify_order_number,
  logoUrl = '/B2B_RootsBarefoot.png' // Se pasa la imagen para que se pueda cargar en servidor
}) => {
  // Asegurarse de que tenemos traducciones
  if (!translations) {
    throw new Error('InvoicePDFServer requiere prop "translations"');
  }

  // Función helper para traducir (acceso directo a objeto)
  const t = (key) => translations[key] || key;

  // Usar función centralizada que incluye todos los cálculos (IVA, envío, recargo)
  const { total_sin_iva, iva, recargo, shipping, total_factura: total_factura_envio, vatRate } = calculateTotals({
    items,
    countryCode: selectedCustomer.country,
    applyRecharge: selectedCustomer.isRecharge,
    includeShipping: true
  });

  // Calcular total de la factura de preventa.
  let thirty_percent = 0;
  let remaining_balance = 0;
  if (preSale) {
    thirty_percent = total_factura_envio * 0.3
    remaining_balance = total_factura_envio - thirty_percent
  }

  const content = (
    <Page size="A4" style={styles.page}>

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
          <Image src={logoUrl} style={{ width: 200, height: 150 }} />
        </View>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={styles.bold}>{t("invoice.dateTitle")}: {formatDate(new Date())}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginRight: 10 }}>
          <Text style={styles.bold}>{t("invoice.invoiceNumber")}: </Text>
          <Text style={styles.bold}>{shopify_order_number || '—'}</Text>
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

          {/* Espacio antes del separador */}
          <View style={styles.spacer} />

          {/* Línea divisoria */}
          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={[styles.label, styles.bold, { fontSize: 10 }]}>
              {t("invoice.total.total")}
            </Text>
            <Text style={[styles.value, styles.bold, { fontSize: 10 }]}>
              {total_factura_envio.toFixed(2)} €
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

export default InvoicePDFServer;
