import { createAPIFileRoute } from '@tanstack/react-start/api';
import { supabase } from '@/lib/supabase';

const WUMDROP_BASE_URL = 'https://api.wumdrop.com/v1';

export const APIRoute = createAPIFileRoute('/api/create-delivery')({
  POST: async ({ request }) => {
    const WUMDROP_API_KEY = (import.meta.env as Record<string, string>).WUMDROP_API_KEY ?? '';

    if (!WUMDROP_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration: WUMDROP_API_KEY not set' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json() as {
      pickup: {
        address: string;
        contactName: string;
        phone: string;
        city?: string;
        remarks?: string;
      };
      dropoff: {
        address: string;
        contactName: string;
        phone: string;
        remarks?: string;
      };
      parcelSize?: string;
      orderRef: string;
    };

    const { pickup, dropoff, orderRef } = body;

    // Construct the exact payload required by WumDrop's delivery engine
    const wumdropPayload = {
      pickup_address: pickup.address,
      pickup_contact_name: pickup.contactName,
      pickup_contact_phone: pickup.phone, // Must be a valid 10-digit SA number (e.g. "0821234567")
      pickup_remarks: pickup.remarks ?? 'Surplus food donation - check in with store manager',
      dropoff_address: dropoff.address,
      dropoff_contact_name: dropoff.contactName,
      dropoff_contact_phone: dropoff.phone,
      dropoff_remarks: dropoff.remarks ?? 'Deliver to loading bay at community shelter',
      city: pickup.city ?? 'JHB', // 'JHB', 'PTA', or 'CPT'
      order_reference: orderRef,
      customer_identifier: 'SURPLUS_LINK',
    };

    let wumdropData: { id?: string; [key: string]: unknown };

    try {
      const wumdropResponse = await fetch(`${WUMDROP_BASE_URL}/deliveries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Access-Token': WUMDROP_API_KEY,
        },
        body: JSON.stringify(wumdropPayload),
      });

      wumdropData = await wumdropResponse.json() as { id?: string; [key: string]: unknown };

      if (!wumdropResponse.ok) {
        return new Response(
          JSON.stringify({ error: 'WumDrop dispatch failed', details: wumdropData }),
          { status: wumdropResponse.status, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.error('Dispatch Network Error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error during dispatch' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Persist initial delivery record to Supabase
    const { error: dbError } = await supabase
      .from('wumdrop_deliveries')
      .upsert({
        order_reference: orderRef,
        wumdrop_id: wumdropData.id,
        status: 'PENDING_PICKUP',
        last_location: null,
        updated_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error('Supabase upsert error:', dbError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Driver dispatched successfully',
        deliveryId: wumdropData.id,
        orderRef,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  },
});
