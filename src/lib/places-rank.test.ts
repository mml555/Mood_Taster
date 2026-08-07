import { describe, expect, it } from "vitest";
import {
  openNowFromHours,
  priceFromLevel,
  selectLabeledPlaces,
  type PlaceCandidate,
} from "@/lib/places-rank";

function place(
  overrides: Partial<PlaceCandidate> & Pick<PlaceCandidate, "name">,
): PlaceCandidate {
  return {
    address: "1 Main St",
    rating: null,
    mapsUri: null,
    miles: null,
    price: null,
    openNow: null,
    ...overrides,
  };
}

describe("priceFromLevel", () => {
  it("maps known price levels to labels", () => {
    expect(priceFromLevel("PRICE_LEVEL_INEXPENSIVE")).toBe("$");
    expect(priceFromLevel("PRICE_LEVEL_MODERATE")).toBe("$$");
    expect(priceFromLevel("PRICE_LEVEL_EXPENSIVE")).toBe("$$$");
    expect(priceFromLevel("PRICE_LEVEL_VERY_EXPENSIVE")).toBe("$$$$");
    expect(priceFromLevel("PRICE_LEVEL_FREE")).toBe("Free");
  });

  it("returns null for unknown or missing", () => {
    expect(priceFromLevel(undefined)).toBeNull();
    expect(priceFromLevel("PRICE_LEVEL_UNSPECIFIED")).toBeNull();
  });
});

describe("openNowFromHours", () => {
  it("reads boolean openNow", () => {
    expect(openNowFromHours({ openNow: true })).toBe(true);
    expect(openNowFromHours({ openNow: false })).toBe(false);
  });

  it("returns null when absent", () => {
    expect(openNowFromHours(undefined)).toBeNull();
    expect(openNowFromHours({})).toBeNull();
  });
});

describe("selectLabeledPlaces", () => {
  it("returns empty for no candidates", () => {
    expect(selectLabeledPlaces([])).toEqual([]);
  });

  it("labels a single place as best", () => {
    const out = selectLabeledPlaces([place({ name: "Solo", rating: 4.2 })]);
    expect(out).toHaveLength(1);
    expect(out[0].label).toBe("best");
    expect(out[0].name).toBe("Solo");
  });

  it("picks best by rating and closest by miles", () => {
    const out = selectLabeledPlaces([
      place({ name: "Tasty Far", rating: 4.8, miles: 3 }),
      place({ name: "Near Ok", rating: 4.1, miles: 0.4 }),
      place({ name: "Wildcard Open", rating: 4.3, miles: 1.2, openNow: true }),
    ]);
    expect(out.map((p) => p.label)).toEqual(["best", "closest", "wildcard"]);
    expect(out[0].name).toBe("Tasty Far");
    expect(out[1].name).toBe("Near Ok");
    expect(out[2].name).toBe("Wildcard Open");
  });

  it("does not duplicate best as closest", () => {
    const out = selectLabeledPlaces([
      place({ name: "Best And Near", rating: 4.9, miles: 0.2 }),
      place({ name: "Also Near", rating: 4.0, miles: 0.5 }),
      place({ name: "Far Alt", rating: 4.2, miles: 2.0, openNow: true }),
    ]);
    expect(out[0].name).toBe("Best And Near");
    expect(out[0].label).toBe("best");
    expect(out[1].name).toBe("Also Near");
    expect(out[1].label).toBe("closest");
    expect(out[2].name).toBe("Far Alt");
    expect(out[2].label).toBe("wildcard");
  });

  it("falls back to wildcard when distance is missing", () => {
    const out = selectLabeledPlaces([
      place({ name: "A", rating: 4.5 }),
      place({ name: "B", rating: 4.0 }),
    ]);
    expect(out.map((p) => ({ name: p.name, label: p.label }))).toEqual([
      { name: "A", label: "best" },
      { name: "B", label: "wildcard" },
    ]);
  });

  it("uses API order when ratings tie", () => {
    const out = selectLabeledPlaces([
      place({ name: "First", rating: 4.5, miles: 2 }),
      place({ name: "Second", rating: 4.5, miles: 1 }),
    ]);
    expect(out[0].name).toBe("First");
    expect(out[0].label).toBe("best");
    expect(out[1].name).toBe("Second");
    expect(out[1].label).toBe("closest");
  });

  it("caps at three labeled places", () => {
    const many = Array.from({ length: 8 }, (_, i) =>
      place({
        name: `P${i}`,
        rating: 5 - i * 0.1,
        miles: i + 0.1,
        openNow: i % 2 === 0,
      }),
    );
    const out = selectLabeledPlaces(many);
    expect(out).toHaveLength(3);
    expect(new Set(out.map((p) => p.name)).size).toBe(3);
  });
});
