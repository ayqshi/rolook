import { NextRequest } from "next/server";
import { withRateLimit, apiOk, apiError } from "@/lib/api-handler";
import { getPresence, getUserStatus, presenceLabel, isRobloxError } from "@/lib/roblox";

export const runtime = "nodejs";

/**
 * GET /api/v1/users/:userId/presence
 *
 * Live presence (offline / online / in-game / in-studio), last location,
 * last online timestamp, and the user's free-text status message.
 */
export const GET = withRateLimit(async (_req: NextRequest, ctx: { params: Promise<{ userId: string }> }) => {
  const { userId: userIdRaw } = await ctx.params;
  const userId = Number(userIdRaw);
  if (!Number.isFinite(userId) || userId <= 0) return apiError("Invalid userId", 400);

  const [presence, status] = await Promise.all([
    getPresence(userId),
    getUserStatus(userId),
  ]);
  return apiOk({
    presence: presence && !isRobloxError(presence) ? presence : null,
    presenceLabel:
      presence && !isRobloxError(presence) ? presenceLabel(presence.userPresenceType) : null,
    status: status && !isRobloxError(status) ? status.status : null,
  });
});
