import type {
  Answers,
  DnaBucket,
  DnaDimension,
  DnaEntry,
  DnaProfile,
  DnaProfileV1,
  FoodLike,
  Rating,
} from "./taste-types";

/**
 * Taste DNA model (v2)
 *
 * Two buckets per sensory dimension:
 * - prefs: stated taste from quiz answers (what you say you want)
 * - experience: lived taste from ratings / likes / repeats (what you actually try)
 *
 * Ranking blends them: experience leads as its confidence grows; prefs fill gaps.
 * Discovery % uses experience coverage. "Develop your taste" = high prefs, low experience.
 *
 * Migration: flat v1 profiles (one score per dim from ratings) land in experience;
 * prefs start neutral. Saves always write version 2.
 */

export const DNA_KEY = "mood-taster-dna";
export const DNA_VERSION = 2 as const;

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

/** Quiz answer → prefs nudge. Softer than a nailed rating. */
const QUIZ_PREF_NUDGE = 0.12;

const HIT_IDS = new Set<string>(HIT_TAGS.map((t) => t.id));
const MISS_IDS = new Set<string>(MISS_TAGS.map((t) => t.id));

function neutralEntry(): DnaEntry {
  return { score: 0.5, confidence: 0, samples: 0 };
}

function createNeutralBucket(): DnaBucket {
  return Object.fromEntries(
    DNA_DIMENSIONS.map((d) => [d, neutralEntry()]),
  ) as DnaBucket;
}

export function createNeutralDna(): DnaProfile {
  return {
    version: DNA_VERSION,
    prefs: createNeutralBucket(),
    experience: createNeutralBucket(),
  };
}

function isDnaEntry(value: unknown): value is DnaEntry {
  if (!value || typeof value !== "object") return false;
  const e = value as Partial<DnaEntry>;
  return (
    typeof e.score === "number" &&
    typeof e.confidence === "number" &&
    typeof e.samples === "number"
  );
}

function sanitizeEntry(entry: DnaEntry): DnaEntry {
  return {
    score: clamp(entry.score, 0, 1),
    confidence: clamp(entry.confidence, 0, 1),
    samples: Math.max(0, Math.floor(entry.samples)),
  };
}

function readBucket(source: unknown): DnaBucket {
  const bucket = createNeutralBucket();
  if (!source || typeof source !== "object") return bucket;
  const raw = source as Record<string, unknown>;
  for (const dim of DNA_DIMENSIONS) {
    if (isDnaEntry(raw[dim])) {
      bucket[dim] = sanitizeEntry(raw[dim]);
    }
  }
  return bucket;
}

function isFlatV1(raw: Record<string, unknown>): boolean {
  if (raw.version === 2 || raw.prefs || raw.experience) return false;
  return DNA_DIMENSIONS.some((dim) => isDnaEntry(raw[dim]));
}

/**
 * Accepts v2, flat v1, or partial junk. Always returns a full v2 profile.
 * Flat v1 scores came from ratings, so they migrate into experience.
 */
export function normalizeDna(raw: unknown): DnaProfile {
  if (!raw || typeof raw !== "object") return createNeutralDna();
  const source = raw as Record<string, unknown>;

  if (source.version === 2 || source.prefs || source.experience) {
    return {
      version: DNA_VERSION,
      prefs: readBucket(source.prefs),
      experience: readBucket(source.experience),
    };
  }

  if (isFlatV1(source)) {
    const experience = createNeutralBucket();
    for (const dim of DNA_DIMENSIONS) {
      if (isDnaEntry(source[dim])) {
        experience[dim] = sanitizeEntry(source[dim] as DnaEntry);
      }
    }
    return {
      version: DNA_VERSION,
      prefs: createNeutralBucket(),
      experience,
    };
  }

  return createNeutralDna();
}

/** True when either bucket has at least one sample. */
export function dnaHasEvidence(dna: DnaProfile): boolean {
  return DNA_DIMENSIONS.some(
    (d) => dna.prefs[d].samples > 0 || dna.experience[d].samples > 0,
  );
}

/**
 * Blended axis for ranking: experience leads as confidence grows;
 * prefs fill when experience is thin.
 */
