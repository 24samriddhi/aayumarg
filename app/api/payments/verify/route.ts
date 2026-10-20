import { after } from "next/server";
import { requireUserId } from "@/lib/server/auth";
import { badRequest, json, notFound, route } from "@/lib/server/http";
import { parseBody, verifyPaymentSchema } from "@/lib/server/validation";
import { verifyCheckoutSignature } from "@/lib/server/razorpay";
import { confirmPayment } from "@/lib/server/bookings";
import { notifyDoctor } from "@/lib/server/notify";
import { toBooking } from "@/lib/server/mappers";

/**
 * Step 3: Razorpay Checkout succeeded in the browser. We do NOT trust the browser —
 * we recompute the HMAC signature with our secret. Only then is the booking confirmed
 * and the doctor messaged on WhatsApp.
 */
export const POST = route(async (req) => {
  const userId = await requireUserId();
  const p = await parseBody(req, verifyPaymentSchema);

  if (!verifyCheckoutSignature(p.razorpay_order_id, p.razorpay_payment_id, p.razorpay_signature)) {
    throw badRequest("Payment could not be verified.");
  }

  const result = await confirmPayment({ orderId: p.razorpay_order_id, paymentId: p.razorpay_payment_id, userId });
  if (!result) throw notFound("Booking not found.");

  if (result.firstTime) after(() => notifyDoctor(result.row.id));
  return json(toBooking(result.row));
});
