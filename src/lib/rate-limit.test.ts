import { beforeEach, describe, expect, it } from "vitest";
import { clientRateKey, rateLimitAllow, resetRateLimits } from "./rate-limit";

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
