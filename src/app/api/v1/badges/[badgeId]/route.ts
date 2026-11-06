import { NextRequest } from "next/server";
import { withRateLimit, apiOk, apiError } from "@/lib/api-handler";
import { getBadgeInfo, getBadgeIcon, isRobloxError } from "@/lib/roblox-games";

export const runtime = "nodejs";

/**
 * GET /api/v1/badges/:badgeId?include=icon
 *
 * Badge metadata (name, description, icon image id, awarded statistics,
 * created/updated). Set `include=icon` to attach `iconUrl`.
 *
 * Note: badge LIST endpoints (per-user) require auth since the 2026
 * privacy changes; only single-badge lookups work publicly.
 */
export const GET = withRateLimit(async (req: NextRequest, ctx: { params: Promise<{ badgeId: string }> }) => {
  const { badgeId: idRaw } = await ctx.params;
  const badgeId = Number(idRaw);
  if (!Number.isFinite(badgeId) || badgeId <= 0) return apiError("Invalid badgeId", 400);

  const badge = await getBadgeInfo(badgeId);
  if (isRobloxError(badge)) return apiError(badge.error, badge.status ?? 404);

  const includeRaw = req.nextUrl.searchParams.get("include") ?? "";
  const includes = new Set(includeRaw.split(",").map((s) => s.trim()).filter(Boolean));

  const out: Record<string, unknown> = { ...badge };
  if (includes.has("icon")) {
    const icon = await getBadgeIcon(badgeId);
    out.iconUrl = icon;
  }
  return apiOk(out);
});
