/**
 * Adaptive quiz early-stop (BACKLOG P2-7 / PRD §15).
 * Stop when craving confidence is enough. Target 3–6 questions.
 */

import type {
  Adventure,
  Answers,
  Flavor,
  Heaviness,
  Intent,
  Texture,
} from "./taste-types";
import {
  ADVENTURE,
  FLAVORS,
  HEAVINESS,
  TEXTURES,
} from "./taste-types";

export type PartialCraving = Partial<Answers>;

/** How much of the craving we already know (0–1). */
export function cravingConfidence(answers: PartialCraving): number {
  let score = 0;
  if (answers.flavor && FLAVORS.includes(answers.flavor as Flavor)) {
    score += 0.35;
  }
  if (answers.texture && TEXTURES.includes(answers.texture as Texture)) {
    score += 0.3;
  }
  if (
    answers.heaviness &&
    HEAVINESS.includes(answers.heaviness as Heaviness)
  ) {
    score += 0.15;
  } else if (answers.heaviness === "any") {
    score += 0.05;
  }
  if (
    answers.adventure &&
    ADVENTURE.includes(answers.adventure as Adventure)
  ) {
    score += 0.2;
  }
  return Math.min(1, score);
}

/**
 * True when we can finish early.
 * Needs flavor + texture, at least 3 sensory answers (or cook effort + 2),
 * and confidence ≥ 0.75. Clue path stays fixed (pairwise).
 */
export function shouldFinishQuizEarly(
  answers: PartialCraving,
  answeredSensoryCount: number,
  intent: Intent | null,
): boolean {
  if (intent === "clue") return false;
  if (answeredSensoryCount < 3) return false;
  if (!answers.flavor || !answers.texture) return false;
  return cravingConfidence(answers) >= 0.75;
}

/**
 * Fill missing answer fields with safe defaults so rank() can run.
 * Adventure defaults to curious; heaviness to any when unset.
 */
export function fillAnswerDefaults(
  answers: PartialCraving,
  intent: Intent,
): Answers | null {
  const flavor = answers.flavor;
  const texture = answers.texture;
  if (!flavor || !FLAVORS.includes(flavor)) return null;
  if (!texture || !TEXTURES.includes(texture)) return null;

  const adventure =
    answers.adventure && ADVENTURE.includes(answers.adventure)
      ? answers.adventure
      : "curious";

  const heaviness =
    answers.heaviness === "any" ||
    (answers.heaviness &&
      HEAVINESS.includes(answers.heaviness as Heaviness))
      ? answers.heaviness
      : "any";

  return {
    intent,
    flavor,
    texture,
    heaviness,
    adventure,
    temperature: answers.temperature ?? "any",
    cookEffort:
      intent === "recipe"
        ? (answers.cookEffort ?? "fifteen")
        : (answers.cookEffort ?? "any"),
    hunger:
      intent === "restaurant"
        ? (answers.hunger ?? "any")
        : (answers.hunger ?? "any"),
    vibe:
      intent === "restaurant"
        ? (answers.vibe ?? "any")
        : (answers.vibe ?? "any"),
  };
}

/** Count of craving axes already answered (excludes intent). */
export function sensoryAnswerCount(answers: PartialCraving): number {
  let n = 0;
  if (answers.flavor) n += 1;
  if (answers.texture) n += 1;
  if (answers.heaviness) n += 1;
  if (answers.adventure) n += 1;
  if (answers.temperature && answers.temperature !== "any") n += 1;
  if (answers.cookEffort && answers.cookEffort !== "any") n += 1;
  if (answers.hunger && answers.hunger !== "any") n += 1;
  if (answers.vibe && answers.vibe !== "any") n += 1;
  return n;
}
