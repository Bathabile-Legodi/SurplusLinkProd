import { createAPIFileRoute } from '@tanstack/react-start/api';
import { supabase } from '@/lib/supabase';

export const APIRoute = createAPIFileRoute('/api/webhooks/wumdrop')({
  /**
   * ASYNCHRONOUS WEBHOOK RECEIVER
   * Called by WumDrop servers when driver status or GPS coordinates change.
   * Always responds 200 OK immediately so WumDrop knows the payload was received.
   */
  POST: async ({ request }) => {
    const eventData = await request.json() as {
      order_reference?: string;
      state?: string;
      last_known_location?: string;
      [key: string]: unknown;
    };

    const { order_reference, state, last_known_location } = eventData;

    console.log(`[Webhook Received] Order: ${order_reference} | Status: ${state}`);

    if (order_reference) {
      const { error } = await supabase
        .from('wumdrop_deliveries')
        .update({
          ...(state ? { status: state } : {}),
          ...(last_known_location ? { last_location: last_known_location } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('order_reference', order_reference);

      if (error) {
        console.error('Webhook Supabase update error:', error);
      }
    }

    // Always 200 OK — WumDrop will retry if it doesn't receive this promptly
    return new Response('OK', { status: 200 });
  },
});
