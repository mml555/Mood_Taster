import { describe, expect, it } from "vitest";
import {
  awardRatingXp,
  createEmptyXp,
  dimensionLevelLabel,
  overallTasteLabel,
  parseXp,
} from "./xp";
import {
  confirmPassportExperience,
  parsePassport,
  passportProgress,
} from "./passport";
import {
  parseStreak,
  recordMeaningfulAction,
  weekKeyFromDate,
} from "./streak";
import {
  applyQuickBite,
  nextQuickBite,
} from "./quick-bites";
import { createNeutralDna } from "./dna";
import {
  cravingConfidence,
  fillAnswerDefaults,
  shouldFinishQuizEarly,
} from "./adaptive-quiz";
import { NOVELTY_WEIGHT, parseExploreBalance } from "./explore-balance";
import { cuisineForFood } from "./cuisines";
import { rank } from "./engine";
import type { Answers, SessionState } from "./taste-types";
import {
  createEmptyGamification,
  gamificationHasEvidence,
  mergeGamification,
  parseGamification,
} from "./gamification";

describe("xp", () => {
  it("awards rating XP and can change level label", () => {
    let state = createEmptyXp();
    expect(dimensionLevelLabel(state.byDimension.savory)).toBe("Untapped");
    const once = awardRatingXp(state, ["savory", "crunchy"], "nailed");
    state = once.state;
    expect(state.byDimension.savory).toBe(15);
    expect(dimensionLevelLabel(state.byDimension.savory)).toBe("Curious");
    expect(overallTasteLabel(state)).toBe("New Taster");
  });

  it("parses partial XP payloads", () => {
    const parsed = parseXp({ byDimension: { spicy: 40 } });
    expect(parsed.byDimension.spicy).toBe(40);
    expect(parsed.byDimension.sweet).toBe(0);
  });
});

describe("passport", () => {
  it("stamps cuisine from a confirmed recommendation", () => {
    const foodId = "birria-tacos";
    expect(cuisineForFood(foodId)).toBe("Mexican");
    const { state, cuisine, isNew } = confirmPassportExperience(
      parsePassport(null),
      { foodId, foodName: "Birria tacos", matchScore: 1 },
      new Date("2026-08-06T12:00:00Z"),
    );
    expect(isNew).toBe(true);
    expect(cuisine).toBe("Mexican");
    expect(passportProgress(state).explored).toBe(1);
    expect(state.stamps[0]?.favoriteDishName).toBe("Birria tacos");
  });
});

describe("streak", () => {
  it("increments across consecutive weeks", () => {
    const weekA = weekKeyFromDate(new Date("2026-08-03T12:00:00Z"));
    let state = recordMeaningfulAction(
      { version: 1, lastWeekKey: null, count: 0 },
      new Date("2026-08-03T12:00:00Z"),
    );
    expect(state.count).toBe(1);
    expect(state.lastWeekKey).toBe(weekA);

    state = recordMeaningfulAction(
      state,
      new Date("2026-08-10T12:00:00Z"),
    );
    expect(state.count).toBe(2);

    // Same week does not double-count
    const same = recordMeaningfulAction(
      state,
      new Date("2026-08-11T12:00:00Z"),
    );
    expect(same.count).toBe(2);
  });

  it("resets after a gap week", () => {
    const broken = recordMeaningfulAction(
      { version: 1, lastWeekKey: "2026-W20", count: 4 },
      new Date("2026-08-06T12:00:00Z"),
    );
    expect(broken.count).toBe(1);
  });

  it("parses empty streak", () => {
    expect(parseStreak(null).count).toBe(0);
  });
});

describe("quick bites", () => {
  it("moves a low-confidence preference dimension", () => {
    const dna = createNeutralDna();
    const bite = nextQuickBite(dna);
    expect(bite).not.toBeNull();
    const chosen = bite!.left.dimension;
    const before = dna.prefs[chosen].score;
    const { dna: next, deltas } = applyQuickBite(dna, bite!, chosen);
    expect(next.prefs[chosen].score).toBeGreaterThan(before);
    expect(next.prefs[chosen].samples).toBe(1);
    expect(deltas.some((d) => d.dimension === chosen)).toBe(true);
  });
});

describe("adaptive quiz", () => {
  it("finishes early when craving confidence is high", () => {
    const partial = {
      intent: "snack" as const,
      flavor: "savory" as const,
      texture: "crunchy" as const,
      heaviness: "filling" as const,
    };
    expect(cravingConfidence(partial)).toBeGreaterThanOrEqual(0.75);
    expect(shouldFinishQuizEarly(partial, 3, "snack")).toBe(true);
    const filled = fillAnswerDefaults(partial, "snack");
    expect(filled?.adventure).toBe("curious");
  });

  it("does not early-stop the clue path", () => {
    const partial = {
      flavor: "savory" as const,
      texture: "soft" as const,
      heaviness: "light" as const,
    };
    expect(shouldFinishQuizEarly(partial, 3, "clue")).toBe(false);
  });
});

