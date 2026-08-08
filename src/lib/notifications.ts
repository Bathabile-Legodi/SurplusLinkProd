"use server";

import { createServerFn } from "@tanstack/react-start";
import webPush from "web-push";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

// Set VAPID details on the server side
const initWebPush = () => {
  const publicVapidKey = process.env.VITE_VAPID_PUBLIC_KEY;
  const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicVapidKey || !privateVapidKey) {
    console.warn("VAPID keys not configured, push notifications will fail or run in mock mode.");
    return false;
  }

  webPush.setVapidDetails(
    "mailto:admin@surpluslink.org",
    publicVapidKey,
    privateVapidKey
  );
  return true;
};

// ── Zod schemas ──────────────────────────────────────────────────────────────

const PushPayloadSchema = z.object({
  userId: z.string(),
  payload: z.object({
    title: z.string(),
    body: z.string(),
    url: z.string().optional(),
  }),
});

const NotifyNGOsSchema = z.object({
  batchType: z.string(),
  batchId: z.string(),
});

// ── Server functions ──────────────────────────────────────────────────────────

// Send a push notification to a specific user via their saved subscriptions
export const sendPushNotification = createServerFn({ method: "POST" })
  .validator(PushPayloadSchema)
  .handler(async ({ data }) => {
    const { userId, payload } = data;
    const isConfigured = initWebPush();
    if (!isConfigured) {
      console.log("[Mock Push Notification] to user:", userId, payload);
      return { success: true, mocked: true };
    }

    // 1. Fetch all push subscriptions for this user
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching subscriptions:", error);
      throw new Error("Failed to fetch user push subscriptions");
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`No active push subscriptions for user ${userId}`);
      return { success: true, count: 0 };
    }

    let successCount = 0;

    // 2. Send to all devices
    await Promise.all(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webPush.sendNotification(
            pushSubscription,
            JSON.stringify({
              title: payload.title,
              body: payload.body,
              data: { url: payload.url || "/" },
            })
          );
          successCount++;
        } catch (err: any) {
          // If the subscription is no longer valid (e.g. user revoked permission)
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          } else {
            console.error("Failed to send push:", err);
          }
        }
      })
    );

    return { success: true, count: successCount };
  });

// Broadcast a new donation alert to all verified NGOs
export const notifyNGOsOfNewDonation = createServerFn({ method: "POST" })
  .validator(NotifyNGOsSchema)
  .handler(async ({ data }) => {
    const { batchType } = data;

    // Fetch all verified NGOs
    const { data: ngos } = await supabase
      .from("ngos")
      .select("id")
      .eq("is_verified", true);

    if (!ngos || ngos.length === 0) return { success: true, count: 0 };

    // Get all subscriptions for those NGOs
    const ngoIds = ngos.map((n) => n.id);
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", ngoIds);

    if (!subscriptions || subscriptions.length === 0) return { success: true, count: 0 };

    const isConfigured = initWebPush();
    if (!isConfigured) return { success: true, mocked: true };

    const pushPayload = JSON.stringify({
      title: "New Donation Available! 🍎",
      body: `A new batch of ${batchType} was just listed in your area. Click to view and claim it before it's gone!`,
      data: { url: `/ngo/explore` },
    });

    let successCount = 0;

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webPush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            pushPayload
          );
          successCount++;
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          }
        }
      })
    );

    return { success: true, count: successCount };
  });
