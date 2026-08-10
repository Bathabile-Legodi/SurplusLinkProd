// src/lib/email.ts
import emailjs from "@emailjs/browser";

interface SendClaimEmailParams {
  donorEmail: string;
  donorName: string;
  ngoName?: string;
  donationDescription?: string;
  batchId?: string;
  batchType?: string;
  collectionDate?: string;
  fulfillmentType?: "Pick-up" | "Delivery" | string;
  fulfillmentMethod?: "pickup" | "delivery";
  pickupAddress?: string;
  deliveryAddress?: string;
  verificationPin?: string;
}

export async function sendClaimNotificationEmail({
  donorEmail,
  donorName,
  ngoName,
  donationDescription,
  batchId,
  batchType,
  collectionDate,
  fulfillmentType,
  fulfillmentMethod,
  pickupAddress,
  deliveryAddress,
  verificationPin,
}: SendClaimEmailParams) {
  // Determine if pickup vs delivery from either property
  const isPickup =
    fulfillmentMethod === "pickup" ||
    fulfillmentType?.toLowerCase().includes("pickup") ||
    fulfillmentType?.toLowerCase().includes("pick-up");

  // EmailJS Configuration Keys
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_rxeqr8i";
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "Aw_JSB7nEtJgH6HOJ";

  const pickupTemplateId =
    import.meta.env.VITE_EMAILJS_PICKUP_TEMPLATE_ID || "template_xpidvmj";
  const deliveryTemplateId =
    import.meta.env.VITE_EMAILJS_DELIVERY_TEMPLATE_ID || "template_tanjhsp";

  const templateId = isPickup ? pickupTemplateId : deliveryTemplateId;

  try {
    const response = await emailjs.send(
      serviceId,
      templateId,
      {
        to_email: donorEmail,
        donor_name: donorName,
        ngo_name: ngoName || "NGO",
        donation_description: donationDescription || batchType || "Surplus Food",
        batch_id: batchId || "N/A",
        batch_type: batchType || donationDescription || "Surplus Food",
        collection_date: collectionDate || "As arranged",
        fulfillment_type: fulfillmentType || (isPickup ? "Pick-up" : "Delivery"),
        pickup_address: pickupAddress || "N/A",
        delivery_address: deliveryAddress || "N/A",
        verification_pin: verificationPin || "N/A",
      },
      publicKey
    );

    console.log(`[EmailJS] Claim email sent to ${donorEmail}:`, response.status, response.text);
    return { success: true, response };
  } catch (error) {
    console.error("[EmailJS] Error sending claim email:", error);
    return { success: false, error };
  }
}