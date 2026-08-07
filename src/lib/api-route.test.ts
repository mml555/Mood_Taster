import { afterEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import {
  failOnDbError,
  HttpError,
  readJson,
  withRoute,
  withUser,
} from "./api-route";

function post(body: string) {
  return new Request("https://example.test/api/thing", {
    method: "POST",
    body,
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("readJson", () => {
  it("returns the parsed body", async () => {
    await expect(readJson(post('{"a":1}'))).resolves.toEqual({ a: 1 });
  });

  it("gives up with a 400, not a 500, on a malformed body", async () => {
    await expect(readJson(post("{oops"))).rejects.toMatchObject({
      status: 400,
    });
  });
});

describe("failOnDbError", () => {
  it("is a no-op when there is no error", () => {
    expect(() => failOnDbError(null, "scope", "load", "nope")).not.toThrow();
  });

  it("logs the raw message but only exposes the safe one", () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      failOnDbError(
        { message: 'relation "secret_table" does not exist' },
        "dna",
        "load",
        "Could not load your Taste DNA",
      );
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect((err as HttpError).status).toBe(500);
      expect((err as HttpError).publicMessage).toBe(
        "Could not load your Taste DNA",
      );
      expect((err as HttpError).publicMessage).not.toContain("secret_table");
    }

    // Routed through reportServerError now, which logs the scope tag and the
    // error object. The raw Postgres message must still reach the log, since
    // that is the only place it is available for debugging.
    const [prefix, logging] = logged.mock.calls[0] as [string, Error];
    expect(prefix).toBe("[dna]");
    expect(logging).toBeInstanceOf(Error);
    expect(logging.message).toBe(
      'load failed: relation "secret_table" does not exist',
    );
  });
});

describe("withRoute", () => {
  it("passes a handler response through untouched", async () => {
    const handler = withRoute("test", "failed", async () =>
      NextResponse.json({ ok: true }),
    );
    const res = await handler(post("{}"));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it("maps a thrown HttpError to its status", async () => {
    const handler = withRoute("test", "failed", async () => {
      throw new HttpError(422, "Nothing matched");
    });
    const res = await handler(post("{}"));

    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toEqual({ error: "Nothing matched" });
  });

  it("logs an unexpected throw and answers with the generic message", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = withRoute("test", "failed", async () => {
      throw new Error("connection reset by peer");
    });
    const res = await handler(post("{}"));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "failed" });
    expect(logged).toHaveBeenCalled();
  });
});

describe("withUser", () => {
  it("refuses with 503 when Supabase is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    const handler = vi.fn();
    const res = await withUser("test", "failed", handler)(post("{}"));

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({
      error: "Accounts are not configured",
    });
    // The handler must never see a request it cannot serve.
    expect(handler).not.toHaveBeenCalled();
  });
});
