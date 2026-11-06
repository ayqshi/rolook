import { NextRequest } from "next/server";
import { withRateLimit, apiOk, apiError } from "@/lib/api-handler";
import { getGroupInfo, getGroupIcon, isRobloxError } from "@/lib/roblox-games";

export const runtime = "nodejs";

/**
 * GET /api/v1/groups/:groupId?include=icon
 *
 * Group metadata (name, description, owner, memberCount, public entry,
 * verified badge). Set `include=icon` to attach `iconUrl`.
 */
export const GET = withRateLimit(async (req: NextRequest, ctx: { params: Promise<{ groupId: string }> }) => {
  const { groupId: idRaw } = await ctx.params;
  const groupId = Number(idRaw);
  if (!Number.isFinite(groupId) || groupId <= 0) return apiError("Invalid groupId", 400);

  const group = await getGroupInfo(groupId);
  if (isRobloxError(group)) return apiError(group.error, group.status ?? 404);

  const includeRaw = req.nextUrl.searchParams.get("include") ?? "";
  const includes = new Set(includeRaw.split(",").map((s) => s.trim()).filter(Boolean));

  const out: Record<string, unknown> = { ...group };
  if (includes.has("icon")) {
    const icon = await getGroupIcon(groupId);
    out.iconUrl = icon;
  }
  return apiOk(out);
});
