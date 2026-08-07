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

export function clientRateKey(request: Request, route: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    (forwarded ? forwarded.split(",")[0]?.trim() : null) ||
    request.headers.get("x-real-ip") ||
    "anon";
  return `${route}:${ip}`;
}
