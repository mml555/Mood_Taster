import { describe, expect, it } from "vitest";
import { buildExceptionPayload } from "./server-errors";

const KEY = "phc_test";
const STAMP = "2026-01-01T00:00:00.000Z";

function build(err: unknown, context?: Record<string, string | number | boolean | null>) {
  return buildExceptionPayload(KEY, "match", err, context, STAMP) as {
    api_key: string;
    event: string;
    timestamp: string;
    properties: Record<string, unknown>;
  };
}

describe("buildExceptionPayload", () => {
  it("shapes an Error for PostHog issue grouping", () => {
    const payload = build(new TypeError("bad input"));

    expect(payload.api_key).toBe(KEY);
    expect(payload.event).toBe("$exception");
    expect(payload.timestamp).toBe(STAMP);
    // $exception_list is what PostHog groups issues on. Type and value must
    // live there, not only in the flat properties.
    expect(payload.properties.$exception_list).toEqual([
      {
        type: "TypeError",
        value: "bad input",
        mechanism: { handled: true, synthetic: false },
      },
    ]);
    expect(payload.properties.scope).toBe("match");
  });

  it("carries the stack when there is one", () => {
    const payload = build(new Error("boom"));
    expect(typeof payload.properties.$exception_stack_raw).toBe("string");
  });

  it("reports a thrown string rather than dropping it", () => {
    const payload = build("something went sideways");
    expect(payload.properties.$exception_type).toBe("NonErrorThrow");
    expect(payload.properties.$exception_message).toBe(
      "something went sideways",
    );
  });

  it("serializes a thrown object", () => {
    const payload = build({ code: 42 });
    expect(payload.properties.$exception_message).toBe('{"code":42}');
  });

  it("survives an unserializable throw", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(() => build(circular)).not.toThrow();
  });

  it("truncates a long message so user input cannot ride along wholesale", () => {
    const payload = build(new Error("x".repeat(900)));
    const message = payload.properties.$exception_message as string;
    expect(message.length).toBeLessThanOrEqual(503);
    expect(message.endsWith("...")).toBe(true);
  });

  it("namespaces context so it cannot shadow the event fields", () => {
    const payload = build(new Error("boom"), {
      kind: "database",
      distinct_id: "attacker",
    });

    expect(payload.properties.ctx_kind).toBe("database");
    expect(payload.properties.ctx_distinct_id).toBe("attacker");
    expect(payload.properties.distinct_id).toBe("server");
  });

  it("drops null context values", () => {
    const payload = build(new Error("boom"), { kind: null });
    expect("ctx_kind" in payload.properties).toBe(false);
  });

  it("does not attach a user identifier", () => {
    const payload = build(new Error("boom"));
    expect(payload.properties.distinct_id).toBe("server");
  });
});