export function effectiveEntry(
  dna: DnaProfile,
  dim: DnaDimension,
): DnaEntry {
  const pref = dna.prefs[dim];
  const exp = dna.experience[dim];

  if (exp.samples === 0 && pref.samples === 0) return neutralEntry();
  if (exp.samples === 0) return { ...pref };
  if (pref.samples === 0) return { ...exp };

  const w = exp.confidence;
  return {
    score: clamp(pref.score * (1 - w) + exp.score * w, 0, 1),
    confidence: Math.max(pref.confidence, exp.confidence),
    samples: pref.samples + exp.samples,
  };
}

export function readDna(): DnaProfile {
  if (typeof window === "undefined") return createNeutralDna();
  try {
    const raw = localStorage.getItem(DNA_KEY);
    if (!raw) return createNeutralDna();
    return normalizeDna(JSON.parse(raw) as unknown);
  } catch {
    return createNeutralDna();
  }
}

export function writeDna(dna: DnaProfile): void {
  if (typeof window === "undefined") return;
  const normalized = normalizeDna(dna);
  localStorage.setItem(DNA_KEY, JSON.stringify(normalized));
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
  /** Which bucket moved. Defaults to experience for rating paths. */
  bucket?: "prefs" | "experience";
};

function nudgeDimension(
  bucket: DnaBucket,
  deltas: Map<DnaDimension, DnaDelta>,
  dim: DnaDimension,
  amount: number,
  bucketName: "prefs" | "experience",
): void {
  const entry = { ...bucket[dim] };
  const before = deltas.get(dim)?.before ?? entry.score;
  const learningRate = 1 / (1 + entry.samples * 0.5);
  entry.score = clamp(entry.score + amount * learningRate, 0, 1);
  entry.samples += 1;
  entry.confidence = Math.min(1, entry.samples / 5);
  bucket[dim] = entry;

  const change = entry.score - before;
  deltas.set(dim, {
    dimension: dim,
    before,
    after: entry.score,
    direction: change > 0.001 ? "up" : change < -0.001 ? "down" : "flat",
    bucket: bucketName,
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

/** Ratings and feedback tags write to experience only. */
export function applyRating(
  dna: DnaProfile,
  food: FoodLike,
  rating: Rating,
  detail?: FeedbackDetail,
): { dna: DnaProfile; deltas: DnaDelta[] } {
  const next: DnaProfile = {
    version: DNA_VERSION,
    prefs: { ...dna.prefs },
    experience: { ...dna.experience },
  };
  const deltaMap = new Map<DnaDimension, DnaDelta>();
  const base = RATING_BASE[rating];
  const dims = foodDimensions(food);

  for (const dim of dims) {
    nudgeDimension(next.experience, deltaMap, dim, base, "experience");
  }

  if (detail?.hit?.length) {
    const tags = detail.hit.includes("everything")
      ? (["everything"] as const)
      : detail.hit;
    for (const tag of tags) {
      for (const dim of hitDimensions(food, tag)) {
        nudgeDimension(
          next.experience,
          deltaMap,
          dim,
          DETAIL_NUDGE,
          "experience",
        );
      }
    }
  }

  if (detail?.miss?.length) {
    for (const tag of detail.miss) {
      if (tag === "not_filling") {
        nudgeDimension(
          next.experience,
          deltaMap,
          "light",
          -DETAIL_NUDGE,
          "experience",
        );
        nudgeDimension(
          next.experience,
          deltaMap,
          "filling",
          DETAIL_NUDGE,
          "experience",
        );
        continue;
      }
      if (tag === "too_heavy") {
        nudgeDimension(
          next.experience,
          deltaMap,
          "filling",
          -DETAIL_NUDGE,
          "experience",
        );
        nudgeDimension(
          next.experience,
          deltaMap,
          "light",
          DETAIL_NUDGE,
          "experience",
        );
        continue;
      }
      if (tag === "too_light") {
        nudgeDimension(
          next.experience,
          deltaMap,
          "light",
          -DETAIL_NUDGE,
          "experience",
        );
        nudgeDimension(
          next.experience,
          deltaMap,
          "filling",
          DETAIL_NUDGE,
          "experience",
        );
        continue;
      }
      if (tag === "too_bland") {
        nudgeDimension(
          next.experience,
          deltaMap,
          "spicy",
          DETAIL_NUDGE * 0.5,
          "experience",
        );
        nudgeDimension(
          next.experience,
          deltaMap,
          "savory",
          DETAIL_NUDGE * 0.5,
          "experience",
        );
        continue;
      }
      for (const dim of missDimensions(food, tag)) {
        nudgeDimension(
          next.experience,
          deltaMap,
          dim,
          -DETAIL_NUDGE,
          "experience",
        );
      }
    }
  }

  return {
    dna: next,
    deltas: [...deltaMap.values()],
  };
}

/** Quiz answers write to prefs only (stated taste). */
export function applyQuizPrefs(
  dna: DnaProfile,
  answers: Answers,
): { dna: DnaProfile; deltas: DnaDelta[] } {
  const next: DnaProfile = {
    version: DNA_VERSION,
    prefs: { ...dna.prefs },
    experience: { ...dna.experience },
  };
  const deltaMap = new Map<DnaDimension, DnaDelta>();

  nudgeDimension(
    next.prefs,
    deltaMap,
    answers.flavor,
    QUIZ_PREF_NUDGE,
    "prefs",
  );
  nudgeDimension(
    next.prefs,
    deltaMap,
    answers.texture,
    QUIZ_PREF_NUDGE,
    "prefs",
  );

  if (answers.heaviness === "light" || answers.heaviness === "filling") {
    nudgeDimension(
      next.prefs,
      deltaMap,
      answers.heaviness,
      QUIZ_PREF_NUDGE,
      "prefs",
    );
  }

  if (answers.adventure === "surprise") {
    nudgeDimension(
      next.prefs,
      deltaMap,
      "adventurous",
      QUIZ_PREF_NUDGE,
      "prefs",
    );
  } else if (answers.adventure === "safe") {
    nudgeDimension(
      next.prefs,
      deltaMap,
      "adventurous",
      -QUIZ_PREF_NUDGE * 0.5,
      "prefs",
    );
  }

  return {
    dna: next,
    deltas: [...deltaMap.values()],
  };
}

/** Discovery from lived experience coverage, not stated prefs. */
export function discoveryPercent(dna: DnaProfile): number {
  const mean =
    DNA_DIMENSIONS.reduce(
      (sum, d) => sum + dna.experience[d].confidence,
      0,
    ) / DNA_DIMENSIONS.length;
  return Math.round(mean * 100);
}

export function strongestDimensions(
  dna: DnaProfile,
  filter: DnaDimension[],
  limit = 3,
  bucket: "prefs" | "experience" | "effective" = "experience",
): { dimension: DnaDimension; entry: DnaEntry }[] {
  return filter
    .map((dimension) => {
      const entry =
        bucket === "prefs"
          ? dna.prefs[dimension]
          : bucket === "experience"
            ? dna.experience[dimension]
            : effectiveEntry(dna, dimension);
      return { dimension, entry };
    })
    .filter(({ entry }) => entry.samples > 0)
    .sort((a, b) => b.entry.score - a.entry.score)
    .slice(0, limit);
}

/**
 * High stated preference, thin lived experience: develop-your-taste targets.
 * Pref score > 0.6 with samples, experience samples below threshold.
 */
export function underexploredDimensions(
  dna: DnaProfile,
  limit = 3,
): { dimension: DnaDimension; pref: DnaEntry; experience: DnaEntry }[] {
  return DNA_DIMENSIONS.map((dimension) => ({
    dimension,
    pref: dna.prefs[dimension],
    experience: dna.experience[dimension],
  }))
    .filter(
      ({ pref, experience }) =>
        pref.samples > 0 &&
        pref.score >= 0.6 &&
        experience.samples < 3,
    )
    .sort((a, b) => {
      const gapA = a.pref.score - a.experience.confidence;
      const gapB = b.pref.score - b.experience.confidence;
      return gapB - gapA;
    })
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

/** @deprecated Prefer DnaProfile; kept for migration typing only. */
export type { DnaProfileV1 };
