import { NextRequest } from "next/server";
import { withRateLimit, apiOk, apiError } from "@/lib/api-handler";
import { getGameIcons } from "@/lib/roblox-games";

export const runtime = "nodejs";

/**
 * GET /api/v1/games/:universeId/icon?size=256x256
 *
 * Returns the game's icon URL. Sizes accepted by Roblox:
 * 50x50, 128x128, 150x150, 256x256, 512x512. Default 256x256.
 */
export const GET = withRateLimit(async (req: NextRequest, ctx: { params: Promise<{ universeId: string }> }) => {
  const { universeId: idRaw } = await ctx.params;
  const universeId = Number(idRaw);
  if (!Number.isFinite(universeId) || universeId <= 0)
    return apiError("Invalid universeId", 400);

  const size = req.nextUrl.searchParams.get("size") ?? "256x256";
  const icons = await getGameIcons([universeId], size);
  const url = icons[universeId];
  if (!url) return apiError("Icon unavailable", 502);

  return apiOk({ universeId, size, imageUrl: url });
});
