import { describe, expect, it } from "vitest";
import {
  applyRating,
  createNeutralDna,
  discoveryPercent,
  foodDimensions,
} from "@/lib/dna";
import { getRankFoodById } from "@/lib/catalog-data";

describe("dna", () => {
  it("starts neutral with zero discovery", () => {
    const dna = createNeutralDna();
    expect(discoveryPercent(dna)).toBe(0);
    expect(dna.savory.score).toBe(0.5);
    expect(dna.savory.samples).toBe(0);
  });

  it("foodDimensions includes flavor and texture tags", () => {
    const food = getRankFoodById("birria-tacos");
    expect(food).toBeDefined();
    const dims = foodDimensions(food!);
    expect(dims).toContain("savory");
    expect(dims).toContain("spicy");
    expect(dims).toContain("crunchy");
  });

  it("applyRating moves scores on nailed", () => {
    const food = getRankFoodById("birria-tacos")!;
    const before = createNeutralDna();
    const { dna, deltas } = applyRating(before, food, "nailed");
    expect(dna.savory.samples).toBeGreaterThan(0);
    expect(dna.savory.score).toBeGreaterThan(0.5);
    expect(deltas.some((d) => d.direction === "up")).toBe(true);
  });

  it("applyRating moves scores down on nope", () => {
    const food = getRankFoodById("birria-tacos")!;
    const before = createNeutralDna();
    const { dna } = applyRating(before, food, "nope");
    expect(dna.savory.score).toBeLessThan(0.5);
  });
});
