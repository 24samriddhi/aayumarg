import "server-only";
import { NextResponse } from "next/server";

/** An error that is safe to turn into an HTTP response. */
export class HttpError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (msg = "Invalid request.") => new HttpError(400, "BAD_REQUEST", msg);
export const unauthorized = () => new HttpError(401, "UNAUTHORIZED", "Please sign in.");
export const notFound = (msg = "Not found.") => new HttpError(404, "NOT_FOUND", msg);
export const conflict = (msg = "Conflict.") => new HttpError(409, "CONFLICT", msg);

/**
 * Wraps a route handler: any thrown HttpError becomes `{ error: { code, message } }`
 * (see API_CONTRACT.md). Unknown errors are logged and returned as a generic 500
 * so database / provider details never leak to the browser.
 */
export function route<Args extends unknown[]>(
  handler: (req: Request, ...args: Args) => Promise<Response>,
) {
  return async (req: Request, ...args: Args): Promise<Response> => {
    try {
      return await handler(req, ...args);
    } catch (e) {
      if (e instanceof HttpError) {
        return NextResponse.json({ error: { code: e.code, message: e.message } }, { status: e.status });
      }
      console.error("[api] unhandled error:", e);
      return NextResponse.json(
        { error: { code: "SERVER_ERROR", message: "Something went wrong." } },
        { status: 500 },
      );
    }
  };
}

/** Never cache personal data. */
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
