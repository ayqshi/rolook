import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/v1/health
 *
 * Liveness check. Not rate-limited. Returns 200 if the service is up.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "rol-lookup",
    version: "1",
    time: new Date().toISOString(),
  });
}
