import "server-only";
import { db } from "./supabase";
import type { BookingRow } from "./mappers";
import { sendMail } from "./email";
import { confirmUrl } from "./confirmToken";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10-25" + "10:00" -> "25 Oct 2026, 10:00 AM" (both are the clinic's local date/time). */
export function formatSlot(date: string, time: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${d} ${MONTHS[m - 1]} ${y}, ${h12}:${String(mm).padStart(2, "0")} ${hh < 12 ? "AM" : "PM"}`;
}

const rupees = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

const CONFIDENTIAL = new Set(["mental-health", "sexual-health"]);

/**
 * PRIVACY RULE: WhatsApp is not a secure medical channel.
 *  - the patient's "reason" is NEVER sent for confidential categories
 *    (mental / sexual health), and the service is shown generically
 *  - for the other categories only a short reason is included
 */
export function buildDoctorMessage(b: BookingRow, patientPhone: string | null) {
  const confidential = CONFIDENTIAL.has(b.category);
  const service = confidential ? "Confidential consultation" : b.service;
  const slot = formatSlot(b.booking_date, b.booking_time.slice(0, 5));
  const patient = b.patient_name || "Patient";
  const contact = patientPhone || "not provided";
  const note = !confidential && b.reason ? b.reason.slice(0, 200) : "";

  const body = [
    "✅ New AayuMarg booking (paid)",
    `Ref: ${b.ref}`,
    `Service: ${service}`,
    `When: ${slot}`,
    `Patient: ${patient}`,
    `Contact: ${contact}`,
    `Paid: ${rupees(b.amount_paise)}`,
    note ? `Note: ${note}` : "",
  ].filter(Boolean).join("\n");

  // Variables for an approved Twilio Content Template ({{1}}..{{5}})
  const variables = { "1": b.ref, "2": service, "3": slot, "4": patient, "5": contact };
  return { body, variables };
}

/** WhatsApp (Twilio) abhi band hai. Purane code ke liye ye ab email bhejta hai. */
export async function notifyDoctor(bookingId: string): Promise<void> {
  await notifyDoctorEmail(bookingId);
}

/**
 * Email the doctor about a booking (Gmail). Never throws.
 *  - UPI booking: payment_status "submitted" -> email has the UTR + a "Confirm payment" link
 *  - free / already paid booking: plain "new booking" email
 * Privacy: the patient's reason is left out for mental / sexual health, like the WhatsApp message.
 */
export async function notifyDoctorEmail(bookingId: string): Promise<void> {
  const supabase = db();
  try {
    const { data } = await supabase.from("bookings").select("*").eq("id", bookingId).maybeSingle();
    const b = data as (BookingRow & { utr?: string | null }) | null;
    if (!b || b.doctor_notified_at) return;

    const { data: profile } = await supabase.from("profiles").select("phone").eq("user_id", b.user_id).maybeSingle();
    const confidential = CONFIDENTIAL.has(b.category);
    const submitted = b.payment_status === "submitted";
    const lines: (string | null)[] = [
      submitted ? "Payment submitted - please check your GPay and confirm." : "New booking.",
      "",
      `Ref: ${b.ref}`,
      `Service: ${confidential ? "Confidential consultation" : b.service}`,
      `When: ${formatSlot(b.booking_date, b.booking_time.slice(0, 5))}`,
      `Patient: ${b.patient_name || "Patient"}`,
      `Contact: ${(profile?.phone as string | undefined) || "not provided"}`,
      `Amount: ${rupees(b.amount_paise)}`,
      submitted ? `UTR entered by patient: ${b.utr}` : null,
      !confidential && b.reason ? `Note: ${b.reason.slice(0, 200)}` : null,
    ];
    if (submitted) {
      lines.push("", `1) Open GPay and look for ${rupees(b.amount_paise)} with UTR ${b.utr}.`,
        "2) If it matches, open this link and press Confirm:", confirmUrl(b.id),
        "If it does NOT match, do nothing - the booking stays unconfirmed.");
    }
    await sendMail(`${submitted ? "Payment to verify" : "New booking"} - ${b.ref}`, lines.filter((l): l is string => l !== null).join("\n"));

    await supabase.from("bookings").update({ doctor_notified_at: new Date().toISOString(), notify_error: null }).eq("id", b.id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[notify] email failed:", msg);
    await supabase.from("bookings").update({ notify_error: msg.slice(0, 300) }).eq("id", bookingId);
  }
}