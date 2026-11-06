import { NextRequest } from "next/server";
import { withRateLimit, apiOk } from "@/lib/api-handler";
import { getPopularGames } from "@/lib/roblox-games";

export const runtime = "nodejs";

/**
 * GET /api/v1/games/popular?limit=24
 *
 * Curated popular games feed: aggregates the published experiences of a
 * small set of well-known Roblox developers, drops starter placeholders,
 * sorts by visit count desc, attaches icon URLs. Cached for 5 min.
 *
 * `limit` is clamped to [1, 100].
 */
export const GET = withRateLimit(async (req: NextRequest) => {
  const limitParam = Number(req.nextUrl.searchParams.get("limit") ?? "24");
  const limit = Number.isFinite(limitParam)
    ? Math.min(100, Math.max(1, Math.floor(limitParam)))
    : 24;

  const games = await getPopularGames(limit);
  return apiOk({ count: games.length, cached: true, data: games });
});
