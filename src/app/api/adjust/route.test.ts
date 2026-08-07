import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimits } from "@/lib/rate-limit";
import type { Answers } from "@/lib/taste-types";

const { ask, isAiConfigured } = vi.hoisted(() => ({
  ask: vi.fn<() => Promise<string | null>>(),
  isAiConfigured: vi.fn(() => true),
}));

// Only the two provider-facing functions are faked. parseJsonObject and
// sanitizeLine stay real so the test exercises the same handling production has.
vi.mock("@/lib/ai", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/ai")>()),
  ask,
  isAiConfigured,
}));

const { POST } = await import("./route");

/** A finished Cook quiz: every axis answered, none left at "any". */
const COOK: Answers = {
  intent: "recipe",
  flavor: "savory",
  texture: "crunchy",
  heaviness: "filling",
  adventure: "curious",
  temperature: "hot",
  cookEffort: "cook",
  hunger: "any",
  vibe: "any",
};

/** A finished Go Out quiz, which answers hunger and vibe instead. */
const GO_OUT: Answers = {
  ...COOK,
  intent: "restaurant",
  temperature: "any",
  cookEffort: "any",
  hunger: "starving",
  vibe: "cozy",
};

/** What the model returns: the four axes RULES asks for, and nothing else. */
const REPLY = JSON.stringify({
  flavor: "savory",
  texture: "soft",
  heaviness: "light",
  adventure: "curious",
  note: "Lighter and softer.",
});

function adjust(answers: Answers, note = "too heavy") {
  return POST(
    new Request("https://example.test/api/adjust", {
      method: "POST",
      body: JSON.stringify({ answers, note }),
    }),
  );
}

async function adjustedAnswers(answers: Answers) {
  const res = await adjust(answers);
  expect(res.status).toBe(200);
  return ((await res.json()) as { answers: Answers | null }).answers;
}

beforeEach(() => {
  resetRateLimits();
  vi.clearAllMocks();
  isAiConfigured.mockReturnValue(true);
  ask.mockResolvedValue(REPLY);
});

describe("POST /api/adjust", () => {
  it("moves the axes the model returned", async () => {
    expect(await adjustedAnswers(COOK)).toMatchObject({
      texture: "soft",
      heaviness: "light",
    });
  });

  it("keeps the axes the model was never asked about", async () => {
    // A missing axis parses as "any", which the ranker reads as no preference,
    // so dropping these would quietly discard half the quiz.
    expect(await adjustedAnswers(COOK)).toMatchObject({
      temperature: "hot",
      cookEffort: "cook",
    });
  });

  it("keeps hunger and vibe on the Go Out path", async () => {
    expect(await adjustedAnswers(GO_OUT)).toMatchObject({
      hunger: "starving",
      vibe: "cozy",
    });
  });

  it("never lets the model flip Cook to Eat out", async () => {
    ask.mockResolvedValue(
      JSON.stringify({ ...JSON.parse(REPLY), intent: "restaurant" }),
    );

    expect(await adjustedAnswers(COOK)).toMatchObject({ intent: "recipe" });
  });

  it("returns the note alongside the answers", async () => {
    const res = await adjust(COOK);

    await expect(res.json()).resolves.toMatchObject({
      note: "Lighter and softer.",
    });
  });

  it("keeps what you had when a value is not one the engine knows", async () => {
    ask.mockResolvedValue(JSON.stringify({ ...JSON.parse(REPLY), flavor: "🌶" }));

    const res = await adjust(COOK);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ answers: null, note: null });
  });

  it("keeps what you had when no provider answered", async () => {
    ask.mockResolvedValue(null);

    await expect((await adjust(COOK)).json()).resolves.toEqual({
      answers: null,
      note: null,
    });
  });

  it("rejects a body the schema does not recognise", async () => {
    const res = await POST(
      new Request("https://example.test/api/adjust", {
        method: "POST",
        body: JSON.stringify({ answers: COOK }),
      }),
    );

    expect(res.status).toBe(400);
  });

  it("answers 400, not 500, on a malformed body", async () => {
    const res = await POST(
      new Request("https://example.test/api/adjust", {
        method: "POST",
        body: "{oops",
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid JSON body" });
  });
});
