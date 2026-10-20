# AayuMarg — We care

AayuMarg is a calm digital space for families to manage a care profile, health vitals, medical records and healthcare bookings. This repository is the **front-end prototype**, structured so a backend and AI agents can be plugged in without touching the UI.

## Tech stack
Next.js (App Router) · React · TypeScript · Clerk (auth) · lucide-react · plain CSS design tokens (`app/globals.css`).

## Installation
```bash
git clone <repo-url>
cd <repo-folder>
npm install
cp .env.example .env.local     # then fill in your Clerk keys
npm run dev
```
Open http://localhost:3000. Node.js 20.9+ recommended.

## Environment variables
See `.env.example`. Required: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`.
Optional: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_API_TIMEOUT_MS`, `NEXT_PUBLIC_USE_MOCKS`.

## Architecture
```
app/            pages (landing, dashboard, profile, vitals, documents, booking) + globals.css (design tokens)
components/     AppNav, Footer, States (loading/error/empty), AuthTokenBridge
lib/api/        client.ts (only fetch), endpoints.ts, errors.ts
lib/services/   profile / vitals / documents / booking  (mock OR real API)
lib/ai/         ai.service.ts (AI access point)
lib/hooks/      useProfile, useVitals, useDocuments, useBooking, useAiChat
lib/config/     env.ts
mocks/          mock data used while no backend exists
middleware.ts   Clerk route protection
```
Data flow: `UI → hook → service → API client → backend → database / AI`.
With `NEXT_PUBLIC_USE_MOCKS=true` (default) services use browser storage instead of the API client.

## Authentication
Clerk. `middleware.ts` protects `/dashboard /profile /vitals /documents /booking`. `AuthTokenBridge` hands the Clerk session token to the API client, which sends it as a Bearer token.

## Backend integration
Implement the routes in **`API_CONTRACT.md`**, set `NEXT_PUBLIC_API_BASE_URL`, then `NEXT_PUBLIC_USE_MOCKS=false`. Nothing else in the UI needs to change.

## AI integration
Future assistants connect in `lib/ai/ai.service.ts` (→ backend `/ai/chat`, `/ai/health-summary`); `useAiChat` already handles idle/loading/success/error/retry. The browser never calls an AI provider and no AI keys belong in this repo.

## Deployment
Standard Next.js: `npm run build && npm start`, or deploy to any Next.js host (e.g. Vercel) with the environment variables above.

## Known limitations
- No backend exists yet; all data is MOCK (browser storage) and documents keep metadata only.
- No AI UI yet (service + hook are ready).
- Hero/feature photos are hot-linked from Unsplash/Pexels; download them into `public/assets/` before production.


## Backend
The real backend (Supabase + Razorpay + Twilio WhatsApp) is described in [BACKEND_SETUP.md](BACKEND_SETUP.md). Without it the app runs in demo mode (`NEXT_PUBLIC_USE_MOCKS=true`).
