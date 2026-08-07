import { describe, expect, it } from "vitest";
import { createNeutralDna } from "@/lib/dna";
import { nextAfterReject, rank } from "@/lib/engine";
import type { Answers, SessionState } from "@/lib/taste-types";

const baseAnswers: Answers = {
  intent: "restaurant",
  flavor: "savory",
  texture: "crunchy",
  heaviness: "filling",
  adventure: "curious",
  temperature: "any",
  cookEffort: "any",
};

function emptySession(answers: Answers = baseAnswers): SessionState {
  return { answers, rejectedIds: [], servedIds: [] };
}

describe("rank", () => {
  it("is deterministic for the same inputs", () => {
    const dna = createNeutralDna();
    const session = emptySession();
    const a = rank(baseAnswers, dna, session);
    const b = rank(baseAnswers, dna, session);
    expect(a.primary.food.id).toBe(b.primary.food.id);
    expect(a.primary.score).toBe(b.primary.score);
    expect(a.alternates.map((s) => s.food.id)).toEqual(
      b.alternates.map((s) => s.food.id),
    );
  });

  it("returns a primary with an explanation string", () => {
    const rec = rank(baseAnswers, createNeutralDna(), emptySession());
    expect(rec.primary.explanation.length).toBeGreaterThan(0);
    expect(rec.primary.matchedAttributes.length).toBeGreaterThan(0);
  });

  it("keeps recipe pool to foods with hasRecipe", () => {
    const answers: Answers = { ...baseAnswers, intent: "recipe" };
    const rec = rank(answers, createNeutralDna(), emptySession(answers));
    expect(rec.primary.food.hasRecipe).toBe(true);
    for (const alt of rec.alternates.slice(0, 5)) {
      expect(alt.food.hasRecipe).toBe(true);
    }
  });

  it("keeps snack pool to snack foods", () => {
    const answers: Answers = { ...baseAnswers, intent: "snack" };
    const rec = rank(answers, createNeutralDna(), emptySession(answers));
    expect(rec.primary.food.snack).toBe(true);
  });

  it("penalizes rejected dishes on nextAfterReject", () => {
    const dna = createNeutralDna();
    const session = emptySession();
    const first = rank(baseAnswers, dna, session).primary.food.id;
    const next = nextAfterReject(baseAnswers, dna, session, first);
    expect(next).not.toBeNull();
    expect(next!.food.id).not.toBe(first);
  });
});
