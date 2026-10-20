import { requireUserId } from "@/lib/server/auth";
import { db } from "@/lib/server/supabase";
import { HttpError, json, notFound, route } from "@/lib/server/http";
import { toVital, type VitalRow } from "@/lib/server/mappers";

export const GET = route(async () => {
  const userId = await requireUserId();
  const { data, error } = await db().from("vitals").select("*")
    .eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new HttpError(500, "SERVER_ERROR", "Something went wrong.");
  if (!data) throw notFound("No vitals yet.");
  return json(toVital(data as VitalRow));
});
