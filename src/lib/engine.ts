import { CATALOG } from "./catalog";
import { foodDimensions } from "./dna";
import { buildExplanation, matchedAttributes } from "./explain";
import type {
  Adventure,
  Answers,
  DnaProfile,
  Flavor,
  Food,
  Heaviness,
  Recommendation,
  ScoredFood,
  SessionState,
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

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function flavorScore(answer: Flavor, food: Food): number {
  if (food.flavorTags.includes(answer)) return 1;
  if (food.flavorTags.some((t) => NEAR_FLAVOR[answer].includes(t))) return 0.5;
  return 0;
}

function textureScore(answer: Texture, food: Food): number {
  if (food.textureTags.includes(answer)) return 1;
  if (food.textureTags.some((t) => NEAR_TEXTURE[answer].includes(t)))
    return 0.5;
  return 0;
}

function heavinessScore(
  answer: Answers["heaviness"],
  food: Food,
): number {
  if (answer === "any") return 0.5;
  return 1 - Math.abs(HEAVINESS_VALUE[answer] - HEAVINESS_VALUE[food.heaviness]) / 2;
}

function adventureScore(answer: Adventure, food: Food): number {
  const target = ADVENTURE_TARGET[answer];
  return 1 - Math.abs(food.adventurousness - target) / 4;
}

function quizMatch(answers: Answers, food: Food): number {
  return (
    0.35 * flavorScore(answers.flavor, food) +
    0.3 * textureScore(answers.texture, food) +
    0.2 * heavinessScore(answers.heaviness, food) +
    0.15 * adventureScore(answers.adventure, food)
  );
}

function dnaMatch(dna: DnaProfile, food: Food): number {
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

function noveltyScore(foodId: string, session: SessionState): number {
  const timesServed = session.servedIds.filter((id) => id === foodId).length;
  return 1 - Math.min(1, timesServed / 3);
}

function rejectionPenalty(foodId: string, session: SessionState): number {
  return session.rejectedIds.includes(foodId) ? 0.5 : 0;
}

function recentPenalty(foodId: string, session: SessionState): number {
  const recent = session.servedIds.slice(-5);
  return recent.includes(foodId) ? 0.1 : 0;
}

function scoreFood(
  food: Food,
  answers: Answers,
  dna: DnaProfile,
  session: SessionState,
): ScoredFood {
  const q = quizMatch(answers, food);
  const d = dnaMatch(dna, food);
  const n = noveltyScore(food.id, session);
  const score =
    0.75 * q +
    0.2 * d +
    0.05 * n -
    rejectionPenalty(food.id, session) -
    recentPenalty(food.id, session);

  return {
    food,
    score,
    matchedAttributes: matchedAttributes(answers, food),
    explanation: buildExplanation(food, answers),
  };
}

export function rank(
  answers: Answers,
  dna: DnaProfile,
  session: SessionState,
): Recommendation {
  const pool =
    answers.intent === "recipe"
      ? CATALOG.filter((food) => food.recipe != null)
      : CATALOG;

  if (pool.length < 3) {
    throw new Error(
      answers.intent === "recipe"
        ? "Catalog must contain at least three foods with recipes"
        : "Catalog must contain at least three foods",
    );
  }

  const scored = pool
    .map((food) => scoreFood(food, answers, dna, session))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.food.id.localeCompare(b.food.id);
    });

  return {
    primary: scored[0],
    alternates: scored.slice(1),
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
