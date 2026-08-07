import { describe, expect, it } from "vitest";
import {
  ANALYTICS_EVENTS,
  isAnalyticsEnabled,
  sanitizeProps,
} from "./analytics";

describe("analytics", () => {
  it("exposes the P1-6 funnel event names", () => {
    expect(ANALYTICS_EVENTS.home).toBe("home_viewed");
    expect(ANALYTICS_EVENTS.intent).toBe("intent_selected");
    expect(ANALYTICS_EVENTS.question).toBe("question_answered");
    expect(ANALYTICS_EVENTS.abandon).toBe("quiz_abandoned");
    expect(ANALYTICS_EVENTS.recommendation).toBe("recommendation_shown");
    expect(ANALYTICS_EVENTS.alternate).toBe("alternate_shown");
    expect(ANALYTICS_EVENTS.placesClick).toBe("places_clicked");
    expect(ANALYTICS_EVENTS.recipeOpen).toBe("recipe_opened");
    expect(ANALYTICS_EVENTS.feedback).toBe("feedback_submitted");
    expect(ANALYTICS_EVENTS.signupShown).toBe("signup_shown");
    expect(ANALYTICS_EVENTS.signupCompleted).toBe("signup_completed");
    expect(ANALYTICS_EVENTS.dnaUpdate).toBe("dna_updated");
  });

  it("sanitizes nulls and PII-looking keys", () => {
    expect(
      sanitizeProps({
        intent: "restaurant",
        email: "a@b.co",
        username: "mendell",
        note: "secret craving",
        step: 2,
        successful: true,
        empty: null,
        missing: undefined,
      }),
    ).toEqual({
      intent: "restaurant",
      step: 2,
      successful: true,
    });
  });

  it("reports disabled when no PostHog key is set", () => {
    expect(isAnalyticsEnabled()).toBe(false);
  });
});
