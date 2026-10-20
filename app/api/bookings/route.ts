import { after } from "next/server";
import { requireUserId } from "@/lib/server/auth";
import { json, route } from "@/lib/server/http";
import { assertBookingDateOk, bookingSchema, parseBody } from "@/lib/server/validation";
import { createBookingForUser } from "@/lib/server/bookings";
import { notifyDoctorEmail } from "@/lib/server/notify";
import { toBooking } from "@/lib/server/mappers";

/**
 * Creates the booking as "Awaiting payment". The browser then shows the UPI QR and
 * calls POST /api/payments/submit with the patient UTR.
 * (Free services — fee 0 — are confirmed here and the doctor is notified right away.)
 */
export const POST = route(async (req) => {
  const userId = await requireUserId();
  const input = await parseBody(req, bookingSchema);
  assertBookingDateOk(input.date);

  const { row, needsNotify } = await createBookingForUser(userId, input);
  if (needsNotify) after(() => notifyDoctorEmail(row.id));

  return json(toBooking(row), 201);
});
