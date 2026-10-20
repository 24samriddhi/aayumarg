import { requireUserId } from "@/lib/server/auth";
import { db } from "@/lib/server/supabase";
import { HttpError, json, notFound, route } from "@/lib/server/http";
import { parseBody, profileSchema } from "@/lib/server/validation";
import { toProfile, type ProfileRow } from "@/lib/server/mappers";

export const GET = route(async () => {
  const userId = await requireUserId();
  const { data, error } = await db().from("profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw new HttpError(500, "SERVER_ERROR", "Something went wrong.");
  if (!data) throw notFound("No profile yet.");
  return json(toProfile(data as ProfileRow));
});

export const PUT = route(async (req) => {
  const userId = await requireUserId();
  const p = await parseBody(req, profileSchema);

  const { data, error } = await db().from("profiles").upsert({
    user_id: userId,
    name: p.name, age: p.age, gender: p.gender, phone: p.phone, emergency: p.emergency,
    address: p.address, type: p.type, caregiver_name: p.caregiverName, caregiver_phone: p.caregiverPhone,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" }).select().single();

  if (error) {
    console.error("[db] profile upsert:", error.message);
    throw new HttpError(500, "SERVER_ERROR", "Something went wrong.");
  }
  return json(toProfile(data as ProfileRow));
});
