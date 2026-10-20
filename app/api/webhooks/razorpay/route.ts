import { after } from "next/server";
import { HttpError, json, route } from "@/lib/server/http";
import { verifyWebhookSignature } from "@/lib/server/razorpay";
import { confirmPayment } from "@/lib/server/bookings";
import { notifyDoctor } from "@/lib/server/notify";

interface WebhookPayload {
  event?: string;
  payload?: { payment?: { entity?: { id?: string; order_id?: string; amount?: number; status?: string } } };
}

/**
 * Safety net: if the patient pays but closes the tab before our /verify call,
 * Razorpay still tells us here. PUBLIC route — protected by the signature check only.
 * Dashboard setup: Settings -> Webhooks -> URL https://YOUR-DOMAIN/api/webhooks/razorpay,
 * secret = RAZORPAY_WEBHOOK_SECRET, events: payment.captured
 */
export const POST = route(async (req) => {
  const raw = await req.text(); // the signature is computed over the RAW body
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!signature || !verifyWebhookSignature(raw, signature)) {
    throw new HttpError(400, "BAD_SIGNATURE", "Invalid signature.");
  }

  let evt: WebhookPayload;
  try { evt = JSON.parse(raw) as WebhookPayload; } catch { throw new HttpError(400, "BAD_REQUEST", "Invalid body."); }

  const pay = evt.payload?.payment?.entity;
  if (evt.event === "payment.captured" && pay?.order_id && pay.id) {
    const result = await confirmPayment({ orderId: pay.order_id, paymentId: pay.id, paidAmountPaise: pay.amount });
    if (result?.firstTime) after(() => notifyDoctor(result.row.id));
  }
  // Always 200 for events we ignore, so Razorpay does not keep retrying them.
  return json({ ok: true });
});
