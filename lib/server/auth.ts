import "server-only";
import { auth } from "@clerk/nextjs/server";
import { unauthorized } from "./http";

/**
 * The signed-in Clerk user id, or a 401. Works with both the Clerk cookie and the
 * `Authorization: Bearer <token>` header the frontend client sends.
 * Every database query MUST be filtered by this id — that is what keeps one
 * person's health data away from everyone else.
 */
export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw unauthorized();
  return userId;
}
