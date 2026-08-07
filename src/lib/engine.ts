import { RANK_FOODS } from "./catalog-data";
import { foodDimensions } from "./dna";
import { buildExplanation, matchedAttributes } from "./explain";
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

function quizMatch(answers: Answers, food: RankFood): number {
  const caresAboutTemp = answers.temperature !== "any";
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

  const withSamples = dims.filter((d) => dna[d].samples > 0);
  if (withSamples.length === 0) return 0.5;

  const mean =
    withSamples.reduce((sum, d) => {
      const entry = dna[d];
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
): { food: RankFood; score: number } {
  const q = quizMatch(answers, food);
  const d = dnaMatch(dna, food);
  const n = noveltyScore(food.id, ctx);
  const score =
    0.75 * q +
    0.2 * d +
    0.05 * n -
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

function candidatePool(answers: Answers): RankFood[] {
  if (answers.intent === "recipe") {
    return RANK_FOODS.filter((food) => food.hasRecipe);
  }
  if (answers.intent === "snack") {
    return RANK_FOODS.filter((food) => food.snack === true);
  }
  return RANK_FOODS;
}

export function rank(
  answers: Answers,
  dna: DnaProfile,
  session: SessionState,
): Recommendation {
  const pool = candidatePool(answers);

  if (pool.length < 3) {
    throw new Error(
      answers.intent === "snack"
        ? "Catalog must contain at least three snack foods"
        : answers.intent === "recipe"
          ? "Catalog must contain at least three foods with recipes"
          : "Catalog must contain at least three foods",
    );
  }

  const ctx = buildScoreContext(session);
  const scored = pool
    .map((food) => scoreOnly(food, answers, dna, ctx))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.food.id.localeCompare(b.food.id);
    });

  // Explanations are only needed for the primary (and first alternate for
  // reject-next UI). Building strings for every dish was pure waste.
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
): ScoredFood | null {
  const withReject = {
    ...session,
    rejectedIds: session.rejectedIds.includes(currentId)
      ? session.rejectedIds
      : [...session.rejectedIds, currentId],
  };
  const rec = rank(answers, dna, withReject);
  if (rec.primary.food.id === currentId) {
    const alt = rec.alternates.find((s) => s.food.id !== currentId);
    return alt ?? null;
  }
  return rec.primary;
}
