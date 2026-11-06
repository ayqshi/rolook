/**
 * In-memory token-bucket rate limiter, applied to public /api/v1/* routes.
 *
 * Generous default: 60 req/min per IP (1 token/sec, burst 60). That allows
 * a typical website visitor to fan out a profile + 5 tab loads on first
 * paint and still have ~50 calls in reserve. Abusive single-IP traffic
 * gets a 429 with `Retry-After` and the standard rate-limit headers.
 *
 * The bucket lives in-process. Memory is bounded by a periodic sweep of
 * idle buckets, so a flood of unique IPs cannot exhaust heap.
 */

type Bucket = { tokens: number; lastRefill: number };

const CAPACITY = 60; // max tokens (burst)
const REFILL_PER_SEC = 1; // tokens per second (sustained rate)

const buckets = new Map<string, Bucket>();

// Sweep idle buckets every 5 minutes
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
const IDLE_CUTOFF_MS = 5 * 60 * 1000;

let sweepTimer: ReturnType<typeof setInterval> | null = null;
function ensureSweep() {
  if (sweepTimer) return;
  sweepTimer = setInterval(() => {
    const cutoff = Date.now() - IDLE_CUTOFF_MS;
    for (const [key, b] of buckets) {
      if (b.lastRefill < cutoff) buckets.delete(key);
    }
  }, SWEEP_INTERVAL_MS);
  // Don't keep the process alive just for this timer
  if (sweepTimer && typeof sweepTimer.unref === "function") {
    sweepTimer.unref();
  }
}

export type RateLimitResult = {
  ok: boolean;
  /** Maximum tokens the bucket can hold (header X-RateLimit-Limit). */
  limit: number;
  /** Tokens remaining after this call (header X-RateLimit-Remaining). */
  remaining: number;
  /** Unix ms when the bucket will have ≥1 token again (header X-RateLimit-Reset). */
  resetMs: number;
  /** Seconds to wait before retrying (header Retry-After, only when ok=false). */
  retryAfter: number;
};

export function rateLimit(
  ip: string,
  opts: { capacity?: number; refillPerSec?: number } = {},
): RateLimitResult {
  ensureSweep();

  const capacity = opts.capacity ?? CAPACITY;
  const refillPerSec = opts.refillPerSec ?? REFILL_PER_SEC;
  const now = Date.now();

  let b = buckets.get(ip);
  if (!b) {
    b = { tokens: capacity, lastRefill: now };
    buckets.set(ip, b);
  }

  // Refill proportional to elapsed time
  const elapsedSec = (now - b.lastRefill) / 1000;
  b.tokens = Math.min(capacity, b.tokens + elapsedSec * refillPerSec);
  b.lastRefill = now;

  if (b.tokens < 1) {
    const deficit = 1 - b.tokens;
    const retryAfter = Math.ceil(deficit / refillPerSec);
    return {
      ok: false,
      limit: capacity,
      remaining: 0,
      resetMs: now + retryAfter * 1000,
      retryAfter,
    };
  }

  b.tokens -= 1;
  return {
    ok: true,
    limit: capacity,
    remaining: Math.floor(b.tokens),
    resetMs: now + Math.ceil((1 - b.tokens) / refillPerSec) * 1000,
    retryAfter: 0,
  };
}

/**
 * Pull a reasonable client IP from a Next.js Request. Falls back to
 * "unknown" if no IP can be inferred (those requests share a single
 * bucket, which is acceptable for a public API).
 */
export function getClientIp(req: Request): string {
  const headers = new Headers(req.headers);
  // Standard proxy chain header (Caddy, Cloudflare, etc.)
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}

/** Standard rate-limit headers to attach to every v1 response. */
export function rateLimitHeaders(r: RateLimitResult): Record<string, string> {
  const h: Record<string, string> = {
    "X-RateLimit-Limit": String(r.limit),
    "X-RateLimit-Remaining": String(r.remaining),
    "X-RateLimit-Reset": String(Math.ceil(r.resetMs / 1000)),
  };
  if (!r.ok) h["Retry-After"] = String(r.retryAfter);
  return h;
}
