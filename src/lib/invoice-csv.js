/**
 * Generación de CSV de facturas para contabilidad
 *
 * Módulo puro (sin dependencias de Supabase/Astro) para poder testear
 * el escapado y el formato del CSV de forma aislada.
 */

/** Etiquetas legibles de estado (coherentes con InvoiceTable.jsx / InvoiceFilters.jsx) */
export const INVOICE_STATUS_LABELS = {
  pending_review: 'Pendiente',
  shopify_draft: 'Draft Creado',
  completed: 'Completada',
  cancelled: 'Cancelada',
  finalized: 'Finalizada'
};

/** Cabecera de columnas del CSV de contabilidad */
export const INVOICE_CSV_HEADERS = [
  'Número',
  'Fecha',
  'Empresa',
  'NIF/CIF',
  'País',
  'Items',
  'Base sin IVA',
  'IVA',
  'Recargo',
  'Total',
  'Estado'
];

const BOM = '\uFEFF';
const LINE_BREAK = '\r\n';

/**
 * Caracteres iniciales que Excel/LibreOffice interpretan como inicio de
 * fórmula (CSV/formula injection). Si un campo empieza por alguno de estos
 * (tras recortar espacios normales de cabecera) se antepone una comilla
 * simple para neutralizarlo.
 */
const FORMULA_TRIGGER_CHARS = /^[=+\-@\t\r]/;

/** Recorta únicamente espacios normales (U+0020) de cabecera, a diferencia
 * de String.prototype.trim() no elimina tabuladores ni retornos de carro,
 * que deben seguir siendo detectables como carácter inicial. */
function trimLeadingSpaces(str) {
  return str.replace(/^ +/, '');
}

/**
 * Escapa un valor para uso seguro como campo CSV (RFC 4180) y neutraliza
 * la inyección de fórmulas (CSV/formula injection): envuelve en comillas
 * dobles si contiene coma, comillas o salto de línea, duplica las comillas
 * internas y, si el valor (tras trim) empieza por =, +, -, @, tabulador o
 * retorno de carro, antepone una comilla simple ' antes de aplicar el
 * escapado RFC 4180 habitual.
 * @param {string|number|null|undefined} value
 * @returns {string}
 */
export function escapeCsvField(value) {
  let str = value === null || value === undefined ? '' : String(value);
  if (FORMULA_TRIGGER_CHARS.test(trimLeadingSpaces(str))) {
    str = `'${str}`;
  }
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Formatea un importe numérico a 2 decimales con punto (para no chocar con
 * la coma usada como separador de campos CSV).
 * @param {number|null|undefined} value
 * @returns {string}
 */
function formatAmount(value) {
  const num = Number(value) || 0;
  return num.toFixed(2);
}

/**
 * Extrae la parte de fecha (YYYY-MM-DD) de una fecha ISO/almacenada.
 * @param {string|null|undefined} dateValue
 * @returns {string}
 */
function formatDate(dateValue) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

/**
 * Construye la fila CSV (array de valores crudos, sin escapar) para una factura.
 *
 * Nota sobre "Base sin IVA": la tabla `invoices` no almacena la base
 * imponible por separado, así que se deriva como
 * total_amount_eur - vat_amount - surcharge_amount. Si la factura incluye
 * envío (no modelado como columna propia), quedaría dentro de este importe.
 *
 * @param {object} invoice - Registro de la tabla invoices
 * @returns {Array<string|number>}
 */
export function buildInvoiceCsvRow(invoice) {
  const total = Number(invoice.total_amount_eur) || 0;
  const vat = Number(invoice.vat_amount) || 0;
  const surcharge = Number(invoice.surcharge_amount) || 0;
  const baseSinIva = total - vat - surcharge;

  return [
    invoice.invoice_number ?? '',
    formatDate(invoice.created_at),
    invoice.company_name ?? '',
    invoice.nif_cif ?? '',
    invoice.country ?? '',
    invoice.items_count ?? 0,
    formatAmount(baseSinIva),
    formatAmount(vat),
    formatAmount(surcharge),
    formatAmount(total),
    INVOICE_STATUS_LABELS[invoice.status] || invoice.status || ''
  ];
}

/**
 * Construye el contenido completo del CSV (con BOM UTF-8, cabecera y filas)
 * a partir de una lista de facturas.
 * @param {Array<object>} invoices
 * @returns {string}
 */
export function buildInvoiceCsv(invoices = []) {
  const rows = [
    INVOICE_CSV_HEADERS,
    ...invoices.map(buildInvoiceCsvRow)
  ];

  const body = rows
    .map(row => row.map(escapeCsvField).join(','))
    .join(LINE_BREAK);

  return `${BOM}${body}${LINE_BREAK}`;
}
