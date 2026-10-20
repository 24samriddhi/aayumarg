import { ENV } from "@/lib/config/env";
import { apiRequest } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { mockRead, mockWrite } from "./mockStore";
import type { MedicalDocument } from "@/lib/types";

export async function listDocuments(): Promise<MedicalDocument[]> {
  if (ENV.USE_MOCKS) return mockRead<MedicalDocument[]>("docs", []);
  return apiRequest<MedicalDocument[]>(API_ENDPOINTS.documents.list);
}

/** Mock stores file METADATA only (no file bytes). Real API receives multipart upload. */
export async function uploadDocuments(files: File[]): Promise<MedicalDocument[]> {
  if (ENV.USE_MOCKS) {
    const added = files.map((f) => ({
      id: crypto.randomUUID(), name: f.name, size: f.size, type: f.type,
      date: new Date().toLocaleString(),
    }));
    mockWrite("docs", [...added, ...mockRead<MedicalDocument[]>("docs", [])]);
    return added;
  }
  const out: MedicalDocument[] = [];
  for (const f of files) {
    const form = new FormData();
    form.append("file", f);
    out.push(await apiRequest<MedicalDocument>(API_ENDPOINTS.documents.upload, { method: "POST", body: form }));
  }
  return out;
}

export async function deleteDocument(id: string): Promise<void> {
  if (ENV.USE_MOCKS) {
    mockWrite("docs", mockRead<MedicalDocument[]>("docs", []).filter((d) => d.id !== id));
    return;
  }
  await apiRequest<void>(API_ENDPOINTS.documents.remove(id), { method: "DELETE" });
}
