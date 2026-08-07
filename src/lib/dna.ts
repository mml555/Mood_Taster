import type {
  DnaDimension,
  DnaEntry,
  DnaProfile,
  FoodLike,
  Rating,
} from "./taste-types";

export const DNA_KEY = "mood-taster-dna";

export const DNA_DIMENSIONS: DnaDimension[] = [
  "sweet",
  "spicy",
  "savory",
  "fresh",
  "crunchy",
  "creamy",
  "juicy",
  "soft",
  "light",
  "filling",
  "adventurous",
];

export const HIT_TAGS = [
  { id: "flavor", label: "Flavor" },
  { id: "texture", label: "Texture" },
  { id: "spice", label: "Spice" },
  { id: "sweetness", label: "Sweetness" },
  { id: "portion", label: "Portion" },
  { id: "temperature", label: "Temp" },
  { id: "everything", label: "Everything" },
] as const;

export const MISS_TAGS = [
  { id: "too_spicy", label: "Too spicy" },
  { id: "too_sweet", label: "Too sweet" },
  { id: "too_salty", label: "Too salty" },
  { id: "too_sour", label: "Too sour" },
  { id: "too_heavy", label: "Too heavy" },
  { id: "too_light", label: "Too light" },
  { id: "too_bland", label: "Too bland" },
  { id: "wrong_texture", label: "Wrong texture" },
  { id: "wrong_temperature", label: "Wrong temp" },
  { id: "too_much_food", label: "Too much food" },
  { id: "not_filling", label: "Not filling" },
  { id: "wrong_cuisine", label: "Wrong cuisine" },
  { id: "not_feeling_it", label: "Not feeling it" },
] as const;

export type HitTag = (typeof HIT_TAGS)[number]["id"];
export type MissTag = (typeof MISS_TAGS)[number]["id"];

export type FeedbackDetail = {
  hit?: readonly HitTag[];
  miss?: readonly MissTag[];
};

const RATING_BASE: Record<Rating, number> = {
  nailed: 0.2,
  kinda: 0.07,
  nope: -0.12,
};

/** Extra nudge from structured tags. Kept smaller than the base rating. */
const DETAIL_NUDGE = 0.1;

const HIT_IDS = new Set<string>(HIT_TAGS.map((t) => t.id));
const MISS_IDS = new Set<string>(MISS_TAGS.map((t) => t.id));

function neutralEntry(): DnaEntry {
  return { score: 0.5, confidence: 0, samples: 0 };
}

export function createNeutralDna(): DnaProfile {
  return Object.fromEntries(
    DNA_DIMENSIONS.map((d) => [d, neutralEntry()]),
  ) as DnaProfile;
}

export function readDna(): DnaProfile {
  if (typeof window === "undefined") return createNeutralDna();
  try {
    const raw = localStorage.getItem(DNA_KEY);
    if (!raw) return createNeutralDna();
    const parsed = JSON.parse(raw) as Partial<DnaProfile>;
    const dna = createNeutralDna();
    for (const dim of DNA_DIMENSIONS) {
      const entry = parsed[dim];
      if (
        entry &&
        typeof entry.score === "number" &&
        typeof entry.confidence === "number" &&
        typeof entry.samples === "number"
      ) {
        dna[dim] = {
          score: clamp(entry.score, 0, 1),
          confidence: clamp(entry.confidence, 0, 1),
          samples: Math.max(0, Math.floor(entry.samples)),
        };
      }
    }
    return dna;
  } catch {
    return createNeutralDna();
  }
}

export function writeDna(dna: DnaProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DNA_KEY, JSON.stringify(dna));
}

export function resetDna(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DNA_KEY);
}

export function foodDimensions(food: FoodLike): DnaDimension[] {
  const dims: DnaDimension[] = [...food.flavorTags, ...food.textureTags];
  if (food.heaviness === "light" || food.heaviness === "filling") {
    dims.push(food.heaviness);
  }
  if (food.adventurousness >= 4) {
    dims.push("adventurous");
  }
  return [...new Set(dims)];
}

export type DnaDelta = {
  dimension: DnaDimension;
  before: number;
  after: number;
  direction: "up" | "down" | "flat";
};

function nudgeDimension(
  next: DnaProfile,
  deltas: Map<DnaDimension, DnaDelta>,
  dim: DnaDimension,
  amount: number,
): void {
  const entry = { ...next[dim] };
  const before = deltas.get(dim)?.before ?? entry.score;
  const learningRate = 1 / (1 + entry.samples * 0.5);
  entry.score = clamp(entry.score + amount * learningRate, 0, 1);
  entry.samples += 1;
  entry.confidence = Math.min(1, entry.samples / 5);
  next[dim] = entry;

  const change = entry.score - before;
  deltas.set(dim, {
    dimension: dim,
    before,
    after: entry.score,
    direction: change > 0.001 ? "up" : change < -0.001 ? "down" : "flat",
  });
}

