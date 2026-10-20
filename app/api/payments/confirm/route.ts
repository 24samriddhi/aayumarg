import { badRequest, route } from "@/lib/server/http";
import { confirmManualPayment } from "@/lib/server/bookings";
import { validConfirmToken } from "@/lib/server/confirmToken";

const page = (title: string, body: string) =>
  new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<body style="font-family:system-ui;max-width:420px;margin:12vh auto;padding:0 20px;color:#2a1a1d">` +
    `<h2 style="color:#7a1f2b">${title}</h2>${body}</body>`,
    { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );

/** Link from the doctor's email. GET only shows a button (email scanners open links), POST confirms. */
export const GET = route(async (req) => {
  const u = new URL(req.url);
  const id = u.searchParams.get("id") ?? "";
  const t = u.searchParams.get("t") ?? "";
  if (!id || !validConfirmToken(id, t)) throw badRequest("Invalid or expired link.");
  return page("Confirm payment",
    `<p>Press confirm only after you have seen the money in your GPay.</p>` +
    `<form method="post" action="/api/payments/confirm"><input type="hidden" name="id" value="${id}">` +
    `<input type="hidden" name="t" value="${t}">` +
    `<button style="background:#7a1f2b;color:#fff;border:0;border-radius:10px;padding:12px 22px;font-size:16px">Confirm payment received</button></form>`);
});

export const POST = route(async (req) => {
  const form = await req.formData();
  const id = String(form.get("id") ?? "");
  const t = String(form.get("t") ?? "");
  if (!id || !validConfirmToken(id, t)) throw badRequest("Invalid or expired link.");
  const row = await confirmManualPayment(id);
  if (!row) throw badRequest("Booking not found.");
  return page("Payment confirmed", `<p>Booking <b>${row.ref}</b> is now confirmed. You can close this page.</p>`);
});
