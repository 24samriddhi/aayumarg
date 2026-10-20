import { ENV } from "@/lib/config/env";
import { apiRequest } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { mockRead, mockWrite } from "./mockStore";
import type { Profile } from "@/lib/types";

export async function getProfile(): Promise<Profile | null> {
  if (ENV.USE_MOCKS) return mockRead<Profile | null>("profile", null);
  try {
    return await apiRequest<Profile>(API_ENDPOINTS.users.profile);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null; // no profile yet
    throw e;
  }
}

export async function saveProfile(profile: Profile): Promise<Profile> {
  if (ENV.USE_MOCKS) { mockWrite("profile", profile); return profile; }
  return apiRequest<Profile>(API_ENDPOINTS.users.profile, { method: "PUT", body: profile });
}
