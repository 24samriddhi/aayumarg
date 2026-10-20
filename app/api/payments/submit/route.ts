import { after } from "next/server";
import { requireUserId } from "@/lib/server/auth";
import { json, route } from "@/lib/server/http";
import { parseBody, submitPaymentSchema } from "@/lib/server/validation";
import { submitUpiPayment } from "@/lib/server/bookings";
import { notifyDoctorEmail } from "@/lib/server/notify";
import { toBooking } from "@/lib/server/mappers";

/** Patient paid by UPI and sends the 12-digit UTR. Booking -> "Payment submitted"; doctor gets an email. */
export const POST = route(async (req) => {
  const userId = await requireUserId();
  const { bookingId, utr } = await parseBody(req, submitPaymentSchema);
  const row = await submitUpiPayment(userId, bookingId, utr);
  after(() => notifyDoctorEmail(row.id));
  return json(toBooking(row));
});
