import { RANK_FOODS } from "./catalog-data";
import type { DietaryPrefs } from "./dietary";
import { EMPTY_DIETARY, passesHardConstraints } from "./dietary";
import { effectiveEntry, foodDimensions } from "./dna";
import { buildExplanation, matchedAttributes } from "./explain";
import { favoriteIdSet } from "./favorites";
import type {
  Adventure,
  Answers,
  DnaProfile,
  Flavor,
  Heaviness,
  RankFood,
  Recommendation,
  ScoredFood,
  SessionState,
  Temperature,
  Texture,
} from "./taste-types";

/** Soft nudge for saved foods. Matches novelty weight so quiz still leads. */
export const FAVORITE_BOOST = 0.05;

const NEAR_FLAVOR: Record<Flavor, Flavor[]> = {
  savory: ["spicy"],
  spicy: ["savory"],
  sweet: ["fresh"],
  fresh: ["sweet"],
};

const NEAR_TEXTURE: Record<Texture, Texture[]> = {
  crunchy: ["juicy"],
  juicy: ["crunchy"],
  creamy: ["soft"],
  soft: ["creamy"],
};

const HEAVINESS_VALUE: Record<Heaviness, number> = {
  light: 0,
  medium: 1,
  filling: 2,
};

const ADVENTURE_TARGET: Record<Adventure, number> = {
  safe: 1.5,
  curious: 3,
  surprise: 4.5,
};

type ScoreContext = {
  rejected: Set<string>;
  servedCounts: Map<string, number>;
  recent: Set<string>;
};

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function flavorScore(answer: Flavor, food: RankFood): number {
  if (food.flavorTags.includes(answer)) return 1;
  if (food.flavorTags.some((t) => NEAR_FLAVOR[answer].includes(t))) return 0.5;
  return 0;
}

function textureScore(answer: Texture, food: RankFood): number {
  if (food.textureTags.includes(answer)) return 1;
  if (food.textureTags.some((t) => NEAR_TEXTURE[answer].includes(t)))
    return 0.5;
  return 0;
}

function heavinessScore(
  answer: Answers["heaviness"],
  food: RankFood,
): number {
  if (answer === "any") return 0.5;
  return (
    1 -
    Math.abs(HEAVINESS_VALUE[answer] - HEAVINESS_VALUE[food.heaviness]) / 2
  );
}

function adventureScore(answer: Adventure, food: RankFood): number {
  const target = ADVENTURE_TARGET[answer];
  return 1 - Math.abs(food.adventurousness - target) / 4;
}

function temperatureScore(answer: Temperature, food: RankFood): number {
  if (answer === "any") return 0.5;
  if (food.temperature === answer) return 1;
  if (food.temperature === "room") return 0.55;
  return 0.2;
}

function effortScore(
  effort: Answers["cookEffort"],
  food: RankFood,
): number {
  if (effort === "any" || food.recipeMinutes == null) return 0.5;
  const t = food.recipeMinutes;
  if (effort === "barely") {
    if (t <= 15) return 1;
    if (t <= 25) return 0.55;
    if (t <= 40) return 0.2;
    return 0.05;
  }
  if (effort === "fifteen") {
    if (t <= 20) return 1;
    if (t <= 35) return 0.5;
    if (t <= 50) return 0.2;
    return 0.05;
  }
  // "cook": open to a real project
  if (t >= 30) return 1;
  if (t >= 15) return 0.7;
  return 0.45;
}

function quizMatch(answers: Answers, food: RankFood): number {
  const caresAboutTemp = answers.temperature !== "any";
  const caresAboutEffort = answers.cookEffort !== "any";

  if (caresAboutEffort) {
    return (
      0.28 * flavorScore(answers.flavor, food) +
      0.22 * textureScore(answers.texture, food) +
      0.15 * heavinessScore(answers.heaviness, food) +
      0.12 * adventureScore(answers.adventure, food) +
      0.23 * effortScore(answers.cookEffort, food)
    );
  }

  if (caresAboutTemp) {
    return (
      0.28 * flavorScore(answers.flavor, food) +
      0.24 * textureScore(answers.texture, food) +
      0.18 * heavinessScore(answers.heaviness, food) +
      0.15 * adventureScore(answers.adventure, food) +
      0.15 * temperatureScore(answers.temperature, food)
    );
  }
  return (
    0.35 * flavorScore(answers.flavor, food) +
    0.3 * textureScore(answers.texture, food) +
    0.2 * heavinessScore(answers.heaviness, food) +
    0.15 * adventureScore(answers.adventure, food)
  );
}

