import { allRankFoodIds } from "./catalog-data";
import { parseAnswers } from "./validate";
import {
  INTENTS,
  type Answers,
  type Intent,
  type NearbyPlace,
  type Rating,
} from "./taste-types";

export const HISTORY_KEY = "mood-taster-history";
export const HISTORY_CAP = 50;

export type HistoryPlaceSnapshot = {
  name: string;
  mapsUri: string | null;
};

/** Lean persisted pick for Find again. */
export type HistoryEntry = {
  id: string;
  foodId: string;
  intent: Intent;
  rating: Rating | null;
  /** Slim answers so Find again can restore craving. */
  answers: Answers | null;
  place: HistoryPlaceSnapshot | null;
  createdAt: string;
};

export type HistoryState = {
  entries: HistoryEntry[];
};

export const EMPTY_HISTORY: HistoryState = { entries: [] };

const KNOWN_IDS = new Set(allRankFoodIds());
const RATINGS = new Set<Rating>(["nailed", "kinda", "nope"]);

function isIntent(raw: unknown): raw is Intent {
  return typeof raw === "string" && (INTENTS as readonly string[]).includes(raw);
}

function isRating(raw: unknown): raw is Rating {
  return typeof raw === "string" && RATINGS.has(raw as Rating);
}

function isIsoDate(raw: unknown): raw is string {
  if (typeof raw !== "string" || !raw) return false;
  const t = Date.parse(raw);
  return Number.isFinite(t);
}

