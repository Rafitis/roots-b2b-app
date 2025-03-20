// InvoicePDF.jsx
import { Page, Text, View, Image, Document, StyleSheet } from "@react-pdf/renderer";

// Estilos del PDF
const styles = StyleSheet.create({
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

// Componente InvoicePDF
const InvoicePDF = ({ items = [], total, dni, iban, selectedCustomer }) => {

  const total_sin_iva = total / 1.21;
  const total_iva = total - total_sin_iva;
  const total_recargo = selectedCustomer.isRecharge ?? 0 ? (total_sin_iva * 0.052) : 0
  const total_fatura = total + total_recargo;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Encabezado de facturación */}
        <View style={styles.header}>
          <View>
            <Text style={styles.bold}>DETALLES DE FACTURACIÓN CLIENTE:</Text>
            <Text>
              <Text style={styles.bold}>NOMBRE</Text>: {selectedCustomer?.fiscal_name}
            </Text>
            <Text>
              <Text style={styles.bold}>NIF o CIF</Text>: {selectedCustomer?.nif_cif}
            </Text>
            <Text>
              <Text style={styles.bold}>DIRECCIÓN</Text>: {selectedCustomer?.address}
            </Text>
          </View>
          <View>
            <Image src="/B2B_RootsBarefoot.png" style={{ width: 200, height: 150 }} />
          </View>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={styles.bold}>Fecha: {formatDate(new Date())}</Text>
          <Text style={styles.bold}>Factura: </Text>
        </View>

        {/* Tabla de productos */}
        <View style={styles.table}>
          {/* Encabezado de la tabla */}
          <View style={[styles.row, { backgroundColor: "#f0f0f0" }]}>
            <Text style={styles.cell_title}>Concepto</Text>
            <Text style={styles.cell_title_secondary}>Cantidad</Text>
            <Text style={styles.cell_title_secondary}>Color</Text>
            <Text style={styles.cell_title_secondary}>Talla</Text>
            <Text style={styles.cell_title_terciary}>Precio PvP ROOTS</Text>
            <Text style={styles.cell_title_terciary}>DTO [%]</Text>
            <Text style={styles.cell_title_terciary}>Precio Final Unidad</Text>
            <Text style={styles.cell_title_terciary}>Precio Total</Text>
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

        {/* Totales */}
        <View style={styles.total}>
          <Text>TOTAL SIN IVA € {total_sin_iva.toFixed(2)}</Text>
          <Text>IVA 21% € {total_iva.toFixed(2)}</Text>
          <Text>RECARGO DE EQUIVALENCIA 5,2% € {selectedCustomer.isRecharge ?? 0 ? total_recargo.toFixed(2) : '-'}</Text>
          <Text style={styles.bold}>TOTAL FACTURA € {total_fatura.toFixed(2)}</Text>
        </View>

        {/* Datos de facturación */}
        <View style={styles.remitente}>
          <Text style={styles.bold}>FACTURADO POR:</Text>
          <Text>Marcos Marra León</Text>
          <Text>DNI: {dni}</Text>
        </View>
        <View style={styles.remitente}>
          <Text>Forma de pago: Transferencia</Text>
          <Text>Nº de cuenta: {formatIBAN(iban)}</Text>
          <Text>Remitente: Marcos Marra León</Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
