import { NextRequest } from "next/server";
import { withRateLimit, apiOk, apiError } from "@/lib/api-handler";
import { getGameThumbnails } from "@/lib/roblox-games";

export const runtime = "nodejs";

/**
 * GET /api/v1/games/:universeId/thumbnail?size=512x288
 *
 * Returns an array of screenshot URLs for the game. Default 512x288.
 */
export const GET = withRateLimit(async (req: NextRequest, ctx: { params: Promise<{ universeId: string }> }) => {
  const { universeId: idRaw } = await ctx.params;
  const universeId = Number(idRaw);
  if (!Number.isFinite(universeId) || universeId <= 0)
    return apiError("Invalid universeId", 400);

  const size = req.nextUrl.searchParams.get("size") ?? "512x288";
  const thumbs = await getGameThumbnails([universeId], size);
  const urls = thumbs[universeId] ?? [];
  if (urls.length === 0) return apiError("Thumbnails unavailable", 502);

  return apiOk({ universeId, size, imageUrls: urls });
});
