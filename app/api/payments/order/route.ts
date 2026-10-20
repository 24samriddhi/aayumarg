import { requireUserId } from "@/lib/server/auth";
import { db } from "@/lib/server/supabase";
import { HttpError, conflict, json, notFound, route } from "@/lib/server/http";
import { createOrderSchema, parseBody } from "@/lib/server/validation";
import { createOrder } from "@/lib/server/razorpay";
import { requireEnv } from "@/lib/server/env";
import type { BookingRow } from "@/lib/server/mappers";

/** Step 2 of booking: create (or reuse) a Razorpay order for the caller's own unpaid booking. */
export const POST = route(async (req) => {
  const userId = await requireUserId();
  const { bookingId } = await parseBody(req, createOrderSchema);
  const supabase = db();

  const { data, error } = await supabase.from("bookings").select("*")
    .eq("id", bookingId).eq("user_id", userId).maybeSingle();
  if (error) {
    console.error("[db] order lookup:", error.message);
    throw new HttpError(500, "SERVER_ERROR", "Something went wrong.");
  }
  if (!data) throw notFound("Booking not found.");
  const b = data as BookingRow;

  if (b.payment_status === "paid") throw conflict("This booking is already paid.");
  if (b.amount_paise <= 0) throw conflict("This booking needs no payment.");

  let orderId = b.razorpay_order_id;
  if (!orderId) {
    const order = await createOrder({
      amountPaise: b.amount_paise,
      receipt: b.ref,
      notes: { bookingId: b.id, ref: b.ref },
    });
    orderId = order.id;
    const { error: uErr } = await supabase.from("bookings").update({ razorpay_order_id: orderId }).eq("id", b.id);
    if (uErr) {
      console.error("[db] save order id:", uErr.message);
      throw new HttpError(500, "SERVER_ERROR", "Something went wrong.");
    }
  }

  return json({
    orderId,
    amount: b.amount_paise,   // paise
    currency: "INR",
    keyId: requireEnv("RAZORPAY_KEY_ID"), // public key id (safe for the browser)
    bookingRef: b.ref,
  });
});
