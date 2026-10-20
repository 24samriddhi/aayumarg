/**
 * MOCK persistence (browser localStorage) – PROTOTYPE ONLY.
 * Health data must NOT live in localStorage in production; the backend replaces this.
 */
const PREFIX = "ayumarg_";

export function mockRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function mockWrite<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage full / blocked – ignore in mock layer */
  }
}
