import { requireUserId } from "@/lib/server/auth";
import { db } from "@/lib/server/supabase";
import { HttpError, json, notFound, route } from "@/lib/server/http";
import { toBooking, type BookingRow } from "@/lib/server/mappers";

export const GET = route(async () => {
  const userId = await requireUserId();
  const { data, error } = await db().from("bookings").select("*")
    .eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) {
    console.error("[db] latest booking:", error.message);
    throw new HttpError(500, "SERVER_ERROR", "Something went wrong.");
  }
  if (!data) throw notFound("No booking yet.");
  return json(toBooking(data as BookingRow));
});
