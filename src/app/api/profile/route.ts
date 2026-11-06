import { NextRequest, NextResponse } from "next/server";
import {
  getUser,
  getPresence,
  getUserStatus,
  getThumbnail,
  getFriendsCount,
  getFollowersCount,
  getFollowingCount,
  getGroups,
  getGames,
  presenceLabel,
  isRobloxError,
} from "@/lib/roblox";

export const runtime = "nodejs";

/**
 * GET /api/profile?userId=123
 *
 * Aggregates the "header" data for a profile: full user, presence, status,
 * avatar thumbnails (headshot + full body), and the public counts we can
 * read without authentication.
 *
 * NOTE: Roblox locked down friends/followers/following/badges/inventory
 * LIST endpoints to require authentication in 2024-2026. We can still
 * read COUNTS for friends/followers/following, and the full groups + games
 * lists. Badges and collectibles list endpoints now require auth — those
 * tabs in the UI show a "view on Roblox" link instead of an error.
 */
export async function GET(req: NextRequest) {
  const userIdParam = req.nextUrl.searchParams.get("userId");
  if (!userIdParam) {
    return NextResponse.json(
      { error: "Missing 'userId' query parameter" },
      { status: 400 },
    );
  }
  const userId = Number(userIdParam);
  if (!Number.isFinite(userId) || userId <= 0) {
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  }

  const [
    user,
    presence,
    status,
    headshot,
    avatar,
    friendsCount,
    followersCount,
    followingCount,
    groups,
    games,
  ] = await Promise.all([
    getUser(userId),
    getPresence(userId),
    getUserStatus(userId),
    getThumbnail(userId, "headshot"),
    getThumbnail(userId, "avatar"),
    getFriendsCount(userId),
    getFollowersCount(userId),
    getFollowingCount(userId),
    getGroups(userId),
    getGames(userId),
  ]);

  if (isRobloxError(user)) {
    return NextResponse.json(user, { status: user.status ?? 500 });
  }

  const presenceInfo =
    presence && !isRobloxError(presence)
      ? presenceLabel(presence.userPresenceType)
      : null;

  return NextResponse.json({
    user,
    presence: presence && !isRobloxError(presence) ? presence : null,
    presenceLabel: presenceInfo,
    status: status && !isRobloxError(status) ? status.status : null,
    headshot: typeof headshot === "string" ? headshot : null,
    avatar: typeof avatar === "string" ? avatar : null,
    counts: {
      friends:
        typeof friendsCount === "number" && !isRobloxError(friendsCount)
          ? friendsCount
          : 0,
      followers:
        typeof followersCount === "number" && !isRobloxError(followersCount)
          ? followersCount
          : 0,
      following:
        typeof followingCount === "number" && !isRobloxError(followingCount)
          ? followingCount
          : 0,
      groups: Array.isArray(groups) ? groups.length : 0,
      badges: null, // requires auth
      games: Array.isArray(games) ? games.length : 0,
      inventory: null, // requires auth
    },
  });
}
