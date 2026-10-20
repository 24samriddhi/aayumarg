import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { requireEnv } from "./env";

const sign = (bookingId: string) => createHmac("sha256", requireEnv("CONFIRM_SECRET")).update(bookingId).digest("hex");

export function confirmUrl(bookingId: string): string {
  const base = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}/api/payments/confirm?id=${bookingId}&t=${sign(bookingId)}`;
}

export function validConfirmToken(bookingId: string, token: string): boolean {
  const a = Buffer.from(sign(bookingId));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
