import "server-only";
import type { Booking, CategoryId, MedicalDocument, Profile, Vital } from "@/lib/types";

/* ---------- row types (database shape) ---------- */

export interface ProfileRow {
  user_id: string; name: string; age: string; gender: string; phone: string;
  emergency: string; address: string; type: "Elderly" | "General Public";
  caregiver_name: string; caregiver_phone: string;
}
export interface VitalRow {
  id: string; date: string; bp: string; hr: string; spo2: string; temp: string; sugar: string; weight: string;
}
export interface DocumentRow {
  id: string; name: string; size: number; type: string; storage_path: string; created_at: string;
}
export interface BookingRow {
  id: string; ref: string; user_id: string; category: string; service: string;
  booking_date: string; booking_time: string; reason: string;
  patient_id: string | null; patient_name: string | null; attachments: string[];
  status: string; payment_status: "unpaid" | "submitted" | "paid"; amount_paise: number;
  razorpay_order_id: string | null; razorpay_payment_id: string | null;
  doctor_notified_at: string | null; utr?: string | null;
}

/* ---------- database -> API (matches lib/types.ts) ---------- */

export const toProfile = (r: ProfileRow): Profile => ({
  name: r.name, age: r.age, gender: r.gender, phone: r.phone, emergency: r.emergency,
  address: r.address, type: r.type, caregiverName: r.caregiver_name, caregiverPhone: r.caregiver_phone,
});

export const toVital = (r: VitalRow): Vital => ({
  id: r.id, date: r.date, bp: r.bp, hr: r.hr, spo2: r.spo2, temp: r.temp, sugar: r.sugar, weight: r.weight,
});

export const toDocument = (r: DocumentRow): MedicalDocument => ({
  id: r.id, name: r.name, size: Number(r.size), type: r.type,
  date: new Date(r.created_at).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short",
  }),
});

export function toBooking(r: BookingRow): Booking {
  return {
    id: r.id,
    ref: r.ref,
    service: r.service,
    date: r.booking_date,
    time: r.booking_time.slice(0, 5), // Postgres returns HH:MM:SS
    reason: r.reason,
    status: r.status,
    category: r.category === "general" ? undefined : (r.category as CategoryId),
    patientId: r.patient_id ?? undefined,
    patientName: r.patient_name ?? undefined,
    attachments: r.attachments ?? [],
    paymentStatus: r.payment_status,
    amount: r.amount_paise / 100, // rupees, for display
  };
}
