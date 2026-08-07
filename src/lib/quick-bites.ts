/**
 * Quick Bites: one-tap pairwise preference questions (BACKLOG P2-2).
 * Prioritize low-confidence DNA dimensions. Updates prefs + awards XP.
 */

import {
  DNA_DIMENSIONS,
  DNA_VERSION,
  labelDimension,
  type DnaDelta,
} from "./dna";
import type { DnaBucket, DnaDimension, DnaProfile } from "./taste-types";

export type QuickBiteOption = {
  dimension: DnaDimension;
  label: string;
};

export type QuickBite = {
  id: string;
  left: QuickBiteOption;
  right: QuickBiteOption;
  prompt: string;
};

const PAIRS: [DnaDimension, DnaDimension][] = [
  ["sweet", "savory"],
  ["spicy", "fresh"],
  ["crunchy", "creamy"],
  ["crunchy", "soft"],
  ["juicy", "soft"],
  ["light", "filling"],
  ["savory", "spicy"],
  ["sweet", "fresh"],
  ["creamy", "juicy"],
];

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function confidenceGap(dna: DnaProfile, dim: DnaDimension): number {
  const pref = dna.prefs[dim];
  const exp = dna.experience[dim];
  // Prefer asking where both sides are thin, or prefs are thin.
  return 1 - Math.max(pref.confidence, exp.confidence * 0.5);
}

function pairPriority(dna: DnaProfile, a: DnaDimension, b: DnaDimension): number {
  return confidenceGap(dna, a) + confidenceGap(dna, b);
}

/**
 * Pick the highest-gap pair the user has not answered this session.
 * `answeredIds` are Quick Bite ids already shown.
 */
export function nextQuickBite(
  dna: DnaProfile,
  answeredIds: ReadonlySet<string> | readonly string[] = [],
): QuickBite | null {
  const answered =
    answeredIds instanceof Set ? answeredIds : new Set(answeredIds);

  const ranked = [...PAIRS]
    .map(([left, right]) => ({
      left,
      right,
      id: `qb:${left}:${right}`,
      priority: pairPriority(dna, left, right),
    }))
    .filter((p) => !answered.has(p.id))
    .sort((a, b) => b.priority - a.priority);

  const best = ranked[0];
  if (!best || best.priority < 0.15) return null;

  return {
    id: best.id,
    left: {
      dimension: best.left,
      label: labelDimension(best.left),
    },
    right: {
      dimension: best.right,
      label: labelDimension(best.right),
    },
    prompt: "Quick Bite",
  };
}

const QUIZ_PREF_NUDGE = 0.14;

function nudgePrefs(
  bucket: DnaBucket,
  deltas: Map<DnaDimension, DnaDelta>,
  dim: DnaDimension,
  amount: number,
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
    bucket: "prefs",
  });
}

/**
 * Apply a Quick Bite choice to DNA prefs. Chosen dim up, other slightly down.
 */
export function applyQuickBite(
  dna: DnaProfile,
  bite: QuickBite,
  chosen: DnaDimension,
): { dna: DnaProfile; deltas: DnaDelta[] } {
  const other =
    bite.left.dimension === chosen
      ? bite.right.dimension
      : bite.left.dimension;
  if (
    chosen !== bite.left.dimension &&
    chosen !== bite.right.dimension
  ) {
    return { dna, deltas: [] };
  }

  const next: DnaProfile = {
    version: DNA_VERSION,
    prefs: { ...dna.prefs },
    experience: { ...dna.experience },
  };
  const deltaMap = new Map<DnaDimension, DnaDelta>();
  nudgePrefs(next.prefs, deltaMap, chosen, QUIZ_PREF_NUDGE);
  nudgePrefs(next.prefs, deltaMap, other, -QUIZ_PREF_NUDGE * 0.4);

  return { dna: next, deltas: [...deltaMap.values()] };
}

/** Lowest-confidence dimensions for Explore copy. */
export function lowConfidenceDimensions(
  dna: DnaProfile,
  limit = 3,
): DnaDimension[] {
  return [...DNA_DIMENSIONS]
    .map((dimension) => ({
      dimension,
      conf: Math.max(
        dna.prefs[dimension].confidence,
        dna.experience[dimension].confidence,
      ),
    }))
    .sort((a, b) => a.conf - b.conf)
    .slice(0, limit)
    .map((d) => d.dimension);
}
