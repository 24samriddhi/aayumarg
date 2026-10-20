/**
 * Central, frontend-safe configuration.
 * Only NEXT_PUBLIC_* variables are readable in the browser.
 * NEVER put secrets (AI provider keys, DB urls, Clerk secret) here.
 */
export const ENV = {
  /** Base URL of the REST backend. Default "/api" (same-origin / Next route handlers). */
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
  /** Request timeout in ms. */
  API_TIMEOUT_MS: Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS) || 15000,
  /**
   * While no backend exists the app runs on MOCK services (browser storage).
   * Set NEXT_PUBLIC_USE_MOCKS=false once the backend is live.
   */
  USE_MOCKS: process.env.NEXT_PUBLIC_USE_MOCKS !== "false",
} as const;