function hitDimensions(food: FoodLike, tag: HitTag): DnaDimension[] {
  switch (tag) {
    case "flavor":
      return [...food.flavorTags];
    case "texture":
      return [...food.textureTags];
    case "spice":
      return ["spicy"];
    case "sweetness":
      return ["sweet"];
    case "portion":
      if (food.heaviness === "medium") return ["light", "filling"];
      return [food.heaviness === "filling" ? "filling" : "light"];
    case "temperature":
      return [];
    case "everything":
      return foodDimensions(food);
  }
}

function missDimensions(food: FoodLike, tag: MissTag): DnaDimension[] {
  switch (tag) {
    case "too_spicy":
      return ["spicy"];
    case "too_sweet":
      return ["sweet"];
    case "too_salty":
      return ["savory"];
    case "too_sour":
      return ["fresh"];
    case "too_heavy":
      return ["filling"];
    case "too_light":
      return ["light"];
    case "too_bland":
      return ["savory", "spicy", "fresh"];
    case "wrong_texture":
      return [...food.textureTags];
    case "wrong_temperature":
      return [];
    case "too_much_food":
      return ["filling"];
    case "not_filling":
      return ["light"];
    case "wrong_cuisine":
      return food.adventurousness >= 3 ? ["adventurous"] : [];
    case "not_feeling_it":
      return foodDimensions(food);
  }
}

export function parseHitTags(raw: readonly string[]): HitTag[] {
  return raw.filter((t): t is HitTag => HIT_IDS.has(t));
}

export function parseMissTags(raw: readonly string[]): MissTag[] {
  return raw.filter((t): t is MissTag => MISS_IDS.has(t));
}

export function applyRating(
  dna: DnaProfile,
  food: FoodLike,
  rating: Rating,
  detail?: FeedbackDetail,
): { dna: DnaProfile; deltas: DnaDelta[] } {
  const next: DnaProfile = { ...dna };
  const deltaMap = new Map<DnaDimension, DnaDelta>();
  const base = RATING_BASE[rating];
  const dims = foodDimensions(food);

  for (const dim of dims) {
    nudgeDimension(next, deltaMap, dim, base);
  }

  if (detail?.hit?.length) {
    const tags = detail.hit.includes("everything")
      ? (["everything"] as const)
      : detail.hit;
    for (const tag of tags) {
      for (const dim of hitDimensions(food, tag)) {
        nudgeDimension(next, deltaMap, dim, DETAIL_NUDGE);
      }
    }
  }

  if (detail?.miss?.length) {
    for (const tag of detail.miss) {
      if (tag === "not_filling") {
        nudgeDimension(next, deltaMap, "light", -DETAIL_NUDGE);
        nudgeDimension(next, deltaMap, "filling", DETAIL_NUDGE);
        continue;
      }
      if (tag === "too_heavy") {
        nudgeDimension(next, deltaMap, "filling", -DETAIL_NUDGE);
        nudgeDimension(next, deltaMap, "light", DETAIL_NUDGE);
        continue;
      }
      if (tag === "too_light") {
        nudgeDimension(next, deltaMap, "light", -DETAIL_NUDGE);
        nudgeDimension(next, deltaMap, "filling", DETAIL_NUDGE);
        continue;
      }
      if (tag === "too_bland") {
        nudgeDimension(next, deltaMap, "spicy", DETAIL_NUDGE * 0.5);
        nudgeDimension(next, deltaMap, "savory", DETAIL_NUDGE * 0.5);
        continue;
      }
      for (const dim of missDimensions(food, tag)) {
        nudgeDimension(next, deltaMap, dim, -DETAIL_NUDGE);
      }
    }
  }

  return {
    dna: next,
    deltas: [...deltaMap.values()],
  };
}

export function discoveryPercent(dna: DnaProfile): number {
  const mean =
    DNA_DIMENSIONS.reduce((sum, d) => sum + dna[d].confidence, 0) /
    DNA_DIMENSIONS.length;
  return Math.round(mean * 100);
}

export function strongestDimensions(
  dna: DnaProfile,
  filter: DnaDimension[],
  limit = 3,
): { dimension: DnaDimension; entry: DnaEntry }[] {
  return filter
    .map((dimension) => ({ dimension, entry: dna[dimension] }))
    .filter(({ entry }) => entry.samples > 0)
    .sort((a, b) => b.entry.score - a.entry.score)
    .slice(0, limit);
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function labelDimension(dim: DnaDimension): string {
  return dim.charAt(0).toUpperCase() + dim.slice(1);
}

export function formatDnaChangeLine(deltas: DnaDelta[]): string {
  const meaningful = deltas.filter((d) => d.direction !== "flat");
  if (meaningful.length === 0) {
    return "Got it. Your Taste DNA learned from this pick.";
  }
  const parts = meaningful
    .slice(0, 4)
    .map(
      (d) =>
        `${labelDimension(d.dimension)} ${d.direction === "up" ? "↑" : "↓"}`,
    );
  return `Your Taste DNA changed. ${parts.join("  ")}`;
}
