"use client";
import { useState } from "react";
import { submitUtr } from "@/lib/services/payment.service";
import { UPI, upiLink } from "@/lib/config/upi";
import type { Booking } from "@/lib/types";

export default function UpiPayPanel({ booking, onSubmitted }: { booking: Booking; onSubmitted: (b: Booking) => void }) {
  const [utr, setUtr] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const amount = booking.amount ?? 0;
  const valid = /^\d{12}$/.test(utr);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) { setErr("UTR is the 12-digit number shown in your UPI app after paying."); return; }
    setBusy(true); setErr(null);
    try { onSubmitted(await submitUtr(booking, utr)); }
    catch (e2) { setErr((e2 as Error).message || "Could not submit. Please try again."); }
    finally { setBusy(false); }
  }

  return (
    <form className="form" onSubmit={send} style={{ textAlign: "center" }}>
      <b>Pay ₹{amount} by UPI</b>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/upi-qr.png" alt={`UPI QR for ${UPI.name}`} width={230} style={{ margin: "0 auto", borderRadius: 12, maxWidth: "100%", height: "auto" }} />
      <div className="muted">UPI ID: <b>{UPI.id}</b></div>
      <a className="btn btn-secondary" href={upiLink(amount, booking.ref ?? "")}>Open UPI app (phone)</a>
      <div className="field" style={{ textAlign: "left" }}>
        <label htmlFor="utr">After paying, enter the 12-digit UTR / reference number</label>
        <input id="utr" inputMode="numeric" maxLength={12} autoComplete="off" placeholder="e.g. 412345678901"
          value={utr} onChange={(e) => setUtr(e.target.value.replace(/\D/g, ""))} />
      </div>
      {err && <div className="error-state" role="alert">{err}</div>}
      <button className="btn btn-primary" type="submit" disabled={busy || !valid}>{busy ? "Please wait…" : "I have paid"}</button>
      <small className="muted">Your booking is confirmed once the doctor sees the payment.</small>
    </form>
  );
}
