import { NextRequest } from "next/server";
import { withRateLimit, apiOk, apiError } from "@/lib/api-handler";
import { getGroupIcon } from "@/lib/roblox-games";

export const runtime = "nodejs";

/**
 * GET /api/v1/groups/:groupId/icon?size=150x150
 *
 * Returns the group's icon URL. Sizes accepted by Roblox:
 * 150x150, 420x420. Default 150x150.
 */
export const GET = withRateLimit(async (req: NextRequest, ctx: { params: Promise<{ groupId: string }> }) => {
  const { groupId: idRaw } = await ctx.params;
  const groupId = Number(idRaw);
  if (!Number.isFinite(groupId) || groupId <= 0) return apiError("Invalid groupId", 400);

  const size = req.nextUrl.searchParams.get("size") ?? "150x150";
  const url = await getGroupIcon(groupId, size);
  if (!url) return apiError("Icon unavailable", 502);

  return apiOk({ groupId, size, imageUrl: url });
});
