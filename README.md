# Roots Barefoot B2B App

Aplicación B2B con Astro SSR, React, Supabase y Shopify.

## Project setup

```bash
pnpm install
```

### Compiles and hot-reloads for development

```bash
pnpm run dev
```

### Compiles and minifies for production

```bash
pnpm run build
```

## Notificaciones de nuevos pedidos (Resend)

Al guardar una factura nueva desde el botón de descarga, el servidor envía un
correo interno con el resumen del pedido, un enlace al panel admin y el PDF
adjunto. Las facturas regeneradas desde el modo edición no generan otra alerta.

Configura estas variables tanto en local como en Vercel:

```dotenv
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL="Roots Barefoot <pedidos@tu-dominio.com>"
RESEND_NOTIFICATION_TO=ventas@tu-dominio.com,almacen@tu-dominio.com
APP_URL=https://b2b.tu-dominio.com
```

- `RESEND_NOTIFICATION_TO` acepta varios destinatarios separados por comas.
- `APP_URL` es opcional; si falta, se utiliza el origen de la petición.
- El dominio del remitente debe estar verificado en Resend.
- Si Resend falla, la factura se guarda y se descarga igualmente; el error queda
  registrado en los logs del servidor.
