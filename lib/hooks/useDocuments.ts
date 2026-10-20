"use client";
import { useState } from "react";
import { deleteDocument, listDocuments, uploadDocuments } from "@/lib/services/documents.service";
import { useResource } from "./useResource";
import type { MedicalDocument } from "@/lib/types";

export function useDocuments() {
  const res = useResource<MedicalDocument[]>(listDocuments, []);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function upload(files: File[]) {
    setBusy(true); setActionError(null);
    try { await uploadDocuments(files); await res.reload(); return true; }
    catch (e) { setActionError((e as Error).message); return false; }
    finally { setBusy(false); }
  }
  async function remove(id: string) {
    setBusy(true); setActionError(null);
    try { await deleteDocument(id); await res.reload(); }
    catch (e) { setActionError((e as Error).message); }
    finally { setBusy(false); }
  }
  return { ...res, documents: res.data, upload, remove, busy, actionError };
}
