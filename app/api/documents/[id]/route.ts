import { requireUserId } from "@/lib/server/auth";
import { DOCS_BUCKET, db } from "@/lib/server/supabase";
import { HttpError, notFound, route } from "@/lib/server/http";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const DELETE = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const userId = await requireUserId();
  const { id } = await ctx.params;
  if (!UUID.test(id)) throw notFound();

  const supabase = db();
  // Ownership check: the row must belong to THIS user.
  const { data: doc, error } = await supabase.from("documents")
    .select("id, storage_path").eq("id", id).eq("user_id", userId).maybeSingle();
  if (error) {
    console.error("[db] document lookup:", error.message);
    throw new HttpError(500, "SERVER_ERROR", "Something went wrong.");
  }
  if (!doc) throw notFound();

  const { error: rmErr } = await supabase.storage.from(DOCS_BUCKET).remove([doc.storage_path]);
  if (rmErr) console.error("[storage] remove failed:", rmErr.message);

  const { error: delErr } = await supabase.from("documents").delete().eq("id", id).eq("user_id", userId);
  if (delErr) {
    console.error("[db] document delete:", delErr.message);
    throw new HttpError(500, "SERVER_ERROR", "Something went wrong.");
  }
  return new Response(null, { status: 204 });
});
