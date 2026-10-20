import { requireUserId } from "@/lib/server/auth";
import { db } from "@/lib/server/supabase";
import { HttpError, json, route } from "@/lib/server/http";
import { parseBody, vitalSchema } from "@/lib/server/validation";
import { toVital, type VitalRow } from "@/lib/server/mappers";

const fail = (msg: string, e: { message: string }) => {
  console.error(`[db] ${msg}:`, e.message);
  return new HttpError(500, "SERVER_ERROR", "Something went wrong.");
};

/** Newest first. */
export const GET = route(async () => {
  const userId = await requireUserId();
  const { data, error } = await db().from("vitals").select("*")
    .eq("user_id", userId).order("created_at", { ascending: false }).limit(100);
  if (error) throw fail("vitals list", error);
  return json((data as VitalRow[]).map(toVital));
});

export const POST = route(async (req) => {
  const userId = await requireUserId();
  const v = await parseBody(req, vitalSchema);
  const { data, error } = await db().from("vitals").insert({ user_id: userId, ...v }).select().single();
  if (error) throw fail("vitals insert", error);
  return json(toVital(data as VitalRow), 201);
});
