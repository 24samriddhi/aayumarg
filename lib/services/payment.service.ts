import { apiRequest } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { Booking } from "@/lib/types";

/** Patient paid by UPI and typed the 12-digit UTR. Resolves with the booking ("Payment submitted"). */
export async function submitUtr(booking: Booking, utr: string): Promise<Booking> {
  if (!booking.id) throw new Error("This booking cannot be paid yet. Please refresh and try again.");
  return apiRequest<Booking>(API_ENDPOINTS.payments.submit, { method: "POST", body: { bookingId: booking.id, utr } });
}
