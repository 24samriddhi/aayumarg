# AayuMarg backend — setup guide

What it is: Next.js API routes (`app/api/**`) + **Supabase** (database + private file storage) +
**Razorpay** (payments) + **Twilio WhatsApp** (booking message to the category's doctor). Login stays with Clerk.

## Booking flow
1. Patient fills the OPD form → `POST /api/bookings` → saved as **Awaiting payment** (the server decides the fee and doctor).
2. `POST /api/payments/order` → Razorpay Checkout opens in the browser.
3. After paying → `POST /api/payments/verify` (HMAC signature check) → booking becomes **Confirmed**.
4. Same moment the doctor of that category gets a **WhatsApp message**.
5. Safety net: Razorpay's **webhook** confirms the booking even if the patient closes the tab before step 3.

## One-time setup
1. **Supabase**: create a project → SQL Editor → paste `supabase/schema.sql` → Run.
   Then Table editor → `doctors`: set each doctor's `whatsapp_number` (`+91XXXXXXXXXX`) and `fee_paise`
   (49900 = ₹499; `0` = free).  No code change is ever needed for this.
2. **Razorpay**: create account → use **Test mode** → copy Key ID + Secret.
   Webhooks → add `https://YOUR-DOMAIN/api/webhooks/razorpay`, event **payment.captured**, secret = `RAZORPAY_WEBHOOK_SECRET`.
3. **Twilio**: WhatsApp Sandbox → the doctor sends the join code from their phone once → note the sandbox number.
   (Production: register a WhatsApp sender + get a message template approved → put its Content SID in `TWILIO_WHATSAPP_CONTENT_SID`.)
4. Copy `.env.example` → `.env.local`, fill every value, set `NEXT_PUBLIC_USE_MOCKS=false`. Add the same variables on Vercel.
5. Test: Razorpay test card/UPI, check the Supabase `bookings` row (`payment_status = paid`, `doctor_notified_at` filled).

## Privacy rules built in
- Every query is filtered by the signed-in Clerk user id; the database accepts no direct browser access (RLS on, no policies).
- Medical files are in a **private** bucket, content-type checked by real file bytes.
- WhatsApp never contains the patient's *reason* for Mental / Sexual Health, and shows only "Confidential consultation".
- Failed WhatsApp sends never break a payment; the error is saved in `bookings.notify_error`.

## Not built yet (ideas)
Doctor portal to read full details · email/WhatsApp receipt to the patient · refunds/cancellation ·
rate limiting (e.g. Upstash) · AI endpoints · files larger than 4 MB (needs direct-to-storage upload).

## UPI mode (current)
Booking -> patient sees the QR + pays -> enters 12-digit UTR (`POST /api/payments/submit`) -> status "Payment submitted"
-> doctor gets an email with the UTR + a "Confirm" link -> after checking GPay, the doctor opens it and presses Confirm -> "Confirmed".
Setup: run `supabase/migration_upi.sql` once, add `CONFIRM_SECRET`, `APP_URL`, `GMAIL_*` to `.env.local` (and Vercel), `npm install`.
The Razorpay and Twilio routes are still in the code but unused.
