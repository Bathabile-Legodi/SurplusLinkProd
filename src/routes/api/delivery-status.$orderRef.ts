import { createAPIFileRoute } from '@tanstack/react-start/api';
import { supabase } from '@/lib/supabase';

export const APIRoute = createAPIFileRoute('/api/delivery-status/$orderRef')({
  /**
   * STATUS POLLING ENDPOINT
   * Allows the DispatchDashboard to fetch the latest delivery status
   * that was last written by the WumDrop webhook receiver.
   */
  GET: async ({ params }) => {
    const { orderRef } = params;

    const { data, error } = await supabase
      .from('wumdrop_deliveries')
      .select('wumdrop_id, status, last_location, updated_at')
      .eq('order_reference', orderRef)
      .maybeSingle();

    if (error) {
      console.error('Status poll Supabase error:', error);
      return new Response(
        JSON.stringify({ error: 'Database error fetching delivery status' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Delivery reference not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        wumdropId: data.wumdrop_id,
        status: data.status,
        lastLocation: data.last_location,
        updatedAt: data.updated_at,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  },
});
