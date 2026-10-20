import { NextResponse } from "next/server";
import { db } from "@/lib/server/supabase";
import { route } from "@/lib/server/http";

/** Public: consultation fee (in rupees) per category, so the booking form can show the price. */
export const GET = route(async () => {
  const { data } = await db().from("doctors").select("category, fee_paise").eq("active", true);
  const fees: Record<string, number> = {};
  for (const r of data ?? []) fees[r.category as string] = (r.fee_paise as number) / 100;
  return NextResponse.json(fees, { headers: { "Cache-Control": "public, s-maxage=60" } });
});
