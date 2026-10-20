"use client";
import { useState } from "react";
import { addVital, listVitals } from "@/lib/services/vitals.service";
import { useResource } from "./useResource";
import type { Vital } from "@/lib/types";

export function useVitals() {
  const res = useResource<Vital[]>(listVitals, []);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function add(v: Vital) {
    setSaving(true); setSaveError(null);
    try { await addVital(v); await res.reload(); return true; }
    catch (e) { setSaveError((e as Error).message); return false; }
    finally { setSaving(false); }
  }
  return { ...res, vitals: res.data, add, saving, saveError };
}
