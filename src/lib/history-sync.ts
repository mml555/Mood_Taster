import {
  appendHistoryLocal,
  clearHistoryLocal,
  parseHistoryEntries,
  readHistory,
  removeHistoryLocal,
  setHistoryRatingLocal,
  writeHistory,
  type AppendHistoryInput,
  type HistoryEntry,
  type HistoryState,
} from "./history";
import { isSupabaseConfigured } from "./supabase/client";
import type { Rating } from "./taste-types";

async function postEntry(entry: HistoryEntry): Promise<void> {
  await fetch("/api/history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: entry.id,
      foodId: entry.foodId,
      intent: entry.intent,
      rating: entry.rating,
      answers: entry.answers,
      place: entry.place,
      createdAt: entry.createdAt,
    }),
  });
}

/** Append locally and, when signed in, mirror to Supabase. */
export async function recordRecommendationShown(
  input: AppendHistoryInput,
): Promise<HistoryEntry | null> {
  const { entry } = appendHistoryLocal(input);
  if (!entry) return null;
  if (!isSupabaseConfigured()) return entry;

  try {
    await postEntry(entry);
  } catch {
    // Local write already succeeded; cloud sync is best-effort.
  }
  return entry;
}

/**
 * Persist a rating on the newest matching pick.
 * If nothing is stored yet (race or cold open), create from context when given.
 */
export async function recordRecommendationRating(
  foodId: string,
  rating: Rating,
  context?: Omit<AppendHistoryInput, "foodId" | "rating">,
): Promise<HistoryEntry | null> {
  let { entry } = setHistoryRatingLocal(
    foodId,
    rating,
    undefined,
    context?.place,
  );
  if (!entry && context) {
    const created = appendHistoryLocal({
      foodId,
      intent: context.intent,
      answers: context.answers,
      place: context.place,
      rating,
      dedupeOpen: false,
    });
    entry = created.entry;
    if (!entry) return null;
    if (!isSupabaseConfigured()) return entry;
    try {
      await postEntry(entry);
    } catch {
      /* best-effort */
    }
    return entry;
  }
  if (!entry) return null;
  if (!isSupabaseConfigured()) return entry;

  try {
    // Upsert when place may have been backfilled; otherwise patch rating only.
    if (entry.place && context?.place) {
      await postEntry(entry);
    } else {
      await fetch("/api/history", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id, rating }),
      });
    }
  } catch {
    /* best-effort */
  }
  return entry;
}

export async function removeHistoryEntry(entryId: string): Promise<HistoryState> {
  const next = removeHistoryLocal(entryId);
  if (!isSupabaseConfigured()) return next;

  try {
    await fetch(`/api/history?id=${encodeURIComponent(entryId)}`, {
      method: "DELETE",
    });
  } catch {
    /* best-effort */
  }
  return next;
}

export async function clearHistoryEverywhere(): Promise<HistoryState> {
  const next = clearHistoryLocal();
  if (!isSupabaseConfigured()) return next;

  try {
    await fetch("/api/history?all=1", { method: "DELETE" });
  } catch {
    /* best-effort */
  }
  return next;
}

/**
 * Load history for the current user: prefer cloud when signed in,
 * seed cloud from local on first login, always keep local in sync.
 */
export async function loadHistoryForUser(): Promise<HistoryState> {
  const local = readHistory();
  if (!isSupabaseConfigured()) return local;

  try {
    const res = await fetch("/api/history", { method: "GET" });
    if (res.status === 401 || res.status === 503) return local;
    if (!res.ok) return local;

    const body = (await res.json()) as {
      entries?: unknown;
      empty?: boolean;
    };
    const remoteEntries = parseHistoryEntries(body.entries);

    if (body.empty || remoteEntries.length === 0) {
      if (local.entries.length > 0) {
        for (const entry of local.entries) {
          try {
            await postEntry(entry);
          } catch {
            /* best-effort seed */
          }
        }
      }
      return local;
    }

    const remote: HistoryState = { entries: remoteEntries };
    writeHistory(remote);
    return remote;
  } catch {
    return local;
  }
}
