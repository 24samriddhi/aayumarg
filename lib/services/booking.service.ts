import { ENV } from "@/lib/config/env";
import { apiRequest } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { mockRead, mockWrite } from "./mockStore";
import type { Booking } from "@/lib/types";

export async function getLatestBooking(): Promise<Booking | null> {
  if (ENV.USE_MOCKS) return mockRead<Booking | null>("booking", null);
  try {
    return await apiRequest<Booking>(API_ENDPOINTS.bookings.latest);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function createBooking(b: Booking): Promise<Booking> {
  if (ENV.USE_MOCKS) { mockWrite("booking", b); return b; }
  return apiRequest<Booking>(API_ENDPOINTS.bookings.create, { method: "POST", body: b });
}
