import { NextRequest } from "next/server";
import { withRateLimit, apiOk, apiError } from "@/lib/api-handler";
import { getBadgeIcon } from "@/lib/roblox-games";

export const runtime = "nodejs";

/**
 * GET /api/v1/badges/:badgeId/icon?size=150x150
 *
 * Returns the badge's icon URL. Sizes accepted by Roblox:
 * 150x150. Default 150x150.
 */
export const GET = withRateLimit(async (req: NextRequest, ctx: { params: Promise<{ badgeId: string }> }) => {
  const { badgeId: idRaw } = await ctx.params;
  const badgeId = Number(idRaw);
  if (!Number.isFinite(badgeId) || badgeId <= 0) return apiError("Invalid badgeId", 400);

  const size = req.nextUrl.searchParams.get("size") ?? "150x150";
  const url = await getBadgeIcon(badgeId, size);
  if (!url) return apiError("Icon unavailable", 502);

  return apiOk({ badgeId, size, imageUrl: url });
});
