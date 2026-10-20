import { ENV } from "@/lib/config/env";
import { apiRequest } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { mockRead, mockWrite } from "./mockStore";
import { mockVitalsSeed } from "@/mocks/vitals.mock";
import type { Vital } from "@/lib/types";

export async function listVitals(): Promise<Vital[]> {
  if (ENV.USE_MOCKS) return mockRead<Vital[]>("vitals", mockVitalsSeed);
  return apiRequest<Vital[]>(API_ENDPOINTS.vitals.list);
}

export async function addVital(vital: Vital): Promise<Vital> {
  if (ENV.USE_MOCKS) {
    const next = [vital, ...mockRead<Vital[]>("vitals", mockVitalsSeed)].slice(0, 8);
    mockWrite("vitals", next);
    return vital;
  }
  return apiRequest<Vital>(API_ENDPOINTS.vitals.create, { method: "POST", body: vital });
}
