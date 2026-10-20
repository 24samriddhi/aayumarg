"use client";
import { useState } from "react";
import { getProfile, saveProfile } from "@/lib/services/profile.service";
import { useResource } from "./useResource";
import type { Profile } from "@/lib/types";

export function useProfile() {
  const res = useResource<Profile | null>(getProfile, null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function save(p: Profile) {
    setSaving(true); setSaveError(null);
    try { res.setData(await saveProfile(p)); return true; }
    catch (e) { setSaveError((e as Error).message); return false; }
    finally { setSaving(false); }
  }
  return { ...res, profile: res.data, save, saving, saveError };
}
