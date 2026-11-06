import { NextRequest } from "next/server";
import { withRateLimit, apiOk, apiError } from "@/lib/api-handler";
import { getGames, isRobloxError } from "@/lib/roblox";
import { getGameIcons } from "@/lib/roblox-games";

export const runtime = "nodejs";

/**
 * GET /api/v1/users/:userId/games
 *
 * The user's published experiences (universe id, root place id, name,
 * description, visit count, created, updated) with icon URLs attached.
 */
export const GET = withRateLimit(async (_req: NextRequest, ctx: { params: Promise<{ userId: string }> }) => {
  const { userId: userIdRaw } = await ctx.params;
  const userId = Number(userIdRaw);
  if (!Number.isFinite(userId) || userId <= 0) return apiError("Invalid userId", 400);

  const games = await getGames(userId);
  if (isRobloxError(games)) return apiError(games.error, games.status ?? 500);

  const ids = games.slice(0, 50).map((g) => g.id);
  const icons = await getGameIcons(ids);

  return apiOk({
    count: games.length,
    data: games.map((g) => ({ ...g, iconUrl: icons[g.id] ?? null })),
  });
});
