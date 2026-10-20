import { ENV } from "@/lib/config/env";
import { apiRequest } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

/** Consultation fee in rupees per category id (empty in mock mode — nothing is charged). */
export async function getFees(): Promise<Record<string, number>> {
  if (ENV.USE_MOCKS) return {};
  return apiRequest<Record<string, number>>(API_ENDPOINTS.pricing);
}