describe("explore balance", () => {
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

  it("defaults to balanced", () => {
    expect(parseExploreBalance(null)).toBe("balanced");
    expect(NOVELTY_WEIGHT.explore).toBeGreaterThan(NOVELTY_WEIGHT.comfort);
  });

  it("explore mode favors less-served dishes vs comfort", () => {
    const dna = createNeutralDna();
    const popular = "birria-tacos";
    const session: SessionState = {
      answers: baseAnswers,
      rejectedIds: [],
      servedIds: [popular, popular, popular],
    };
    const comfort = rank(
      baseAnswers,
      dna,
      session,
      undefined,
      [],
      "comfort",
    );
    const explore = rank(
      baseAnswers,
      dna,
      session,
      undefined,
      [],
      "explore",
    );
    // Heavily served dish should score relatively worse under explore novelty.
    const comfortPopular =
      comfort.primary.food.id === popular
        ? comfort.primary
        : comfort.alternates.find((s) => s.food.id === popular);
    const explorePopular =
      explore.primary.food.id === popular
        ? explore.primary
        : explore.alternates.find((s) => s.food.id === popular);
    expect(comfortPopular && explorePopular).toBeTruthy();
    if (comfortPopular && explorePopular) {
      // Higher novelty weight penalizes repeats more in explore.
      expect(explorePopular.score).toBeLessThanOrEqual(comfortPopular.score);
    }
  });
});

describe("gamification merge", () => {
  it("parses empty payloads as blank progress", () => {
    const empty = parseGamification(null);
    expect(gamificationHasEvidence(empty)).toBe(false);
    expect(empty.exploreBalance).toBe("balanced");
  });

  it("does not let empty remote wipe richer local XP", () => {
    const local = createEmptyGamification();
    local.xp = awardRatingXp(local.xp, ["savory"], "nailed").state;
    const remote = createEmptyGamification();
    const merged = mergeGamification(local, remote);
    expect(merged.xp.byDimension.savory).toBe(15);
    expect(gamificationHasEvidence(merged)).toBe(true);
  });

  it("takes max XP per dimension across devices", () => {
    const local = createEmptyGamification();
    local.xp.byDimension.savory = 40;
    local.xp.byDimension.sweet = 8;
    const remote = createEmptyGamification();
    remote.xp.byDimension.savory = 15;
    remote.xp.byDimension.sweet = 25;
    const merged = mergeGamification(local, remote);
    expect(merged.xp.byDimension.savory).toBe(40);
    expect(merged.xp.byDimension.sweet).toBe(25);
  });

  it("unions passport stamps and keeps richer experiences", () => {
    const local = parseGamification({
      passport: {
        stamps: [
          {
            cuisine: "Mexican",
            experiences: 2,
            avgMatch: 0.8,
            favoriteDishId: "birria-tacos",
            favoriteDishName: "Birria tacos",
            firstExploredAt: "2026-01-01T00:00:00.000Z",
            lastExploredAt: "2026-02-01T00:00:00.000Z",
          },
        ],
      },
    });
    const remote = parseGamification({
      passport: {
        stamps: [
          {
            cuisine: "Mexican",
            experiences: 5,
            avgMatch: 0.9,
            favoriteDishId: "birria-tacos",
            favoriteDishName: "Birria tacos",
            firstExploredAt: "2026-03-01T00:00:00.000Z",
            lastExploredAt: "2026-04-01T00:00:00.000Z",
          },
          {
            cuisine: "Italian",
            experiences: 1,
            avgMatch: 0.7,
            favoriteDishId: "cacio-e-pepe",
            favoriteDishName: "Cacio e pepe",
            firstExploredAt: "2026-05-01T00:00:00.000Z",
            lastExploredAt: "2026-05-01T00:00:00.000Z",
          },
        ],
      },
    });
    const merged = mergeGamification(local, remote);
    expect(merged.passport.stamps).toHaveLength(2);
    const mexican = merged.passport.stamps.find((s) => s.cuisine === "Mexican");
    expect(mexican?.experiences).toBe(5);
    expect(mexican?.firstExploredAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("prefers non-default explore balance when the other side is default", () => {
    const local = createEmptyGamification();
    local.exploreBalance = "explore";
    const remote = createEmptyGamification();
    expect(mergeGamification(local, remote).exploreBalance).toBe("explore");
    expect(mergeGamification(remote, local).exploreBalance).toBe("explore");
  });

  it("keeps the higher weekly streak count", () => {
    const local = createEmptyGamification();
    local.streak = { version: 1, lastWeekKey: "2026-W30", count: 3 };
    const remote = createEmptyGamification();
    remote.streak = { version: 1, lastWeekKey: "2026-W31", count: 1 };
    expect(mergeGamification(local, remote).streak.count).toBe(3);
  });
});
