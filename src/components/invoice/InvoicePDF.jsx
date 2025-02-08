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
    flex: 1,
    textAlign: "center",
  },
  cell_title: {
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

// Componente InvoicePDF
const InvoicePDF = ({ items = [], total, dni, iban }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Encabezado de facturación */}
        <View style={styles.header}>
          <View>
            <Text style={styles.bold}>DETALLES DE FACTURACIÓN CLIENTE:</Text>
            <Text>
              <Text style={styles.bold}>NOMBRE</Text>: Nombre de empresa
            </Text>
            <Text>
              <Text style={styles.bold}>NIF o CIF</Text>: B1234567
            </Text>
            <Text>
              <Text style={styles.bold}>DIRECCIÓN</Text>: C/ Juan de la Cruz, 1
            </Text>
          </View>
          <View>
            <Image src="/B2B_RootsBarefoot.png" style={{ width: 200, height: 150 }} />
          </View>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={styles.bold}>Fecha: Fecha pedido</Text>
          <Text style={styles.bold}>Factura: Nº de factura</Text>
        </View>

        {/* Tabla de productos */}
        <View style={styles.table}>
          {/* Encabezado de la tabla */}
          <View style={[styles.row, { backgroundColor: "#f0f0f0" }]}>
            <Text style={styles.cell_title}>Concepto</Text>
            <Text style={styles.cell_title}>Cantidad</Text>
            <Text style={styles.cell_title}>Color</Text>
            <Text style={styles.cell_title}>Talla</Text>
            <Text style={styles.cell_title}>Precio PvP ROOTS</Text>
            <Text style={styles.cell_title}>DTO [%]</Text>
            <Text style={styles.cell_title}>Precio Final Unidad</Text>
            <Text style={styles.cell_title}>Precio Total</Text>
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
                  <Text style={styles.cell}>{quantity}</Text>
                  <Text style={styles.cell}>{item.color}</Text>
                  <Text style={styles.cell}>{item.size}</Text>
                  <Text style={styles.cell}>€{price}</Text>
                  <Text style={styles.cell}>{discount}</Text>
                  <Text style={styles.cell}>€{finalUnitPrice}</Text>
                  <Text style={styles.cell}>€{totalPrice}</Text>
                </View>
              );
            })}
        </View>

        {/* Totales */}
        <View style={styles.total}>
          <Text>TOTAL SIN IVA € {(total / 1.21).toFixed(2)}</Text>
          <Text>IVA 21% € {(total - total / 1.21).toFixed(2)}</Text>
          <Text>RECARGO DE EQUIVALENCIA 5,2% € -</Text>
          <Text style={styles.bold}>TOTAL FACTURA € {total.toFixed(2)}</Text>
          <Text style={styles.bold}>PAGO 30% € {(total * 0.3).toFixed(2)}</Text>
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
