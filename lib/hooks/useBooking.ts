"use client";
import { useState } from "react";
import { createBooking, getLatestBooking } from "@/lib/services/booking.service";
import { useResource } from "./useResource";
import type { Booking } from "@/lib/types";

export function useBooking() {
  const res = useResource<Booking | null>(getLatestBooking, null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  /**
   * Creates the booking (server decides fee + doctor). Returns the created booking, or null on failure.
   * If booking.paymentStatus === "unpaid" the caller shows <UpiPayPanel/> to collect the UTR.
   */
  async function book(b: Booking): Promise<Booking | null> {
    setSaving(true); setSaveError(null);
    try {
      const created = await createBooking(b);
      res.setData(created);
      return created;
    } catch (e) { setSaveError((e as Error).message); return null; }
    finally { setSaving(false); }
  }

  return { ...res, booking: res.data, book, saving, saveError };
}
