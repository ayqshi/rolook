import { NextRequest } from "next/server";
import { withRateLimit, apiOk, apiError } from "@/lib/api-handler";
import { getThumbnail } from "@/lib/roblox";

export const runtime = "nodejs";

/**
 * GET /api/v1/users/:userId/thumbnail?kind=headshot|avatar|bust&size=420x420
 *
 * Returns a single CDN URL to the user's avatar render. `kind` defaults
 * to headshot; `size` defaults to 420x420. The URL points at Roblox's
 * thumbnail CDN (tr.rbxcdn.com) and is good for ~30 days.
 */
export const GET = withRateLimit(async (req: NextRequest, ctx: { params: Promise<{ userId: string }> }) => {
  const { userId: userIdRaw } = await ctx.params;
  const userId = Number(userIdRaw);
  if (!Number.isFinite(userId) || userId <= 0) return apiError("Invalid userId", 400);

  const kind = (req.nextUrl.searchParams.get("kind") ?? "headshot") as
    | "headshot"
    | "avatar"
    | "bust";
  const validKinds = ["headshot", "avatar", "bust"];
  if (!validKinds.includes(kind)) return apiError("Invalid 'kind'", 400);

  const url = await getThumbnail(userId, kind);
  if (typeof url !== "string") return apiError("Thumbnail unavailable", 502);

  return apiOk({ userId, kind, imageUrl: url });
});
