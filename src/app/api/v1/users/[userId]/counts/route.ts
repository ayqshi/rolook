import { NextRequest } from "next/server";
import { withRateLimit, apiOk, apiError } from "@/lib/api-handler";
import {
  getFriendsCount,
  getFollowersCount,
  getFollowingCount,
  getGroups,
  getGames,
  isRobloxError,
} from "@/lib/roblox";

export const runtime = "nodejs";

/**
 * GET /api/v1/users/:userId/counts
 *
 * Public counts for friends, followers, following, groups and games.
 * (Roblox hides the lists themselves behind auth, but the counts remain
 * public — see the data-availability notice on the home page.)
 */
export const GET = withRateLimit(async (_req: NextRequest, ctx: { params: Promise<{ userId: string }> }) => {
  const { userId: userIdRaw } = await ctx.params;
  const userId = Number(userIdRaw);
  if (!Number.isFinite(userId) || userId <= 0) return apiError("Invalid userId", 400);

  const [friends, followers, following, groups, games] = await Promise.all([
    getFriendsCount(userId),
    getFollowersCount(userId),
    getFollowingCount(userId),
    getGroups(userId),
    getGames(userId),
  ]);
  return apiOk({
    friends: typeof friends === "number" && !isRobloxError(friends) ? friends : 0,
    followers: typeof followers === "number" && !isRobloxError(followers) ? followers : 0,
    following: typeof following === "number" && !isRobloxError(following) ? following : 0,
    groups: Array.isArray(groups) ? groups.length : 0,
    games: Array.isArray(games) ? games.length : 0,
  });
});