export function createHistoryId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `hist_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function snapshotPlace(
  place: NearbyPlace | null | undefined,
): HistoryPlaceSnapshot | null {
  if (!place || typeof place.name !== "string" || !place.name.trim()) {
    return null;
  }
  return {
    name: place.name.trim().slice(0, 120),
    mapsUri:
      typeof place.mapsUri === "string" && place.mapsUri
        ? place.mapsUri.slice(0, 500)
        : null,
  };
}

function parsePlace(raw: unknown): HistoryPlaceSnapshot | null {
  if (typeof raw !== "object" || raw === null) return null;
  const src = raw as Record<string, unknown>;
  if (typeof src.name !== "string" || !src.name.trim()) return null;
  return {
    name: src.name.trim().slice(0, 120),
    mapsUri:
      typeof src.mapsUri === "string" && src.mapsUri
        ? src.mapsUri.slice(0, 500)
        : null,
  };
}

export function parseHistoryEntry(raw: unknown): HistoryEntry | null {
  if (typeof raw !== "object" || raw === null) return null;
  const src = raw as Record<string, unknown>;

  if (typeof src.id !== "string" || !src.id || src.id.length > 80) return null;
  if (typeof src.foodId !== "string" || !KNOWN_IDS.has(src.foodId)) return null;
  if (!isIntent(src.intent)) return null;
  if (!isIsoDate(src.createdAt)) return null;

  const rating =
    src.rating === null || src.rating === undefined
      ? null
      : isRating(src.rating)
        ? src.rating
        : null;

  const answers =
    src.answers === null || src.answers === undefined
      ? null
      : parseAnswers(src.answers);

  return {
    id: src.id,
    foodId: src.foodId,
    intent: src.intent,
    rating,
    answers,
    place: parsePlace(src.place),
    createdAt: src.createdAt,
  };
}

/** Newest first. Drops unknown foods and caps at HISTORY_CAP. */
export function parseHistoryEntries(raw: unknown): HistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: HistoryEntry[] = [];
  for (const item of raw) {
    const entry = parseHistoryEntry(item);
    if (!entry || seen.has(entry.id)) continue;
    seen.add(entry.id);
    out.push(entry);
    if (out.length >= HISTORY_CAP) break;
  }
  return out.sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

export function parseHistory(raw: unknown): HistoryState {
  if (typeof raw !== "object" || raw === null) return EMPTY_HISTORY;
  const src = raw as Record<string, unknown>;
  return { entries: parseHistoryEntries(src.entries) };
}

export function readHistory(): HistoryState {
  if (typeof window === "undefined") return EMPTY_HISTORY;
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return EMPTY_HISTORY;
    return parseHistory(JSON.parse(raw) as unknown);
  } catch {
    return EMPTY_HISTORY;
  }
}

export function writeHistory(state: HistoryState): void {
  if (typeof window === "undefined") return;
  const next: HistoryState = {
    entries: parseHistoryEntries(state.entries).slice(0, HISTORY_CAP),
  };
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export type AppendHistoryInput = {
  foodId: string;
  intent: Intent;
  answers?: Answers | null;
  place?: NearbyPlace | HistoryPlaceSnapshot | null;
  rating?: Rating | null;
  /** Skip if the newest entry is the same food with no rating yet. */
  dedupeOpen?: boolean;
};

/**
 * Prepend a pick. Returns the new entry, or null when skipped (unknown food
 * or open duplicate).
 */
export function appendHistoryLocal(
  input: AppendHistoryInput,
  state?: HistoryState,
): { state: HistoryState; entry: HistoryEntry | null } {
  const current = state ?? readHistory();
  if (!KNOWN_IDS.has(input.foodId) || !isIntent(input.intent)) {
    return { state: current, entry: null };
  }

  if (input.dedupeOpen !== false) {
    const newest = current.entries[0];
    if (
      newest &&
      newest.foodId === input.foodId &&
      newest.rating === null
    ) {
      return { state: current, entry: null };
    }
  }

  const place =
    input.place && "address" in (input.place as NearbyPlace)
      ? snapshotPlace(input.place as NearbyPlace)
      : input.place && typeof (input.place as HistoryPlaceSnapshot).name === "string"
        ? {
            name: (input.place as HistoryPlaceSnapshot).name.trim().slice(0, 120),
            mapsUri: (input.place as HistoryPlaceSnapshot).mapsUri ?? null,
          }
        : null;

  const entry: HistoryEntry = {
    id: createHistoryId(),
    foodId: input.foodId,
    intent: input.intent,
    rating: input.rating && isRating(input.rating) ? input.rating : null,
    answers: input.answers ?? null,
    place,
    createdAt: new Date().toISOString(),
  };

  const next: HistoryState = {
    entries: [entry, ...current.entries.filter((e) => e.id !== entry.id)].slice(
      0,
      HISTORY_CAP,
    ),
  };
  writeHistory(next);
  return { state: next, entry };
}

/** Set rating on the newest matching food entry (or by id). */
export function setHistoryRatingLocal(
  foodIdOrEntryId: string,
  rating: Rating,
  state?: HistoryState,
): { state: HistoryState; entry: HistoryEntry | null } {
  if (!isRating(rating)) {
    return { state: state ?? readHistory(), entry: null };
  }
  const current = state ?? readHistory();
  const idx = current.entries.findIndex(
    (e) => e.id === foodIdOrEntryId || e.foodId === foodIdOrEntryId,
  );
  if (idx < 0) {
    return { state: current, entry: null };
  }
  const updated: HistoryEntry = { ...current.entries[idx], rating };
  const entries = [...current.entries];
  entries[idx] = updated;
  const next = { entries };
  writeHistory(next);
  return { state: next, entry: updated };
}

export function removeHistoryLocal(
  entryId: string,
  state?: HistoryState,
): HistoryState {
  const current = state ?? readHistory();
  const next: HistoryState = {
    entries: current.entries.filter((e) => e.id !== entryId),
  };
  writeHistory(next);
  return next;
}

export function clearHistoryLocal(): HistoryState {
  writeHistory(EMPTY_HISTORY);
  return EMPTY_HISTORY;
}

export function intentLabel(intent: Intent): string {
  switch (intent) {
    case "restaurant":
      return "Eat out";
    case "recipe":
      return "Cook";
    case "snack":
      return "Snack";
    case "clue":
      return "No clue";
    default:
      return intent;
  }
}

export function ratingLabel(rating: Rating | null): string | null {
  if (!rating) return null;
  switch (rating) {
    case "nailed":
      return "Loved";
    case "kinda":
      return "Kinda";
    case "nope":
      return "Nope";
    default:
      return null;
  }
}
