import { NextRequest, NextResponse } from "next/server";
import { getGroups, getGroupIcons } from "@/lib/roblox";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const userIdParam = req.nextUrl.searchParams.get("userId");
  if (!userIdParam) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  const userId = Number(userIdParam);
  if (!Number.isFinite(userId) || userId <= 0)
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });

  const groups = await getGroups(userId);
  if ("error" in groups) {
    return NextResponse.json(groups, { status: groups.status ?? 500 });
  }
  const ids = groups.map((g) => g.group.id).slice(0, 100);
  const icons = await getGroupIcons(ids);

  return NextResponse.json({
    data: groups.map((g) => ({
      ...g,
      iconUrl: icons[g.group.id] ?? null,
    })),
    count: groups.length,
  });
}
