import { currentUser } from "@clerk/nextjs/server";
import { json, route, unauthorized } from "@/lib/server/http";

export const GET = route(async () => {
  const user = await currentUser();
  if (!user) throw unauthorized();
  return json({
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress ?? "",
    name: [user.firstName, user.lastName].filter(Boolean).join(" "),
  });
});
