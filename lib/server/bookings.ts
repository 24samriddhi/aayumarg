import "server-only";
import { randomInt } from "node:crypto";
import { db } from "./supabase";
import { HttpError, badRequest } from "./http";
import type { BookingRow } from "./mappers";
import type { z } from "zod";
import type { bookingSchema } from "./validation";

type BookingInput = z.infer<typeof bookingSchema>;

const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L lookalikes
const newRef = () => "AM-" + Array.from({ length: 6 }, () => REF_ALPHABET[randomInt(REF_ALPHABET.length)]).join("");

function dbError(where: string, error: { message: string }): never {
  console.error(`[db] ${where}:`, error.message);
  throw new HttpError(500, "SERVER_ERROR", "Something went wrong.");
}

/**
 * Create a booking. Price and doctor routing come from the `doctors` table (server side),
 * the browser can never choose its own fee or status.
 * Returns { row, needsNotify } — needsNotify is true only for FREE bookings, which are
 * confirmed immediately (paid ones are confirmed after Razorpay verifies the payment).
 */
export async function createBookingForUser(userId: string, input: BookingInput) {
  const supabase = db();
  const category = input.category ?? "general";

  const { data: doctor, error: dErr } = await supabase
    .from("doctors").select("fee_paise, active").eq("category", category).maybeSingle();
  if (dErr) dbError("doctors lookup", dErr);
  if (!doctor || !doctor.active) throw new HttpError(503, "UNAVAILABLE", "This service is not available right now.");

  // Same unpaid request again (e.g. the payment popup was closed)? Reuse it, don't duplicate.
  let existing = supabase.from("bookings").select("*")
    .eq("user_id", userId).eq("category", category)
    .eq("booking_date", input.date).eq("booking_time", input.time)
    .eq("payment_status", "unpaid");
  existing = input.patientId ? existing.eq("patient_id", input.patientId) : existing.is("patient_id", null);
  const { data: dup } = await existing.order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (dup) {
    const { data: updated, error } = await supabase.from("bookings")
      .update({ reason: input.reason, attachments: input.attachments ?? [] }).eq("id", dup.id).select().single();
    if (error) dbError("booking reuse", error);
    return { row: updated as BookingRow, needsNotify: false };
  }

  const free = doctor.fee_paise === 0;
  const row = {
    ref: newRef(),
    user_id: userId,
    category,
    service: input.service,
    booking_date: input.date,
    booking_time: input.time,
    reason: input.reason,
    patient_id: input.patientId ?? null,
    patient_name: input.patientName ?? null,
    attachments: input.attachments ?? [],
    amount_paise: doctor.fee_paise,
    status: free ? "Confirmed" : "Awaiting payment",
    payment_status: free ? "paid" : "unpaid",
    paid_at: free ? new Date().toISOString() : null,
  };

  const { data, error } = await supabase.from("bookings").insert(row).select().single();
  if (error) dbError("booking insert", error);
  return { row: data as BookingRow, needsNotify: free };
}

/**
 * Mark a booking paid. Called by BOTH the browser verify route and the Razorpay webhook,
 * so it must be safe to run twice: the conditional UPDATE (… WHERE payment_status='unpaid')
 * lets exactly one caller flip it, and only that caller gets firstTime = true
 * (=> exactly one WhatsApp message to the doctor).
 */
export async function confirmPayment(opts: {
  orderId: string;
  paymentId: string;
  /** When known (webhook), the paid amount must equal what we asked for. */
  paidAmountPaise?: number;
  /** When known (browser), only the owner may confirm their own booking. */
  userId?: string;
}): Promise<{ row: BookingRow; firstTime: boolean } | null> {
  const supabase = db();

  let q = supabase.from("bookings").select("*").eq("razorpay_order_id", opts.orderId);
  if (opts.userId) q = q.eq("user_id", opts.userId);
  const { data: found, error } = await q.maybeSingle();
  if (error) dbError("confirm lookup", error);
  if (!found) return null;
  const current = found as BookingRow;

  if (opts.paidAmountPaise !== undefined && opts.paidAmountPaise !== current.amount_paise) {
    console.error(`[payment] amount mismatch for ${current.ref}: paid ${opts.paidAmountPaise}, expected ${current.amount_paise}`);
    throw badRequest("Payment amount mismatch.");
  }
  if (current.payment_status === "paid") return { row: current, firstTime: false };

  const { data: updated, error: uErr } = await supabase.from("bookings")
    .update({
      payment_status: "paid",
      status: "Confirmed",
      razorpay_payment_id: opts.paymentId,
      paid_at: new Date().toISOString(),
    })
    .eq("id", current.id)
    .eq("payment_status", "unpaid")
    .select();
  if (uErr) dbError("confirm update", uErr);

  if (updated && updated.length === 1) return { row: updated[0] as BookingRow, firstTime: true };
  // somebody else confirmed it a moment ago
  return { row: { ...current, payment_status: "paid", status: "Confirmed" }, firstTime: false };
}

/** Patient says "I paid" and gives the 12-digit UTR. The booking waits for the doctor to confirm. */
export async function submitUpiPayment(userId: string, bookingId: string, utr: string): Promise<BookingRow> {
  const supabase = db();
  const { data: found, error } = await supabase.from("bookings").select("*").eq("id", bookingId).eq("user_id", userId).maybeSingle();
  if (error) dbError("utr lookup", error);
  if (!found) throw new HttpError(404, "NOT_FOUND", "Booking not found.");
  const current = found as BookingRow;
  if (current.payment_status === "paid") throw new HttpError(409, "CONFLICT", "This booking is already paid.");
  if (current.amount_paise <= 0) throw new HttpError(409, "CONFLICT", "This booking needs no payment.");

  const { data: updated, error: uErr } = await supabase.from("bookings")
    .update({
      utr, payment_status: "submitted", status: "Payment submitted",
      payment_submitted_at: new Date().toISOString(),
      doctor_notified_at: null, // a corrected UTR triggers a fresh email
    })
    .eq("id", current.id).neq("payment_status", "paid").select().single();
  if (uErr) {
    if ((uErr as { code?: string }).code === "23505") throw new HttpError(409, "CONFLICT", "This UTR was already used for another booking.");
    dbError("utr update", uErr);
  }
  return updated as BookingRow;
}

/** Doctor confirms (via the email link) that the money arrived. Safe to run twice. */
export async function confirmManualPayment(bookingId: string): Promise<BookingRow | null> {
  const supabase = db();
  const { data, error } = await supabase.from("bookings")
    .update({ payment_status: "paid", status: "Confirmed", paid_at: new Date().toISOString() })
    .eq("id", bookingId).neq("payment_status", "paid").select();
  if (error) dbError("manual confirm", error);
  if (data && data.length === 1) return data[0] as BookingRow;
  const { data: existing } = await supabase.from("bookings").select("*").eq("id", bookingId).maybeSingle();
  return (existing as BookingRow | null) ?? null;
}
