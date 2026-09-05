import { describe, expect, it, vi } from 'vitest';
import {
  buildInvoiceNotificationEmail,
  parseNotificationRecipients,
  sendInvoiceNotification
} from '../../lib/order-notification.js';

const invoice = {
  id: '64ab2f5f-5c4b-4dd8-b2a0-cf4926a08a38',
  invoice_number: '2026-014',
  company_name: 'Calzados & Hijos <SL>',
  nif_cif: 'B12345678',
  country: 'ES',
  customer_email: 'compras@example.com',
  total_amount_eur: 121,
  items_data: [{
    name: 'Zapato <Demo>',
    color: 'Negro',
    size: '42',
    quantity: 2,
    total: 121
  }]
};

describe('parseNotificationRecipients', () => {
  it('normaliza, filtra y elimina emails duplicados', () => {
    expect(parseNotificationRecipients(' Ventas@Example.com,invalid,ventas@example.com, pedidos@example.com '))
      .toEqual(['ventas@example.com', 'pedidos@example.com']);
  });
});

describe('buildInvoiceNotificationEmail', () => {
  it('incluye el pedido y escapa datos del cliente en el HTML', () => {
    const email = buildInvoiceNotificationEmail({
      invoice,
      adminUrl: 'https://b2b.example.com/admin/invoices',
      pdfBase64: 'JVBERi0xLjQ='
    });

    expect(email.subject).toBe('Nuevo pedido 2026-014 · Calzados & Hijos <SL>');
    expect(email.html).toContain('Calzados &amp; Hijos &lt;SL&gt;');
    expect(email.html).toContain('Zapato &lt;Demo&gt;');
    expect(email.html).toContain('https://b2b.example.com/admin/invoices');
    expect(email.attachments).toEqual([{
      filename: 'Factura-2026-014.pdf',
      content: 'JVBERi0xLjQ='
    }]);
  });

  it('elimina saltos de línea de asunto y nombre de archivo', () => {
    const email = buildInvoiceNotificationEmail({
      invoice: {
        ...invoice,
        invoice_number: '2026-014\nBcc: atacante@example.com',
        company_name: 'Empresa\r\nInyectada'
      },
      adminUrl: 'https://b2b.example.com/admin/invoices',
      pdfBase64: 'JVBERi0xLjQ='
    });

    expect(email.subject).not.toMatch(/[\r\n]/);
    expect(email.attachments[0].filename).not.toMatch(/[\r\n]/);
  });
});

describe('sendInvoiceNotification', () => {
  it('omite el envío cuando falta configuración', async () => {
    const fetchImpl = vi.fn();

    await expect(sendInvoiceNotification({
      apiKey: '',
      from: '',
      recipients: '',
      invoice,
      adminUrl: 'https://b2b.example.com/admin/invoices',
      pdfBase64: 'JVBERi0xLjQ=',
      fetchImpl
    })).resolves.toMatchObject({ sent: false, skipped: true });

    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('envía a Resend con adjunto e idempotencia por factura', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: 'email-123' })
    });

    const result = await sendInvoiceNotification({
      apiKey: 're_test',
      from: 'Roots Barefoot <pedidos@example.com>',
      recipients: 'ventas@example.com,almacen@example.com',
      invoice,
      adminUrl: 'https://b2b.example.com/admin/invoices',
      pdfBase64: 'JVBERi0xLjQ=',
      fetchImpl
    });

    expect(result).toEqual({ sent: true, id: 'email-123' });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer re_test',
          'Idempotency-Key': `invoice-${invoice.id}`
        })
      })
    );

    const request = fetchImpl.mock.calls[0][1];
    const body = JSON.parse(request.body);
    expect(body.to).toEqual(['ventas@example.com', 'almacen@example.com']);
    expect(body.attachments[0].content).toBe('JVBERi0xLjQ=');
  });

  it('propaga un error acotado cuando Resend rechaza el envío', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: vi.fn().mockResolvedValue({ message: 'Invalid from address' })
    });

    await expect(sendInvoiceNotification({
      apiKey: 're_test',
      from: 'bad@example.com',
      recipients: 'ventas@example.com',
      invoice,
      adminUrl: 'https://b2b.example.com/admin/invoices',
      pdfBase64: 'JVBERi0xLjQ=',
      fetchImpl
    })).rejects.toMatchObject({
      message: 'Resend rechazó la notificación de pedido',
      status: 422,
      details: 'Invalid from address'
    });
  });
});
