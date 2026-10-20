import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "./env";

let client: SupabaseClient | null = null;

/**
 * Supabase client with the SERVICE ROLE key (bypasses row-level security).
 * That is safe ONLY because it runs on the server and every query is scoped
 * by the authenticated Clerk user id. The browser never receives this key.
 */
export function db(): SupabaseClient {
  if (!client) {
    client = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export const DOCS_BUCKET = "medical-docs";
