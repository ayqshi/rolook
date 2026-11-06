import { NextRequest, NextResponse } from "next/server";
import {
  rateLimit,
  rateLimitHeaders,
  getClientIp,
  type RateLimitResult,
} from "@/lib/rate-limit";

export const runtime = "nodejs";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
};

/**
 * Apply rate-limiting + JSON envelope + CORS to a v1 handler.
 *
 * - Adds permissive CORS headers so any website can call /api/v1/* from
 *   the browser (the visitor's IP is what gets rate-limited).
 * - Enforces per-IP token bucket (60 req/min, burst 60).
 * - Returns 429 with Retry-After on rate-limit.
 * - Wraps every successful response with rate-limit headers.
 * - Wraps every error response in a stable { error, status } envelope.
 */
export function withRateLimit<TArgs extends unknown[]>(
  handler: (req: NextRequest, ...args: TArgs) => Promise<NextResponse>,
) {
  return async (
    req: NextRequest,
    ...args: TArgs
  ): Promise<NextResponse> => {
    // Handle CORS preflight inline
    if (req.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
    }

    const ip = getClientIp(req);
    const rl: RateLimitResult = rateLimit(ip);
    const headers = { ...rateLimitHeaders(rl), ...CORS_HEADERS };

    if (!rl.ok) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Slow down and retry shortly.",
          status: 429,
          retryAfter: rl.retryAfter,
        },
        {
          status: 429,
          headers: { ...headers, "Content-Type": "application/json" },
        },
      );
    }

    try {
      const res = await handler(req, ...args);
      // Attach rate-limit + CORS headers to whatever the handler returned
      for (const [k, v] of Object.entries(headers)) res.headers.set(k, v);
      return res;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Internal error";
      return NextResponse.json(
        { error: message, status: 500 },
        { status: 500, headers },
      );
    }
  };
}

/** Standard JSON error response (already rate-limited by the wrapper). */
export function apiError(
  message: string,
  status = 500,
  extra: Record<string, unknown> = {},
) {
  const res = NextResponse.json({ error: message, status, ...extra }, { status });
  for (const [k, v] of Object.entries(CORS_HEADERS)) res.headers.set(k, v);
  return res;
}

/** Standard JSON success response. */
export function apiOk(data: unknown, status = 200) {
  const res = NextResponse.json(data, { status });
  for (const [k, v] of Object.entries(CORS_HEADERS)) res.headers.set(k, v);
  return res;
}
