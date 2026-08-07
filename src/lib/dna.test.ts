import { describe, expect, it } from "vitest";
import {
  applyQuizPrefs,
  applyRating,
  createNeutralDna,
  discoveryPercent,
  foodDimensions,
  normalizeDna,
  underexploredDimensions,
} from "@/lib/dna";
import { getRankFoodById } from "@/lib/catalog-data";
import type { Answers } from "@/lib/taste-types";

const quizAnswers: Answers = {
  intent: "restaurant",
  flavor: "spicy",
  texture: "crunchy",
  heaviness: "filling",
  adventure: "surprise",
  temperature: "any",
  cookEffort: "any",
  hunger: "any",
  vibe: "any",
};

describe("dna", () => {
  it("starts neutral with zero discovery", () => {
    const dna = createNeutralDna();
    expect(dna.version).toBe(2);
    expect(discoveryPercent(dna)).toBe(0);
    expect(dna.experience.savory.score).toBe(0.5);
    expect(dna.prefs.savory.samples).toBe(0);
    expect(dna.experience.savory.samples).toBe(0);
  });

  it("foodDimensions includes flavor and texture tags", () => {
    const food = getRankFoodById("birria-tacos");
    expect(food).toBeDefined();
    const dims = foodDimensions(food!);
    expect(dims).toContain("savory");
    expect(dims).toContain("spicy");
    expect(dims).toContain("crunchy");
  });

  it("applyRating writes experience only", () => {
    const food = getRankFoodById("birria-tacos")!;
    const before = createNeutralDna();
    const { dna, deltas } = applyRating(before, food, "nailed");
    expect(dna.experience.savory.samples).toBeGreaterThan(0);
    expect(dna.experience.savory.score).toBeGreaterThan(0.5);
    expect(dna.prefs.savory.samples).toBe(0);
    expect(deltas.some((d) => d.direction === "up")).toBe(true);
    expect(deltas.every((d) => d.bucket === "experience")).toBe(true);
  });

  it("applyRating moves experience down on nope", () => {
    const food = getRankFoodById("birria-tacos")!;
    const before = createNeutralDna();
    const { dna } = applyRating(before, food, "nope");
    expect(dna.experience.savory.score).toBeLessThan(0.5);
    expect(dna.prefs.savory.score).toBe(0.5);
  });

  it("applyQuizPrefs writes prefs only", () => {
    const before = createNeutralDna();
    const { dna, deltas } = applyQuizPrefs(before, quizAnswers);
    expect(dna.prefs.spicy.samples).toBeGreaterThan(0);
    expect(dna.prefs.spicy.score).toBeGreaterThan(0.5);
    expect(dna.experience.spicy.samples).toBe(0);
    expect(deltas.every((d) => d.bucket === "prefs")).toBe(true);
  });

  it("migrates flat v1 scores into experience", () => {
    const v1 = {
      savory: { score: 0.8, confidence: 0.4, samples: 2 },
      spicy: { score: 0.7, confidence: 0.2, samples: 1 },
    };
    const dna = normalizeDna(v1);
    expect(dna.version).toBe(2);
    expect(dna.experience.savory.score).toBe(0.8);
    expect(dna.experience.savory.samples).toBe(2);
    expect(dna.prefs.savory.samples).toBe(0);
    expect(dna.experience.sweet.samples).toBe(0);
  });

  it("discoveryPercent tracks experience confidence", () => {
    const food = getRankFoodById("birria-tacos")!;
    let dna = createNeutralDna();
    expect(discoveryPercent(dna)).toBe(0);
    ({ dna } = applyRating(dna, food, "nailed"));
    expect(discoveryPercent(dna)).toBeGreaterThan(0);
  });

  it("underexploredDimensions finds high pref and low experience", () => {
    const { dna } = applyQuizPrefs(createNeutralDna(), quizAnswers);
    const gaps = underexploredDimensions(dna);
    expect(gaps.length).toBeGreaterThan(0);
    expect(gaps.some((g) => g.dimension === "spicy")).toBe(true);
    expect(gaps[0]!.experience.samples).toBeLessThan(3);
    expect(gaps[0]!.pref.score).toBeGreaterThanOrEqual(0.6);
  });
});
