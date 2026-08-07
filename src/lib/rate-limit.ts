/**
 * Soft in-memory token bucket for expensive AI routes.
 * Best-effort only: resets on cold start, shared per server instance.
 * Fail open when the bucket is exhausted so the product still degrades softly.
 */

type Bucket = {
  tokens: number;
  updatedAt: number;
};

const buckets = new Map<string, Bucket>();

const DEFAULT_CAPACITY = 20;
const DEFAULT_REFILL_PER_MS = 20 / (60_000); // 20 per minute

export function rateLimitAllow(
  key: string,
  opts?: { capacity?: number; refillPerMs?: number },
): boolean {
  const capacity = opts?.capacity ?? DEFAULT_CAPACITY;
  const refillPerMs = opts?.refillPerMs ?? DEFAULT_REFILL_PER_MS;
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing) {
    buckets.set(key, { tokens: capacity - 1, updatedAt: now });
    return true;
  }

  const elapsed = Math.max(0, now - existing.updatedAt);
  const refilled = Math.min(
    capacity,
    existing.tokens + elapsed * refillPerMs,
  );

  if (refilled < 1) {
    buckets.set(key, { tokens: refilled, updatedAt: now });
    return false;
  }

  buckets.set(key, { tokens: refilled - 1, updatedAt: now });
  return true;
}

/** Test helper. */
export function resetRateLimits(): void {
  buckets.clear();
}

/**
 * The caller's address, taking only values a client cannot set for itself.
 *
 * Vercel strips inbound `x-vercel-*` headers and writes this one itself, so it
 * is the trustworthy source and is preferred. Failing that, the proxy appends
 * the peer address to the RIGHT of `x-forwarded-for`, so the last entry is the
 * one our own edge wrote. The leftmost entry is whatever the client sent, which
 * is why reading it defeats the point: anyone could vary that header per
 * request and get a fresh bucket every time, walking a password list at the
 * login route unthrottled.
 *
 * With several trusted proxies in front of us the last entry is the innermost
 * one, so callers share a bucket and the limit gets stricter, never looser.
 */
function clientIp(request: Request): string {
  const vercel = request.headers.get("x-vercel-forwarded-for")?.trim();
  if (vercel) return vercel;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded
      .split(",")
      .map((hop) => hop.trim())
      .filter(Boolean);
    const nearest = hops[hops.length - 1];
    if (nearest) return nearest;
  }

  return request.headers.get("x-real-ip")?.trim() || "anon";
}

export function clientRateKey(request: Request, route: string): string {
  return `${route}:${clientIp(request)}`;
}
