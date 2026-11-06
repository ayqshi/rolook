import { NextRequest } from "next/server";
import { withRateLimit, apiOk, apiError } from "@/lib/api-handler";
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
import { getGameIcons } from "@/lib/roblox-games";

export const runtime = "nodejs";

/**
 * GET /api/v1/users/:userId?include=presence,counts,groups,games,thumbnail,status
 *
 * Full Roblox user profile. By default returns the user object only; the
 * `include` query param controls which sub-resources are attached:
 *
 *   presence   — last online, presence type, last location
 *   counts     — friends, followers, following, groups, games counts
 *   groups     — first 100 group memberships (with role + member count)
 *   games      — first 50 published experiences (with icon)
 *   thumbnail  — headshot URL
 *   status     — free-text status message
 *
 * Multiple values are comma-separated. The endpoint fans out to Roblox in
 * parallel, so including everything is only one round-trip for the client.
 */
export const GET = withRateLimit(async (req: NextRequest, ctx: { params: Promise<{ userId: string }> }) => {
  const { userId: userIdRaw } = await ctx.params;
  const includeRaw = req.nextUrl.searchParams.get("include") ?? "";
  const userId = Number(userIdRaw);
  if (!Number.isFinite(userId) || userId <= 0) return apiError("Invalid userId", 400);

  const includes = new Set(includeRaw.split(",").map((s) => s.trim()).filter(Boolean));

  const user = await getUser(userId);
  if (isRobloxError(user)) return apiError(user.error, user.status ?? 404);

  const out: Record<string, unknown> = { user };

  const tasks: Promise<void>[] = [];

  if (includes.has("presence")) {
    tasks.push(
      getPresence(userId).then((p) => {
        out.presence = p && !isRobloxError(p) ? p : null;
        out.presenceLabel =
          p && !isRobloxError(p) ? presenceLabel(p.userPresenceType) : null;
      }),
    );
  }
  if (includes.has("counts")) {
    tasks.push(
      Promise.all([
        getFriendsCount(userId),
        getFollowersCount(userId),
        getFollowingCount(userId),
        getGroups(userId),
        getGames(userId),
      ]).then(([friends, followers, following, groups, games]) => {
        out.counts = {
          friends: typeof friends === "number" && !isRobloxError(friends) ? friends : 0,
          followers:
            typeof followers === "number" && !isRobloxError(followers) ? followers : 0,
          following:
            typeof following === "number" && !isRobloxError(following) ? following : 0,
          groups: Array.isArray(groups) ? groups.length : 0,
          games: Array.isArray(games) ? games.length : 0,
        };
      }),
    );
  }
  if (includes.has("groups")) {
    tasks.push(
      getGroups(userId).then(async (groups) => {
        if (isRobloxError(groups)) {
          out.groups = [];
        } else {
          out.groups = groups.slice(0, 100);
        }
      }),
    );
  }
  if (includes.has("games")) {
    tasks.push(
      (async () => {
        const games = await getGames(userId);
        if (isRobloxError(games)) {
          out.games = [];
          return;
        }
        const top = games.slice(0, 50);
        const icons = await getGameIcons(top.map((g) => g.id));
        out.games = top.map((g) => ({ ...g, iconUrl: icons[g.id] ?? null }));
      })(),
    );
  }
  if (includes.has("thumbnail")) {
    tasks.push(
      getThumbnail(userId, "headshot").then((t) => {
        out.thumbnail = typeof t === "string" ? t : null;
      }),
    );
  }
  if (includes.has("status")) {
    tasks.push(
      getUserStatus(userId).then((s) => {
        out.status = s && !isRobloxError(s) ? s.status : null;
      }),
    );
  }

  await Promise.all(tasks);
  return apiOk(out);
});
