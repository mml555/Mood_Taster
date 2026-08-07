/**
 * Flavor XP and overall taste levels (BACKLOG P2-3 / PRD §36–38).
 * XP tracks exploration depth per DNA dimension. Secondary to DNA viz.
 */

import { DNA_DIMENSIONS } from "./dna";
import type { DnaDimension, Rating } from "./taste-types";

export const XP_KEY = "mood-taster-xp";

export type XpByDimension = Record<DnaDimension, number>;

export type XpState = {
  version: 1;
  byDimension: XpByDimension;
};

export const EMPTY_XP: XpState = {
  version: 1,
  byDimension: Object.fromEntries(
    DNA_DIMENSIONS.map((d) => [d, 0]),
  ) as XpByDimension,
};

/** XP awarded per rating for each food dimension. */
export const RATING_XP: Record<Rating, number> = {
  nailed: 15,
  kinda: 8,
  nope: 3,
};

export const QUICK_BITE_XP = 5;
export const QUEST_XP = 25;

const DIM_LEVELS = [
  { min: 0, label: "Untapped" },
  { min: 15, label: "Curious" },
  { min: 40, label: "Exploring" },
  { min: 80, label: "Developed" },
  { min: 150, label: "Advanced" },
] as const;

const OVERALL_LABELS = [
  { min: 0, label: "New Taster" },
  { min: 40, label: "Getting Flavorful" },
  { min: 100, label: "Taste Explorer" },
  { min: 200, label: "Flavor Fluent" },
  { min: 350, label: "Taste Expert" },
  { min: 550, label: "Taste Master" },
] as const;

function clampXp(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(9999, Math.floor(n));
}

export function createEmptyXp(): XpState {
  return {
    version: 1,
    byDimension: { ...EMPTY_XP.byDimension },
  };
}

export function parseXp(raw: unknown): XpState {
  if (!raw || typeof raw !== "object") return createEmptyXp();
  const src = raw as Record<string, unknown>;
  const byDimension = createEmptyXp().byDimension;
  const bucket =
    src.byDimension && typeof src.byDimension === "object"
      ? (src.byDimension as Record<string, unknown>)
      : src;
  for (const dim of DNA_DIMENSIONS) {
    const n = bucket[dim];
    if (typeof n === "number") byDimension[dim] = clampXp(n);
  }
  return { version: 1, byDimension };
}

export function readXp(): XpState {
  if (typeof window === "undefined") return createEmptyXp();
  try {
    const raw = localStorage.getItem(XP_KEY);
    if (!raw) return createEmptyXp();
    return parseXp(JSON.parse(raw) as unknown);
  } catch {
    return createEmptyXp();
  }
}

export function writeXp(state: XpState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(XP_KEY, JSON.stringify(parseXp(state)));
}

export function clearXp(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(XP_KEY);
}

export function totalXp(state: XpState): number {
  return DNA_DIMENSIONS.reduce((sum, d) => sum + state.byDimension[d], 0);
}

export function dimensionLevelLabel(xp: number): string {
  let label: string = DIM_LEVELS[0].label;
  for (const tier of DIM_LEVELS) {
    if (xp >= tier.min) label = tier.label;
  }
  return label;
}

export function overallTasteLabel(state: XpState): string {
  const total = totalXp(state);
  let label: string = OVERALL_LABELS[0].label;
  for (const tier of OVERALL_LABELS) {
    if (total >= tier.min) label = tier.label;
  }
  return label;
}

/** Award XP to a set of dimensions. Returns next state + dims that leveled. */
export function awardXp(
  state: XpState,
  dimensions: readonly DnaDimension[],
  amount: number,
): { state: XpState; leveled: DnaDimension[] } {
  if (amount <= 0 || dimensions.length === 0) {
    return { state, leveled: [] };
  }
  const byDimension = { ...state.byDimension };
  const leveled: DnaDimension[] = [];
  const unique = [...new Set(dimensions)];
  for (const dim of unique) {
    const before = byDimension[dim];
    const after = clampXp(before + amount);
    byDimension[dim] = after;
    if (dimensionLevelLabel(before) !== dimensionLevelLabel(after)) {
      leveled.push(dim);
    }
  }
  return { state: { version: 1, byDimension }, leveled };
}

export function awardRatingXp(
  state: XpState,
  dimensions: readonly DnaDimension[],
  rating: Rating,
): { state: XpState; leveled: DnaDimension[]; amount: number } {
  const amount = RATING_XP[rating];
  const result = awardXp(state, dimensions, amount);
  return { ...result, amount };
}
