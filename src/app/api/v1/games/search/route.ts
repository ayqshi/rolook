import { NextRequest } from "next/server";
import { withRateLimit, apiOk, apiError } from "@/lib/api-handler";
import { searchPopularGames } from "@/lib/roblox-games";

export const runtime = "nodejs";

/**
 * GET /api/v1/games/search?q=obby&limit=24
 *
 * Search the curated popular catalog for a keyword. Roblox's own game
 * search endpoint is locked behind auth, so we filter the cached popular
 * list locally by name / description / creator name.
 *
 * `limit` is clamped to [1, 100].
 */
export const GET = withRateLimit(async (req: NextRequest) => {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) {
    return apiError("Missing 'q' query parameter", 400);
  }
  const limitParam = Number(req.nextUrl.searchParams.get("limit") ?? "24");
  const limit = Number.isFinite(limitParam)
    ? Math.min(100, Math.max(1, Math.floor(limitParam)))
    : 24;

  const games = await searchPopularGames(q, limit);
  return apiOk({ query: q.trim(), count: games.length, data: games });
});
