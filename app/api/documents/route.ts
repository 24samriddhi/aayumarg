import { randomUUID } from "node:crypto";
import { requireUserId } from "@/lib/server/auth";
import { DOCS_BUCKET, db } from "@/lib/server/supabase";
import { HttpError, badRequest, json, route } from "@/lib/server/http";
import { ALLOWED_TYPES, MAX_UPLOAD_BYTES, matchesMagicBytes, safeFileName } from "@/lib/server/files";
import { toDocument, type DocumentRow } from "@/lib/server/mappers";

const fail = (msg: string, e: { message: string }) => {
  console.error(`[db] ${msg}:`, e.message);
  return new HttpError(500, "SERVER_ERROR", "Something went wrong.");
};

export const GET = route(async () => {
  const userId = await requireUserId();
  const { data, error } = await db().from("documents").select("*")
    .eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw fail("documents list", error);
  return json((data as DocumentRow[]).map(toDocument));
});

/** multipart/form-data, field "file" (PDF / JPG / PNG / WebP, max 4 MB). */
export const POST = route(async (req) => {
  const userId = await requireUserId();

  let form: FormData;
  try { form = await req.formData(); } catch { throw badRequest("Expected a file upload."); }

  const file = form.get("file");
  if (!(file instanceof File)) throw badRequest("No file received.");
  if (file.size === 0) throw badRequest("The file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) throw new HttpError(413, "FILE_TOO_LARGE", "File is too large (max 4 MB).");
  if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) throw badRequest("Only PDF, JPG, PNG or WebP files are allowed.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!matchesMagicBytes(file.type, bytes)) throw badRequest("The file content does not match its type.");

  // Stored under the user's own folder; never reachable without a server-made signed link.
  const path = `${userId}/${randomUUID()}-${safeFileName(file.name)}`;
  const supabase = db();

  const { error: upErr } = await supabase.storage.from(DOCS_BUCKET).upload(path, bytes, {
    contentType: file.type, upsert: false,
  });
  if (upErr) throw fail("storage upload", upErr);

  const { data, error } = await supabase.from("documents").insert({
    user_id: userId, name: file.name.slice(0, 200), size: file.size, type: file.type, storage_path: path,
  }).select().single();

  if (error) {
    await supabase.storage.from(DOCS_BUCKET).remove([path]); // don't leave an orphan file behind
    throw fail("document insert", error);
  }
  return json(toDocument(data as DocumentRow), 201);
});
