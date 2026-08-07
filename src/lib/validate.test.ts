import { describe, expect, it } from "vitest";
import { parseAnswers, parsePlaceQuery } from "@/lib/validate";

describe("parseAnswers", () => {
  it("accepts a full answers object", () => {
    const parsed = parseAnswers({
      intent: "restaurant",
      flavor: "savory",
      texture: "crunchy",
      heaviness: "filling",
      adventure: "curious",
      temperature: "any",
    });
    expect(parsed).not.toBeNull();
    expect(parsed?.temperature).toBe("any");
  });

  it("defaults missing temperature to any", () => {
    const parsed = parseAnswers({
      intent: "recipe",
      flavor: "sweet",
      texture: "soft",
      heaviness: "light",
      adventure: "safe",
    });
    expect(parsed?.temperature).toBe("any");
    expect(parsed?.hunger).toBe("any");
    expect(parsed?.vibe).toBe("any");
  });

  it("accepts Go Out hunger and vibe", () => {
    const parsed = parseAnswers({
      intent: "restaurant",
      flavor: "savory",
      texture: "crunchy",
      heaviness: "filling",
      adventure: "curious",
      temperature: "any",
      cookEffort: "any",
      hunger: "starving",
      vibe: "bold",
    });
    expect(parsed?.hunger).toBe("starving");
    expect(parsed?.vibe).toBe("bold");
  });

  it("rejects unknown flavor", () => {
    expect(
      parseAnswers({
        intent: "restaurant",
        flavor: "umami",
        texture: "crunchy",
        heaviness: "filling",
        adventure: "curious",
        temperature: "any",
      }),
    ).toBeNull();
  });
});

describe("parsePlaceQuery", () => {
  it("accepts city and ZIP strings", () => {
    expect(parsePlaceQuery("Austin, TX")).toBe("Austin, TX");
    expect(parsePlaceQuery("10001")).toBe("10001");
    expect(parsePlaceQuery("90210-1234")).toBe("90210-1234");
  });

  it("trims and collapses whitespace", () => {
    expect(parsePlaceQuery("  Brooklyn   NY  ")).toBe("Brooklyn NY");
  });

  it("rejects empty, oversized, or unsafe input", () => {
    expect(parsePlaceQuery("")).toBeNull();
    expect(parsePlaceQuery("   ")).toBeNull();
    expect(parsePlaceQuery(null)).toBeNull();
    expect(parsePlaceQuery("a".repeat(81))).toBeNull();
    expect(parsePlaceQuery("Austin<script>")).toBeNull();
    expect(parsePlaceQuery("city; DROP TABLE")).toBeNull();
  });
});