function dnaMatch(dna: DnaProfile, food: RankFood): number {
  const dims = foodDimensions(food);
  if (dims.length === 0) return 0.5;

  const withSamples = dims.filter((d) => {
    const entry = effectiveEntry(dna, d);
    return entry.samples > 0;
  });
  if (withSamples.length === 0) return 0.5;

  const mean =
    withSamples.reduce((sum, d) => {
      const entry = effectiveEntry(dna, d);
      const effective = 0.5 + (entry.score - 0.5) * entry.confidence;
      return sum + effective;
    }, 0) / withSamples.length;

  return clamp01(mean);
}

function buildScoreContext(session: SessionState): ScoreContext {
  const servedCounts = new Map<string, number>();
  for (const id of session.servedIds) {
    servedCounts.set(id, (servedCounts.get(id) ?? 0) + 1);
  }
  return {
    rejected: new Set(session.rejectedIds),
    servedCounts,
    recent: new Set(session.servedIds.slice(-5)),
  };
}

function noveltyScore(foodId: string, ctx: ScoreContext): number {
  const timesServed = ctx.servedCounts.get(foodId) ?? 0;
  return 1 - Math.min(1, timesServed / 3);
}

function rejectionPenalty(foodId: string, ctx: ScoreContext): number {
  return ctx.rejected.has(foodId) ? 0.5 : 0;
}

function recentPenalty(foodId: string, ctx: ScoreContext): number {
  return ctx.recent.has(foodId) ? 0.1 : 0;
}

function scoreOnly(
  food: RankFood,
  answers: Answers,
  dna: DnaProfile,
  ctx: ScoreContext,
  favorites: ReadonlySet<string>,
): { food: RankFood; score: number } {
  const q = quizMatch(answers, food);
  const d = dnaMatch(dna, food);
  const n = noveltyScore(food.id, ctx);
  const score =
    0.75 * q +
    0.2 * d +
    0.05 * n +
    (favorites.has(food.id) ? FAVORITE_BOOST : 0) -
    rejectionPenalty(food.id, ctx) -
    recentPenalty(food.id, ctx);

  return { food, score };
}

function withExplanation(
  scored: { food: RankFood; score: number },
  answers: Answers,
): ScoredFood {
  return {
    food: scored.food,
    score: scored.score,
    matchedAttributes: matchedAttributes(answers, scored.food),
    explanation: buildExplanation(scored.food, answers),
  };
}

function candidatePool(
  answers: Answers,
  dietary: DietaryPrefs = EMPTY_DIETARY,
): RankFood[] {
  let pool: RankFood[];
  if (answers.intent === "recipe") {
    pool = RANK_FOODS.filter((food) => food.hasRecipe);
  } else if (answers.intent === "snack") {
    pool = RANK_FOODS.filter((food) => food.snack === true);
  } else {
    pool = RANK_FOODS;
  }
  return pool.filter((food) => passesHardConstraints(food, dietary));
}

export class NoDietaryMatchError extends Error {
  constructor() {
    super("NO_DIETARY_MATCH");
    this.name = "NoDietaryMatchError";
  }
}

export function rank(
  answers: Answers,
  dna: DnaProfile,
  session: SessionState,
  dietary: DietaryPrefs = EMPTY_DIETARY,
  favoriteIds: ReadonlySet<string> | readonly string[] = [],
): Recommendation {
  const pool = candidatePool(answers, dietary);

  if (pool.length === 0) {
    throw new NoDietaryMatchError();
  }

  const favorites = favoriteIdSet(favoriteIds);
  const ctx = buildScoreContext(session);
  const scored = pool
    .map((food) => scoreOnly(food, answers, dna, ctx, favorites))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.food.id.localeCompare(b.food.id);
    });

  return {
    primary: withExplanation(scored[0], answers),
    alternates: scored.slice(1).map((s, i) =>
      i === 0
        ? withExplanation(s, answers)
        : {
            food: s.food,
            score: s.score,
            matchedAttributes: [],
            explanation: "",
          },
    ),
  };
}

export function nextAfterReject(
  answers: Answers,
  dna: DnaProfile,
  session: SessionState,
  currentId: string,
  dietary: DietaryPrefs = EMPTY_DIETARY,
  favoriteIds: ReadonlySet<string> | readonly string[] = [],
): ScoredFood | null {
  const withReject = {
    ...session,
    rejectedIds: session.rejectedIds.includes(currentId)
      ? session.rejectedIds
      : [...session.rejectedIds, currentId],
  };
  const rec = rank(answers, dna, withReject, dietary, favoriteIds);
  if (rec.primary.food.id === currentId) {
    const alt = rec.alternates.find((s) => s.food.id !== currentId);
    return alt ?? null;
  }
  return rec.primary;
}
