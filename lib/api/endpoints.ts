/**
 * Single source of truth for backend routes.
 * Status of each group is documented in API_CONTRACT.md (REAL / MOCK / FUTURE).
 */
export const API_ENDPOINTS = {
  auth: { me: "/auth/me" },
  users: { profile: "/users/profile" },
  vitals: { list: "/vitals", latest: "/vitals/latest", create: "/vitals" },
  documents: {
    list: "/documents",
    upload: "/documents",
    remove: (id: string) => `/documents/${encodeURIComponent(id)}`,
  },
  bookings: { latest: "/bookings/latest", create: "/bookings" },
  payments: { order: "/payments/order", verify: "/payments/verify", submit: "/payments/submit" },
  pricing: "/pricing",
  ai: { chat: "/ai/chat", healthSummary: "/ai/health-summary" },
} as const;
