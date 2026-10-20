import "server-only";
import nodemailer from "nodemailer";
import { optionalEnv, requireEnv } from "./env";

/** Send a plain-text email through Gmail (App Password). Alerts go to NOTIFY_EMAIL_TO (default: the Gmail itself). */
export async function sendMail(subject: string, text: string): Promise<void> {
  const user = requireEnv("GMAIL_USER");
  const pass = requireEnv("GMAIL_APP_PASSWORD").replace(/\s/g, ""); // Google shows it with spaces
  const transporter = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
  await transporter.sendMail({ from: `AayuMarg <${user}>`, to: optionalEnv("NOTIFY_EMAIL_TO") || user, subject, text });
}
