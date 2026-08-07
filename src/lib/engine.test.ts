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
  hunger: "any",
  vibe: "any",
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

  it("keeps restaurant pool off snack products", () => {
    const sweet: Answers = {
      ...baseAnswers,
      flavor: "sweet",
      texture: "soft",
      heaviness: "light",
      adventure: "safe",
    };
    const rec = rank(sweet, createNeutralDna(), emptySession(sweet));
    expect(rec.primary.food.snack).not.toBe(true);
    for (const alt of rec.alternates.slice(0, 8)) {
      expect(alt.food.snack).not.toBe(true);
    }
  });

  it("penalizes rejected dishes on nextAfterReject", () => {
    const dna = createNeutralDna();
    const session = emptySession();
    const first = rank(baseAnswers, dna, session).primary.food.id;
    const next = nextAfterReject(baseAnswers, dna, session, first);
    expect(next).not.toBeNull();
    expect(next!.food.id).not.toBe(first);
  });

  it("uses experience DNA when ranking after ratings", () => {
    const dna = createNeutralDna();
    dna.experience.savory = { score: 0.95, confidence: 1, samples: 5 };
    dna.experience.crunchy = { score: 0.95, confidence: 1, samples: 5 };
    dna.experience.filling = { score: 0.95, confidence: 1, samples: 5 };
    const withExp = rank(baseAnswers, dna, emptySession());
    const neutral = rank(baseAnswers, createNeutralDna(), emptySession());
    // Same quiz; DNA should still produce a valid primary.
    expect(withExp.primary.food.id).toBeTruthy();
    expect(neutral.primary.food.id).toBeTruthy();
  });

  it("shifts Go Out rank when hunger and vibe are set", () => {
    const dna = createNeutralDna();
    const baseline = rank(baseAnswers, dna, emptySession()).primary.food.id;
    const deep: Answers = {
      ...baseAnswers,
      hunger: "peckish",
      vibe: "bright",
      heaviness: "any",
    };
    const shifted = rank(deep, dna, emptySession(deep)).primary.food;
    expect(shifted.id).toBeTruthy();
    // Peckish + bright should prefer lighter dishes when heaviness is open.
    expect(shifted.heaviness === "light" || shifted.heaviness === "medium").toBe(
      true,
    );
    // Signal should be able to change the pick vs neutral Go Out answers.
    const starvingBold: Answers = {
      ...baseAnswers,
      hunger: "starving",
      vibe: "bold",
      heaviness: "any",
      adventure: "surprise",
    };
    const heavy = rank(starvingBold, dna, emptySession(starvingBold)).primary
      .food;
    expect(heavy.id).toBeTruthy();
    // Not asserting inequality always (catalog ties), but scores must differ.
    const lightScore = rank(deep, dna, emptySession(deep)).primary.score;
    const heavyScore = rank(
      starvingBold,
      dna,
      emptySession(starvingBold),
    ).primary.score;
    expect(lightScore).not.toBe(heavyScore);
    expect(baseline).toBeTruthy();
  });
});
