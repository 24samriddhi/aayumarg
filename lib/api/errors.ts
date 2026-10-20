export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/** Human-readable messages. Raw server errors / stack traces are never shown. */
export function friendlyMessage(status: number): string {
  switch (status) {
    case 400:
    case 422:
      return "Some of the information looks incorrect. Please check and try again.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You don't have permission to do that.";
    case 404:
      return "We couldn't find what you were looking for.";
    case 409:
      return "This conflicts with existing information. Please refresh and retry.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    case 0:
      return "Network problem. Please check your connection and try again.";
    default:
      return status >= 500
        ? "Something went wrong on our side. Please try again shortly."
        : "Something went wrong. Please try again.";
  }
}
