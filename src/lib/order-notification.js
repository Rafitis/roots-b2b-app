const RESEND_API_URL = 'https://api.resend.com/emails';

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const formatCurrency = (value) => new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR'
}).format(Number(value) || 0);

const sanitizeHeaderText = (value, fallback) => String(value || fallback)
  .replace(/[\r\n]+/g, ' ')
  .trim();

export function parseNotificationRecipients(value) {
  if (!value || typeof value !== 'string') return [];

  return [...new Set(
    value
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  )];
}

const getItemDescription = (item) => [item.name, item.color, item.size]
  .filter(Boolean)
  .join(' · ');

export function buildInvoiceNotificationEmail({ invoice, adminUrl, pdfBase64 }) {
  const items = Array.isArray(invoice.items_data) ? invoice.items_data : [];
  const invoiceNumber = sanitizeHeaderText(invoice.invoice_number, 'Sin número');
  const companyName = sanitizeHeaderText(invoice.company_name, 'Sin empresa');
  const safeAdminUrl = escapeHtml(adminUrl);

  const itemRows = items.length > 0
    ? items.map(item => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e8e3dc;color:#29251f;">${escapeHtml(getItemDescription(item) || 'Artículo')}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e8e3dc;text-align:center;color:#29251f;">${escapeHtml(item.quantity || 0)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e8e3dc;text-align:right;color:#29251f;">${escapeHtml(formatCurrency(item.total))}</td>
        </tr>`).join('')
    : `
        <tr>
          <td colspan="3" style="padding:12px;color:#746b60;">No hay detalle de artículos disponible.</td>
        </tr>`;

  const plainItems = items.length > 0
    ? items.map(item => `- ${getItemDescription(item) || 'Artículo'} · ${item.quantity || 0} uds. · ${formatCurrency(item.total)}`).join('\n')
    : '- No hay detalle de artículos disponible';

  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;background:#f4f1ed;font-family:Arial,sans-serif;color:#29251f;">
    <div style="max-width:680px;margin:0 auto;padding:32px 16px;">
      <div style="background:#ffffff;border:1px solid #e8e3dc;border-radius:14px;overflow:hidden;">
        <div style="padding:24px 28px;background:#29251f;color:#ffffff;">
          <p style="margin:0 0 6px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#d5c9bb;">Nuevo pedido B2B</p>
          <h1 style="margin:0;font-size:25px;line-height:1.25;">${escapeHtml(companyName)}</h1>
        </div>
        <div style="padding:26px 28px;">
          <p style="margin:0 0 22px;color:#746b60;">El cliente ha generado y descargado la factura <strong style="color:#29251f;">${escapeHtml(invoiceNumber)}</strong>.</p>

          <table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <tr><td style="padding:5px 0;color:#746b60;">Empresa</td><td style="padding:5px 0;text-align:right;font-weight:600;">${escapeHtml(companyName)}</td></tr>
            <tr><td style="padding:5px 0;color:#746b60;">NIF/CIF</td><td style="padding:5px 0;text-align:right;">${escapeHtml(invoice.nif_cif || '—')}</td></tr>
            <tr><td style="padding:5px 0;color:#746b60;">Email</td><td style="padding:5px 0;text-align:right;">${escapeHtml(invoice.customer_email || '—')}</td></tr>
            <tr><td style="padding:5px 0;color:#746b60;">País</td><td style="padding:5px 0;text-align:right;">${escapeHtml(invoice.country || '—')}</td></tr>
            <tr><td style="padding:5px 0;color:#746b60;">Total</td><td style="padding:5px 0;text-align:right;font-size:19px;font-weight:700;">${escapeHtml(formatCurrency(invoice.total_amount_eur))}</td></tr>
          </table>

          <h2 style="margin:0 0 10px;font-size:16px;">Resumen del pedido</h2>
          <table style="width:100%;border-collapse:collapse;border:1px solid #e8e3dc;border-radius:8px;margin-bottom:26px;">
            <thead>
              <tr style="background:#f7f5f2;">
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#746b60;">Artículo</th>
                <th style="padding:10px 12px;text-align:center;font-size:12px;color:#746b60;">Cantidad</th>
                <th style="padding:10px 12px;text-align:right;font-size:12px;color:#746b60;">Importe</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>

          <a href="${safeAdminUrl}" style="display:inline-block;padding:12px 18px;background:#8b5e3c;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">Abrir panel de facturas</a>
          <p style="margin:22px 0 0;font-size:12px;color:#8b8278;">La factura también se adjunta a este correo en formato PDF.</p>
        </div>
      </div>
    </div>
  </body>
</html>`;

  const text = `Nuevo pedido B2B\n\nEl cliente ha generado y descargado la factura ${invoiceNumber}.\n\nEmpresa: ${companyName}\nNIF/CIF: ${invoice.nif_cif || '—'}\nEmail: ${invoice.customer_email || '—'}\nPaís: ${invoice.country || '—'}\nTotal: ${formatCurrency(invoice.total_amount_eur)}\n\nResumen del pedido:\n${plainItems}\n\nPanel de facturas: ${adminUrl}\n\nLa factura se adjunta en PDF.`;

  return {
    subject: `Nuevo pedido ${invoiceNumber} · ${companyName}`,
    html,
    text,
    attachments: [{
      filename: `Factura-${invoiceNumber.replace(/[^0-9A-Za-z_-]/g, '-')}.pdf`,
      content: pdfBase64
    }]
  };
}

export async function sendInvoiceNotification({
  apiKey,
  from,
  recipients,
  invoice,
  adminUrl,
  pdfBase64,
  fetchImpl = fetch
}) {
  const to = Array.isArray(recipients)
    ? recipients
    : parseNotificationRecipients(recipients);

  if (!apiKey || !from || to.length === 0) {
    return { sent: false, skipped: true, reason: 'missing_configuration' };
  }

  const email = buildInvoiceNotificationEmail({ invoice, adminUrl, pdfBase64 });
  const response = await fetchImpl(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `invoice-${invoice.id}`
    },
    body: JSON.stringify({
      from,
      to,
      ...email
    })
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error('Resend rechazó la notificación de pedido');
    error.status = response.status;
    error.details = result?.message || result?.name || 'Respuesta sin detalles';
    throw error;
  }

  return { sent: true, id: result.id };
}
