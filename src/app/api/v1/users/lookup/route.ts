import { NextRequest } from "next/server";
import { withRateLimit, apiOk, apiError } from "@/lib/api-handler";
import { lookupByUsername, isRobloxError } from "@/lib/roblox";

export const runtime = "nodejs";

/**
 * GET /api/v1/users/lookup?username=builderman
 *
 * Resolve a Roblox username to its user id + basic identity. The
 * building block for every other user endpoint.
 */
export const GET = withRateLimit(async (req: NextRequest) => {
  const username = req.nextUrl.searchParams.get("username") ?? "";
  if (!username.trim()) return apiError("Missing 'username' query parameter", 400);

  const result = await lookupByUsername(username.trim());
  if (isRobloxError(result)) {
    return apiError(result.error, result.status ?? 404);
  }
  return apiOk({
    id: result.id,
    name: result.name,
    displayName: result.displayName,
    hasVerifiedBadge: result.hasVerifiedBadge,
  });
});
