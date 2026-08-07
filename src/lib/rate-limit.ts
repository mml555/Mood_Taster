/**
 * Rate limiting for expensive AI routes and the login path.
 *
 * Two layers. `rateLimitAllow` is an in-memory token bucket: it resets on cold
 * start and is per instance, so on serverless the effective ceiling is the
 * configured limit multiplied by however many instances happen to be warm.
 * That is fine for shedding accidental load and useless against a password
 * spray, which is why `enforceRateLimit` sits in front of it and uses a shared
 * Redis counter when one is configured.
 *
 * The shared store is optional on purpose. With no store configured the
 * behaviour is exactly what it was before, so deploying this file changes
 * nothing until UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set.
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

// ---------------------------------------------------------------------------
// Shared store (optional)
// ---------------------------------------------------------------------------

/**
 * How long a caller's counter lives, derived from the same numbers the
 * in-memory bucket uses so both layers agree on what "10 a minute" means.
 * A full bucket refills in capacity / refillPerMs milliseconds.
 */
function windowMs(capacity: number, refillPerMs: number): number {
  return Math.max(1000, Math.ceil(capacity / refillPerMs));
}

function storeConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

/** True when a shared counter backs the limiter. Surfaced for diagnostics. */
export function hasSharedRateLimitStore(): boolean {
  return storeConfig() !== null;
}

/**
 * Fixed window counter in Redis, one round trip.
 *
 * INCR then EXPIRE ... NX in a pipeline: the first request in a window creates
 * the key and stamps the TTL, and later ones only increment. Doing it in that
 * order matters. Setting the TTL unconditionally would push the expiry out on
 * every request, so a caller sending steadily would hold one window open
 * forever and never reset.
 *
 * A fixed window is coarser than the token bucket above (a caller can spend
 * their whole allowance at the very end of one window and again at the start of
 * the next). For stopping credential stuffing that is not the interesting
 * failure mode, and the simplicity buys atomicity without a Lua script.
 *
 * Returns null when the store cannot answer, which the caller reads as "fall
 * back", never as "allow".
 */
async function sharedAllow(
  key: string,
  capacity: number,
  ttlSeconds: number,
): Promise<boolean | null> {
  const config = storeConfig();
  if (!config) return null;

  try {
    const response = await fetch(`${config.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(ttlSeconds), "NX"],
      ]),
      // Short by design. This sits in the login path, so a slow store must
      // degrade to the local bucket rather than make sign-in feel broken.
      signal: AbortSignal.timeout(500),
      cache: "no-store",
    });

    if (!response.ok) return null;

    const body: unknown = await response.json();
    if (!Array.isArray(body) || body.length === 0) return null;

    const first = body[0] as { result?: unknown; error?: unknown };
    if (first?.error) return null;

    const count = Number(first?.result);
    if (!Number.isFinite(count)) return null;

    return count <= capacity;
  } catch {
    // Timeout, network failure, malformed response. Caller falls back.
    return null;
  }
}

/**
 * The limiter routes should call.
 *
 * Consults the shared counter first and falls back to the in-memory bucket
 * whenever the store is absent or unreachable, so an outage in Redis degrades
 * the limit rather than locking every caller out (or letting every caller
 * through). The local bucket is only consumed on the fallback path, which keeps
 * the two layers from double counting a single request.
 */
export async function enforceRateLimit(
  key: string,
  opts?: { capacity?: number; refillPerMs?: number },
): Promise<boolean> {
  const capacity = opts?.capacity ?? DEFAULT_CAPACITY;
  const refillPerMs = opts?.refillPerMs ?? DEFAULT_REFILL_PER_MS;

  const ttlSeconds = Math.ceil(windowMs(capacity, refillPerMs) / 1000);
  const shared = await sharedAllow(`rl:${key}`, capacity, ttlSeconds);
  if (shared !== null) return shared;

  return rateLimitAllow(key, { capacity, refillPerMs });
}
