import { NextRequest } from "next/server";
import { withRateLimit, apiOk, apiError } from "@/lib/api-handler";
import { getGroups, isRobloxError, getGroupIcons } from "@/lib/roblox";

export const runtime = "nodejs";

/**
 * GET /api/v1/users/:userId/groups
 *
 * Full list of group memberships (group id, name, member count, verified
 * badge, role name, rank) with the group icon URL attached.
 */
export const GET = withRateLimit(async (_req: NextRequest, ctx: { params: Promise<{ userId: string }> }) => {
  const { userId: userIdRaw } = await ctx.params;
  const userId = Number(userIdRaw);
  if (!Number.isFinite(userId) || userId <= 0) return apiError("Invalid userId", 400);

  const groups = await getGroups(userId);
  if (isRobloxError(groups)) return apiError(groups.error, groups.status ?? 500);

  const ids = groups.slice(0, 100).map((g) => g.group.id);
  const icons = await getGroupIcons(ids);

  return apiOk({
    count: groups.length,
    data: groups.map((g) => ({ ...g, iconUrl: icons[g.group.id] ?? null })),
  });
});
