import { NextRequest } from "next/server";
import { withRateLimit, apiOk, apiError } from "@/lib/api-handler";
import { getGameByUniverseId, getGameIcons, getGameThumbnails, isRobloxError } from "@/lib/roblox-games";

export const runtime = "nodejs";

/**
 * GET /api/v1/games/:universeId?include=icon,thumbnails
 *
 * Full game detail (name, description, creator, playing, visits, max
 * players, created, updated, favoritedCount, genre). Optional `include`:
 *
 *   icon        — attach `iconUrl` (256x256 PNG)
 *   thumbnails  — attach `thumbnails` (array of 512x288 screenshot URLs)
 */
export const GET = withRateLimit(async (req: NextRequest, ctx: { params: Promise<{ universeId: string }> }) => {
  const { universeId: idRaw } = await ctx.params;
  const universeId = Number(idRaw);
  if (!Number.isFinite(universeId) || universeId <= 0)
    return apiError("Invalid universeId", 400);

  const includeRaw = req.nextUrl.searchParams.get("include") ?? "";
  const includes = new Set(includeRaw.split(",").map((s) => s.trim()).filter(Boolean));

  const game = await getGameByUniverseId(universeId);
  if (isRobloxError(game)) return apiError(game.error, game.status ?? 404);

  const out: Record<string, unknown> = { ...game };

  if (includes.has("icon")) {
    const icons = await getGameIcons([universeId]);
    out.iconUrl = icons[universeId] ?? null;
  }
  if (includes.has("thumbnails")) {
    const thumbs = await getGameThumbnails([universeId]);
    out.thumbnails = thumbs[universeId] ?? [];
  }
  return apiOk(out);
});
