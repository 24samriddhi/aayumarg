# AayuMarg — API Contract (frontend → backend)

All calls go through `lib/api/client.ts` (the only place that uses `fetch`).
Base URL: `NEXT_PUBLIC_API_BASE_URL` (default `/api`).
Auth: `Authorization: Bearer <Clerk session token>` on every request — the backend must verify it with Clerk.
Bodies are JSON unless noted. Types: `lib/types.ts`.

**Status legend:** `REAL` = implemented in `app/api`. `MOCK` = frontend currently serves this from browser storage (`NEXT_PUBLIC_USE_MOCKS=true`). `FUTURE` = no UI uses it yet; contract only.
**The backend now exists** (Next.js route handlers in `app/api`, Supabase database, Razorpay payments, Twilio WhatsApp). Set `NEXT_PUBLIC_USE_MOCKS=false` to use it — see `BACKEND_SETUP.md`. AI endpoints are still FUTURE.

| Feature | Method | Endpoint | Auth | Request | Response | Status |
|---|---|---|---|---|---|---|
| Current user | GET | `/auth/me` | Yes | — | `{ id, email, name }` | REAL |
| Get profile | GET | `/users/profile` | Yes | — | `Profile` (404 if none) | REAL |
| Save profile | PUT | `/users/profile` | Yes | `Profile` | `Profile` | REAL |
| List vitals | GET | `/vitals` | Yes | — | `Vital[]` newest first | REAL |
| Latest vital | GET | `/vitals/latest` | Yes | — | `Vital` (404 if none) | REAL |
| Add vital | POST | `/vitals` | Yes | `Vital` | `Vital` (with `id`) | REAL |
| List documents | GET | `/documents` | Yes | — | `MedicalDocument[]` | REAL |
| Upload document | POST | `/documents` | Yes | `multipart/form-data`, field `file` (PDF/JPG/PNG/WebP, max 4 MB) | `MedicalDocument` | REAL |
| Delete document | DELETE | `/documents/:id` | Yes | — | `204` | REAL |
| Latest booking | GET | `/bookings/latest` | Yes | — | `Booking` (404 if none) | REAL |
| Create booking | POST | `/bookings` | Yes | `Booking` | `Booking` (with `id`, `ref`, `amount`, `paymentStatus`; status `Awaiting payment`) | REAL |
| Create payment order | POST | `/payments/order` | Yes | `{ bookingId }` | `{ orderId, amount (paise), currency, keyId, bookingRef }` | REAL |
| Verify payment | POST | `/payments/verify` | Yes | `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }` | confirmed `Booking` (doctor gets WhatsApp) | REAL |
| Razorpay webhook | POST | `/webhooks/razorpay` | Signature | Razorpay event | `{ ok: true }` | REAL |
| Fees per category | GET | `/pricing` | No | — | `{ [category]: rupees }` | REAL |
| AI chat | POST | `/ai/chat` | Yes | `{ messages: {role, content}[] }` | `{ reply: string }` | FUTURE |
| AI health summary | GET | `/ai/health-summary` | Yes | — | `{ summary, generatedAt }` | FUTURE |

## Shapes
```ts
Profile  { name, age, gender, phone, emergency, address, type: "Elderly"|"General Public", caregiverName, caregiverPhone }
Vital    { id?, date, bp, hr, spo2, temp, sugar, weight }          // all strings, as entered in the form
MedicalDocument { id, name, size, type, date }
Booking  { id?, ref?, paymentStatus?: "unpaid"|"paid", amount?: number /* rupees */, service, date, time, reason, status, category?: "elderly"|"second-opinion"|"mental-health"|"sexual-health", patientId?, patientName?, attachments?: string[] }
```

Notes: OPD bookings attach reports/photos by first uploading each file via `POST /documents`, then sending the file names in `attachments`.
Mental/Sexual Health bookings are confidential: the backend should restrict them to the account holder and never expose `reason` to other family members.

## Errors
The client maps HTTP status → friendly text (`lib/api/errors.ts`): 400/422 validation, 401 session expired, 403 forbidden,
404 not found, 409 conflict, 429 rate limit, 5xx server, plus network failure, timeout and malformed JSON.
Backend suggestion: return `{ "error": { "code": "...", "message": "..." } }`; the frontend never shows raw server text.

## AI
Browser → `/ai/*` on YOUR backend → AI agent/model. Provider keys and agent logic stay server-side.
Responses are informational, not medical diagnosis. AI calls use a 30 s timeout.

## Privacy note
Mock mode keeps data in `localStorage` for demos only. Do not store real patient data there; the backend replaces it.
