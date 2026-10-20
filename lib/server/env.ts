import "server-only";

/**
 * Server-only environment access. Missing values fail with a clear message
 * (logged on the server) instead of a vague crash.
 * NEVER import this file from client components.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export function optionalEnv(name: string): string | undefined {
  return process.env[name] || undefined;
}
