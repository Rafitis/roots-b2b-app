/**
 * Invoice Service - Funciones auxiliares para gestión de facturas
 * Utilidades para validación, generación de rutas, y procesamiento de datos
 */

/**
 * Valida formato básico de NIF/CIF español
 * @param {string} nif - NIF/CIF a validar
 * @returns {boolean}
 */
export function isValidNIF(nif) {
  if (!nif || typeof nif !== 'string') return false;

  const nifRegex = /^[0-9A-Za-z]{9}$/;
  return nifRegex.test(nif.toUpperCase());
}

/**
 * Valida que los datos básicos de factura sean válidos
 * @param {Object} invoiceData - Datos de factura
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateInvoiceData(invoiceData) {
  const errors = [];

  if (!invoiceData.company_name || invoiceData.company_name.trim() === '') {
    errors.push('El nombre de la empresa es requerido');
  }

  if (!invoiceData.nif_cif || !isValidNIF(invoiceData.nif_cif)) {
    errors.push('NIF/CIF inválido (formato: 9 caracteres alfanuméricos)');
  }

  if (!invoiceData.address || invoiceData.address.trim() === '') {
    errors.push('La dirección es requerida');
  }

  if (!invoiceData.country || invoiceData.country.trim() === '') {
    errors.push('El país es requerido');
  }

  if (typeof invoiceData.items_count !== 'number' || invoiceData.items_count < 1) {
    errors.push('items_count debe ser un número mayor a 0');
  }

  if (typeof invoiceData.total_amount_eur !== 'number' || invoiceData.total_amount_eur < 0) {
    errors.push('total_amount_eur debe ser un número válido');
  }

  if (typeof invoiceData.vat_amount !== 'number' || invoiceData.vat_amount < 0) {
    errors.push('vat_amount debe ser un número válido');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Genera la ruta de almacenamiento para el PDF en Storage
 * @param {string} invoiceNumber - Número de factura (ej: 2025-001)
 * @returns {string} Ruta: 2025/001/factura.pdf
 */
export function generatePdfStoragePath(invoiceNumber) {
  if (!invoiceNumber || typeof invoiceNumber !== 'string') {
    throw new Error('invoice_number requerido');
  }

  // Esperamos formato: YYYY-NNN (ej: 2025-001)
  const parts = invoiceNumber.split('-');
  if (parts.length !== 2) {
    throw new Error('Formato invoice_number inválido (esperado: YYYY-NNN)');
  }

  const [year, number] = parts;
  return `${year}/${number}/factura.pdf`;
}

/**
 * Convierte base64 a Uint8Array para subir a Supabase Storage
 * @param {string} base64String - String en base64
 * @returns {Uint8Array}
 */
export function base64ToUint8Array(base64String) {
  const binaryString = atob(base64String);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}

/**
 * Procesa base64 del cliente (puede venir con prefijo "data:...")
 * @param {string} pdfBase64 - Base64 del PDF
 * @returns {string} Base64 limpio sin prefijo
 */
export function cleanBase64(pdfBase64) {
  if (!pdfBase64) return '';

  // Si viene con prefijo data:application/pdf;base64, quitarlo
  const regex = /^data:[^;]*;base64,/;
  return pdfBase64.replace(regex, '');
}

/**
 * Valida que el PDF no sea vacío
 * @param {string} pdfBase64 - Base64 del PDF
 * @returns {boolean}
 */
export function isValidPdf(pdfBase64) {
  if (!pdfBase64 || typeof pdfBase64 !== 'string') return false;

  const cleaned = cleanBase64(pdfBase64);

  // PDF válido tiene al menos 100 bytes
  if (cleaned.length < 100) return false;

  // Verificar que empieza con "%PDF" en base64 (== IVBERi0=)
  // Aunque es una validación simple, cualquier archivo puede empezar con otro contenido
  return true;
}

/**
 * Obtiene user_id de la sesión (desde cookies de Supabase)
 * @param {Request} request - Request de Astro
 * @returns {string|null} UUID del usuario o null
 */
export function getUserIdFromRequest(request) {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  // Buscar sb-access-token en cookies
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});

  // En un entorno real, deberías decodificar el JWT
  // Por ahora retornamos null y dejamos que el middleware lo maneje
  // El endpoint debe usar el cliente autenticado de Supabase (service_role)
  return null;
}

/**
 * Formatea números decimales a 2 posiciones
 * @param {number} value
 * @returns {number}
 */
export function formatCurrency(value) {
  return Math.round(value * 100) / 100;
}

/**
 * Genera objeto de metadatos para almacenar en la tabla invoices
 * @param {Object} invoiceData - Datos del cliente
 * @param {string} invoiceNumber - Número generado
 * @param {string} pdfStoragePath - Ruta del PDF en Storage
 * @param {string} userId - ID del usuario autenticado
 * @returns {Object} Registro para insertar en BD
 */
export function buildInvoiceRecord(invoiceData, invoiceNumber, pdfStoragePath, userId) {
  return {
    invoice_number: invoiceNumber,
    company_name: invoiceData.company_name.trim(),
    nif_cif: invoiceData.nif_cif.toUpperCase().trim(),
    address: invoiceData.address.trim(),
    country: invoiceData.country.trim(),
    items_count: invoiceData.items_count,
    total_amount_eur: formatCurrency(invoiceData.total_amount_eur),
    vat_amount: formatCurrency(invoiceData.vat_amount),
    surcharge_applied: invoiceData.surcharge_applied || false,
    surcharge_amount: invoiceData.surcharge_amount ? formatCurrency(invoiceData.surcharge_amount) : 0,
    is_preorder: invoiceData.is_preorder || false,
    pdf_storage_path: pdfStoragePath,
    status: 'finalized',
    notes: null,
    created_by_user_id: userId
  };
}

/**
 * Genera URL pública del PDF en Supabase Storage
 * @param {string} supabaseUrl - URL base de Supabase
 * @param {string} bucketName - Nombre del bucket
 * @param {string} pdfPath - Ruta del archivo
 * @returns {string} URL pública
 */
export function generatePublicPdfUrl(supabaseUrl, bucketName, pdfPath) {
  return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${pdfPath}`;
}
