/**
 * Food Passport stamps (BACKLOG P2-5).
 * Stamp when user confirms a cuisine-tagged recommendation (nailed / kinda).
 */

import {
  CUISINES,
  cuisineForFood,
  isCuisine,
  type Cuisine,
} from "./cuisines";

export const PASSPORT_KEY = "mood-taster-passport";

export type PassportStamp = {
  cuisine: Cuisine;
  experiences: number;
  /** 0–1 average preference from ratings (nailed=1, kinda=0.6). */
  avgMatch: number;
  favoriteDishId: string | null;
  favoriteDishName: string | null;
  firstExploredAt: string;
  lastExploredAt: string;
};

export type PassportState = {
  version: 1;
  stamps: PassportStamp[];
};

export const EMPTY_PASSPORT: PassportState = { version: 1, stamps: [] };

export type PassportConfirmInput = {
  foodId: string;
  foodName: string;
  /** Preference weight for this try. */
  matchScore: number;
};

function isIsoDate(raw: unknown): raw is string {
  if (typeof raw !== "string" || !raw) return false;
  return Number.isFinite(Date.parse(raw));
}

function parseStamp(raw: unknown): PassportStamp | null {
  if (!raw || typeof raw !== "object") return null;
  const src = raw as Record<string, unknown>;
  if (!isCuisine(src.cuisine)) return null;
  if (typeof src.experiences !== "number" || src.experiences < 1) return null;
  if (typeof src.avgMatch !== "number") return null;
  if (!isIsoDate(src.firstExploredAt) || !isIsoDate(src.lastExploredAt)) {
    return null;
  }
  return {
    cuisine: src.cuisine,
    experiences: Math.floor(src.experiences),
    avgMatch: Math.min(1, Math.max(0, src.avgMatch)),
    favoriteDishId:
      typeof src.favoriteDishId === "string" ? src.favoriteDishId : null,
    favoriteDishName:
      typeof src.favoriteDishName === "string" ? src.favoriteDishName : null,
    firstExploredAt: src.firstExploredAt,
    lastExploredAt: src.lastExploredAt,
  };
}

export function parsePassport(raw: unknown): PassportState {
  if (!raw || typeof raw !== "object") return { ...EMPTY_PASSPORT };
  const src = raw as Record<string, unknown>;
  const list = Array.isArray(src.stamps) ? src.stamps : [];
  const stamps: PassportStamp[] = [];
  const seen = new Set<Cuisine>();
  for (const item of list) {
    const stamp = parseStamp(item);
    if (!stamp || seen.has(stamp.cuisine)) continue;
    seen.add(stamp.cuisine);
    stamps.push(stamp);
  }
  return { version: 1, stamps };
}

export function readPassport(): PassportState {
  if (typeof window === "undefined") return { ...EMPTY_PASSPORT };
  try {
    const raw = localStorage.getItem(PASSPORT_KEY);
    if (!raw) return { ...EMPTY_PASSPORT };
    return parsePassport(JSON.parse(raw) as unknown);
  } catch {
    return { ...EMPTY_PASSPORT };
  }
}

export function writePassport(state: PassportState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PASSPORT_KEY, JSON.stringify(parsePassport(state)));
}

export function clearPassport(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PASSPORT_KEY);
}

export function passportProgress(state: PassportState): {
  explored: number;
  total: number;
} {
  return { explored: state.stamps.length, total: CUISINES.length };
}

export function stampedCuisineSet(state: PassportState): Set<Cuisine> {
  return new Set(state.stamps.map((s) => s.cuisine));
}

export function getStamp(
  state: PassportState,
  cuisine: Cuisine,
): PassportStamp | null {
  return state.stamps.find((s) => s.cuisine === cuisine) ?? null;
}

/**
 * Confirm eating a cuisine-tagged dish. No-op when food has no cuisine.
 * Returns next state and whether this was a new stamp.
 */
export function confirmPassportExperience(
  state: PassportState,
  input: PassportConfirmInput,
  now: Date = new Date(),
): { state: PassportState; cuisine: Cuisine | null; isNew: boolean } {
  const cuisine = cuisineForFood(input.foodId);
  if (!cuisine) {
    return { state, cuisine: null, isNew: false };
  }

  const iso = now.toISOString();
  const matchScore = Math.min(1, Math.max(0, input.matchScore));
  const existing = getStamp(state, cuisine);

  if (!existing) {
    const stamp: PassportStamp = {
      cuisine,
      experiences: 1,
      avgMatch: matchScore,
      favoriteDishId: input.foodId,
      favoriteDishName: input.foodName,
      firstExploredAt: iso,
      lastExploredAt: iso,
    };
    const next = {
      version: 1 as const,
      stamps: [...state.stamps, stamp].sort((a, b) =>
        a.cuisine.localeCompare(b.cuisine),
      ),
    };
    writePassport(next);
    return { state: next, cuisine, isNew: true };
  }

  const experiences = existing.experiences + 1;
  const avgMatch =
    (existing.avgMatch * existing.experiences + matchScore) / experiences;
  const preferNew =
    matchScore > existing.avgMatch || !existing.favoriteDishId;
  const stamp: PassportStamp = {
    ...existing,
    experiences,
    avgMatch,
    favoriteDishId: preferNew ? input.foodId : existing.favoriteDishId,
    favoriteDishName: preferNew ? input.foodName : existing.favoriteDishName,
    lastExploredAt: iso,
  };
  const next = {
    version: 1 as const,
    stamps: state.stamps.map((s) => (s.cuisine === cuisine ? stamp : s)),
  };
  writePassport(next);
  return { state: next, cuisine, isNew: false };
}
