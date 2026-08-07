import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clientRateKey,
  enforceRateLimit,
  rateLimitAllow,
  resetRateLimits,
} from "./rate-limit";

function req(headers: Record<string, string>) {
  return new Request("https://example.test/api/thing", {
    method: "POST",
    headers,
  });
}

beforeEach(() => {
  resetRateLimits();
});

describe("clientRateKey", () => {
  it("prefers the platform header the client cannot set", () => {
    const key = clientRateKey(
      req({
        "x-vercel-forwarded-for": "9.9.9.9",
        "x-forwarded-for": "1.1.1.1, 9.9.9.9",
        "x-real-ip": "2.2.2.2",
      }),
      "login",
    );

    expect(key).toBe("login:9.9.9.9");
  });

  it("reads the nearest hop, so a spoofed leading entry cannot mint buckets", () => {
    // The client sent "1.1.1.1"; our edge appended the address it actually saw.
    const spoofed = clientRateKey(
      req({ "x-forwarded-for": "1.1.1.1, 9.9.9.9" }),
      "login",
    );
    const honest = clientRateKey(req({ "x-forwarded-for": "9.9.9.9" }), "login");

    expect(spoofed).toBe("login:9.9.9.9");
    expect(spoofed).toBe(honest);
  });

  it("gives one attacker one bucket however they vary the header", () => {
    const attempt = (claimed: string) =>
      rateLimitAllow(
        clientRateKey(req({ "x-forwarded-for": `${claimed}, 9.9.9.9` }), "login"),
        { capacity: 3, refillPerMs: 0 },
      );

    expect(attempt("1.1.1.1")).toBe(true);
    expect(attempt("2.2.2.2")).toBe(true);
    expect(attempt("3.3.3.3")).toBe(true);
    // A fourth try under a fourth invented address still hits the same bucket.
    expect(attempt("4.4.4.4")).toBe(false);
  });

  it("falls back to x-real-ip, then to a shared anon bucket", () => {
    expect(clientRateKey(req({ "x-real-ip": "2.2.2.2" }), "adjust")).toBe(
      "adjust:2.2.2.2",
    );
    expect(clientRateKey(req({}), "adjust")).toBe("adjust:anon");
  });

  it("ignores empty hops rather than keying on a blank address", () => {
    expect(
      clientRateKey(req({ "x-forwarded-for": "1.1.1.1, 9.9.9.9, ," }), "adjust"),
    ).toBe("adjust:9.9.9.9");
  });

  it("keeps routes in separate buckets", () => {
    const headers = { "x-forwarded-for": "9.9.9.9" };
    expect(clientRateKey(req(headers), "login")).not.toBe(
      clientRateKey(req(headers), "adjust"),
    );
  });
});

describe("enforceRateLimit", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("falls back to the in-memory bucket when no store is configured", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    const opts = { capacity: 2, refillPerMs: 2 / 60_000 };
    expect(await enforceRateLimit("fallback", opts)).toBe(true);
    expect(await enforceRateLimit("fallback", opts)).toBe(true);
    expect(await enforceRateLimit("fallback", opts)).toBe(false);
  });

  it("uses the shared counter when one is configured", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.test/");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");

    // Third call crosses a capacity of 2.
    const counts = [1, 2, 3];
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json([{ result: counts.shift() }, { result: 1 }]),
      ),
    );

    const opts = { capacity: 2, refillPerMs: 2 / 60_000 };
    expect(await enforceRateLimit("shared", opts)).toBe(true);
    expect(await enforceRateLimit("shared", opts)).toBe(true);
    expect(await enforceRateLimit("shared", opts)).toBe(false);
  });

  it("sets the TTL only on the first request in a window", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.test/");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");

    // Typed as fetch so the recorded call's init is inspectable below.
    const spy = vi.fn<typeof fetch>(async () =>
      Response.json([{ result: 1 }, { result: 1 }]),
    );
    vi.stubGlobal("fetch", spy);

    await enforceRateLimit("ttl", { capacity: 10, refillPerMs: 10 / 60_000 });

    const init = spy.mock.calls[0]?.[1];
    const body = JSON.parse(String(init?.body));
    // NX is what stops a steady stream of requests from pushing the expiry
    // out forever and holding one window open indefinitely.
    expect(body).toEqual([
      ["INCR", "rl:ttl"],
      ["EXPIRE", "rl:ttl", "60", "NX"],
    ]);
  });

  it("degrades to the local bucket when the store is unreachable", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.test/");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );

    // A Redis outage must not lock every caller out of sign-in.
    const opts = { capacity: 2, refillPerMs: 2 / 60_000 };
    expect(await enforceRateLimit("outage", opts)).toBe(true);
    expect(await enforceRateLimit("outage", opts)).toBe(true);
    expect(await enforceRateLimit("outage", opts)).toBe(false);
  });

  it("degrades to the local bucket on a non-OK response", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.test/");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 500 })),
    );

    expect(
      await enforceRateLimit("bad-status", {
        capacity: 1,
        refillPerMs: 1 / 60_000,
      }),
    ).toBe(true);
  });

  it("degrades to the local bucket when the pipeline reports an error", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.test/");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json([{ error: "WRONGTYPE" }])),
    );

    expect(
      await enforceRateLimit("pipeline-error", {
        capacity: 1,
        refillPerMs: 1 / 60_000,
      }),
    ).toBe(true);
  });
});
