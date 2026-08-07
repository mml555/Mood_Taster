import { RANK_FOODS } from "./catalog-data";
import type { DietaryPrefs } from "./dietary";
import { EMPTY_DIETARY, passesHardConstraints } from "./dietary";
import { effectiveEntry, foodDimensions } from "./dna";
import {
  DEFAULT_EXPLORE_BALANCE,
  NOVELTY_WEIGHT,
  type ExploreBalance,
} from "./explore-balance";
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

/** Quiz + DNA weights stay fixed; novelty weight comes from explore balance. */
const QUIZ_WEIGHT = 0.75;
const DNA_WEIGHT = 0.2;

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

/** Appetite size → preferred dish weight (distinct from explicit heaviness). */
function hungerScore(hunger: Answers["hunger"], food: RankFood): number {
  if (hunger === "any") return 0.5;
  const target: Heaviness =
    hunger === "peckish"
      ? "light"
      : hunger === "starving"
        ? "filling"
        : "medium";
  return (
    1 -
    Math.abs(HEAVINESS_VALUE[target] - HEAVINESS_VALUE[food.heaviness]) / 2
  );
}

/**
 * Table vibe without new catalog fields: cozy → comfort/hot, bright →
 * lighter/cooler, bold → higher adventure.
 */
function vibeScore(vibe: Answers["vibe"], food: RankFood): number {
  if (vibe === "any") return 0.5;
  if (vibe === "cozy") {
    return (
      0.55 * adventureScore("safe", food) +
      0.45 * temperatureScore("hot", food)
    );
  }
  if (vibe === "bright") {
    return (
      0.5 * temperatureScore("cold", food) +
      0.5 * heavinessScore("light", food)
    );
  }
  return adventureScore("surprise", food);
}

function quizMatch(answers: Answers, food: RankFood): number {
  const caresAboutTemp = answers.temperature !== "any";
  const caresAboutEffort = answers.cookEffort !== "any";
  const caresAboutHunger = answers.hunger !== "any";
  const caresAboutVibe = answers.vibe !== "any";

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

  if (caresAboutHunger || caresAboutVibe) {
    const hungerW = caresAboutHunger ? (caresAboutVibe ? 0.17 : 0.22) : 0;
    const vibeW = caresAboutVibe ? (caresAboutHunger ? 0.17 : 0.22) : 0;
    const rest = 1 - hungerW - vibeW;
    return (
      rest * 0.35 * flavorScore(answers.flavor, food) +
      rest * 0.3 * textureScore(answers.texture, food) +
      rest * 0.2 * heavinessScore(answers.heaviness, food) +
      rest * 0.15 * adventureScore(answers.adventure, food) +
      hungerW * hungerScore(answers.hunger, food) +
      vibeW * vibeScore(answers.vibe, food)
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
  noveltyWeight: number,
): { food: RankFood; score: number } {
  const q = quizMatch(answers, food);
  const d = dnaMatch(dna, food);
  const n = noveltyScore(food.id, ctx);
  // Keep quiz+DNA dominant; noveltyWeight shifts Comfort ↔ Explore.
  const quizW = QUIZ_WEIGHT;
  const dnaW = DNA_WEIGHT;
  const score =
    quizW * q +
    dnaW * d +
    noveltyWeight * n +
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
  } else if (answers.intent === "restaurant") {
    // Go Out: dishes you can find nearby, not packaged snack products.
    pool = RANK_FOODS.filter((food) => food.snack !== true);
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
  exploreBalance: ExploreBalance = DEFAULT_EXPLORE_BALANCE,
): Recommendation {
  const pool = candidatePool(answers, dietary);

  if (pool.length === 0) {
    throw new NoDietaryMatchError();
  }

  const favorites = favoriteIdSet(favoriteIds);
  const ctx = buildScoreContext(session);
  const noveltyWeight = NOVELTY_WEIGHT[exploreBalance];
  const scored = pool
    .map((food) =>
      scoreOnly(food, answers, dna, ctx, favorites, noveltyWeight),
    )
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
  exploreBalance: ExploreBalance = DEFAULT_EXPLORE_BALANCE,
): ScoredFood | null {
  const withReject = {
    ...session,
    rejectedIds: session.rejectedIds.includes(currentId)
      ? session.rejectedIds
      : [...session.rejectedIds, currentId],
  };
  const rec = rank(
    answers,
    dna,
    withReject,
    dietary,
    favoriteIds,
    exploreBalance,
  );
  if (rec.primary.food.id === currentId) {
    const alt = rec.alternates.find((s) => s.food.id !== currentId);
    return alt ?? null;
  }
  return rec.primary;
}
