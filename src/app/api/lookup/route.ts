import { NextRequest, NextResponse } from "next/server";
import { lookupByUsername } from "@/lib/roblox";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username") ?? "";
  const cleaned = username.trim();
  if (!cleaned) {
    return NextResponse.json(
      { error: "Missing 'username' query parameter" },
      { status: 400 },
    );
  }
  const result = await lookupByUsername(cleaned);
  if ("error" in result) {
    return NextResponse.json(result, { status: result.status ?? 404 });
  }
  return NextResponse.json(result);
}
