import { isUserAdmin } from '@lib/auth.js';

const CRON_SECRET = import.meta.env.CRON_SECRET;

/**
 * POST /api/admin/sync-shopify
 * Lanza una sincronizacion manual con Shopify (solo admins)
 */
export async function POST({ request }) {
  try {
    const isAdmin = await isUserAdmin(request);
    if (!isAdmin) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized: Admin access required'
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!CRON_SECRET) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing CRON_SECRET'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const syncUrl = new URL('/api/cron/sync-shopify', request.url);
    const syncResponse = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await syncResponse.json();

    if (!syncResponse.ok || !data.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: data.error || 'Sync failed'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        products_synced: data.products_synced,
        variants_synced: data.variants_synced,
        duration_ms: data.duration_ms,
        timestamp: data.timestamp
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[ADMIN SYNC] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
