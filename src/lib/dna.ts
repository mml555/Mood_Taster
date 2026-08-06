import type {
  DnaDimension,
  DnaEntry,
  DnaProfile,
  Food,
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

const RATING_BASE: Record<Rating, number> = {
  nailed: 0.2,
  kinda: 0.07,
  nope: -0.12,
};

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

export function foodDimensions(food: Food): DnaDimension[] {
  const dims: DnaDimension[] = [
    ...food.flavorTags,
    ...food.textureTags,
  ];
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

export function applyRating(
  dna: DnaProfile,
  food: Food,
  rating: Rating,
): { dna: DnaProfile; deltas: DnaDelta[] } {
  const next: DnaProfile = { ...dna };
  const deltas: DnaDelta[] = [];
  const base = RATING_BASE[rating];
  const dims = foodDimensions(food);

  for (const dim of dims) {
    const entry = { ...dna[dim] };
    const before = entry.score;
    const learningRate = 1 / (1 + entry.samples * 0.5);
    const delta = base * learningRate;
    entry.score = clamp(entry.score + delta, 0, 1);
    entry.samples += 1;
    entry.confidence = Math.min(1, entry.samples / 5);
    next[dim] = entry;

    const change = entry.score - before;
    deltas.push({
      dimension: dim,
      before,
      after: entry.score,
      direction: change > 0.001 ? "up" : change < -0.001 ? "down" : "flat",
    });
  }

  return { dna: next, deltas };
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
