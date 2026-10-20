import "server-only";
import { z } from "zod";
import { badRequest } from "./http";

const text = (max: number) => z.string().trim().max(max);

export const profileSchema = z.object({
  name: text(100),
  age: text(10),
  gender: text(30),
  phone: text(20),
  emergency: text(20),
  address: text(300),
  type: z.enum(["Elderly", "General Public"]),
  caregiverName: text(100),
  caregiverPhone: text(20),
});

export const vitalSchema = z.object({
  date: text(40),
  bp: text(20),
  hr: text(10),
  spo2: text(10),
  temp: text(10),
  sugar: text(10),
  weight: text(10),
});

export const CATEGORY_IDS = ["elderly", "second-opinion", "mental-health", "sexual-health"] as const;

export const bookingSchema = z.object({
  service: z.string().trim().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  reason: text(1000).default(""),
  category: z.enum(CATEGORY_IDS).optional(),
  patientId: text(100).optional(),
  patientName: text(100).optional(),
  attachments: z.array(text(200)).max(6).optional(),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1).max(100),
  razorpay_payment_id: z.string().min(1).max(100),
  razorpay_signature: z.string().min(1).max(200),
});

export const submitPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  utr: z.string().trim().regex(/^\d{12}$/, "UTR must be 12 digits"),
});

export const createOrderSchema = z.object({ bookingId: z.string().uuid() });

/** Parse a JSON body with a zod schema; any problem becomes a clean 400. */
export async function parseBody<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw badRequest("Request body must be valid JSON.");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((i) => i.path.join(".") || "body"))];
    throw badRequest(`Invalid fields: ${fields.join(", ")}`);
  }
  return parsed.data;
}

/** A booking date must be real, not far in the past (1 day grace for time zones) and within a year. */
export function assertBookingDateOk(date: string): void {
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== date) throw badRequest("Invalid date.");
  const day = 24 * 60 * 60 * 1000;
  const diff = d.getTime() - Date.now();
  if (diff < -2 * day) throw badRequest("The booking date is in the past.");
  if (diff > 366 * day) throw badRequest("The booking date is too far ahead.");
}
