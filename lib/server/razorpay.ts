import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { requireEnv } from "./env";

const API = "https://api.razorpay.com/v1";

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
}

/** Create a payment order. Amount is in PAISE and is decided by OUR server, never the browser. */
export async function createOrder(params: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const auth = Buffer.from(`${requireEnv("RAZORPAY_KEY_ID")}:${requireEnv("RAZORPAY_KEY_SECRET")}`).toString("base64");

  const res = await fetch(`${API}/orders`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: params.amountPaise,
      currency: "INR",
      receipt: params.receipt.slice(0, 40),
      notes: params.notes,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Razorpay order failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  return (await res.json()) as RazorpayOrder;
}

function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/**
 * Checkout callback proof: HMAC_SHA256(order_id + "|" + payment_id, key_secret) must equal
 * the signature Razorpay gave the browser. Only Razorpay (and we) know the secret.
 */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string, secret = requireEnv("RAZORPAY_KEY_SECRET")): boolean {
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

/** Webhook proof: HMAC_SHA256(raw request body, webhook secret) must equal x-razorpay-signature. */
export function verifyWebhookSignature(rawBody: string, signature: string, secret = requireEnv("RAZORPAY_WEBHOOK_SECRET")): boolean {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
