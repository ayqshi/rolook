import { NextRequest } from "next/server";
import { withRateLimit, apiOk, apiError } from "@/lib/api-handler";
import { getUniverseFromPlace, getGameByUniverseId, isRobloxError } from "@/lib/roblox-games";

export const runtime = "nodejs";

/**
 * GET /api/v1/games/place/:placeId
 *
 * Resolve a Roblox place ID to its parent universe + game details.
 * Useful when all you have is a roblox.com/games/{placeId} URL.
 */
export const GET = withRateLimit(async (_req: NextRequest, ctx: { params: Promise<{ placeId: string }> }) => {
  const { placeId: idRaw } = await ctx.params;
  const placeId = Number(idRaw);
  if (!Number.isFinite(placeId) || placeId <= 0)
    return apiError("Invalid placeId", 400);

  const universeId = await getUniverseFromPlace(placeId);
  if (isRobloxError(universeId)) return apiError(universeId.error, universeId.status ?? 404);

  const game = await getGameByUniverseId(universeId);
  if (isRobloxError(game)) return apiError(game.error, game.status ?? 404);

  return apiOk({ placeId, universeId, game });
});
