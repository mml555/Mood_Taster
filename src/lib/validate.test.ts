import { describe, expect, it } from "vitest";
import { parseAnswers } from "@/lib/validate";

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
