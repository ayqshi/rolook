import { NextRequest, NextResponse } from "next/server";
import { getGames, getGameIcons } from "@/lib/roblox";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const userIdParam = req.nextUrl.searchParams.get("userId");
  if (!userIdParam) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  const userId = Number(userIdParam);
  if (!Number.isFinite(userId) || userId <= 0)
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });

  const games = await getGames(userId);
  if ("error" in games) {
    return NextResponse.json(games, { status: games.status ?? 500 });
  }
  const ids = games.map((g) => g.id).slice(0, 50);
  const icons = await getGameIcons(ids);

  return NextResponse.json({
    data: games.map((g) => ({ ...g, iconUrl: icons[g.id] ?? null })),
    count: games.length,
  });
}
