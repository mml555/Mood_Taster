import {
  EMPTY_FAVORITES,
  parseFavoriteIds,
  readFavorites,
  writeFavorites,
  type FavoritesState,
} from "./favorites";
import { isSupabaseConfigured } from "./supabase/client";

/** Write favorites locally and, when signed in, mirror to Supabase. */
export async function persistFavorites(state: FavoritesState): Promise<void> {
  writeFavorites(state);
  if (!isSupabaseConfigured()) return;

  try {
    await fetch("/api/favorites", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ foodIds: state.foodIds }),
    });
  } catch {
    // Local write already succeeded; cloud sync is best-effort.
  }
}

/**
 * Load favorites for the current user: prefer cloud when signed in,
 * seed cloud from local on first login, always keep local in sync.
 */
export async function loadFavoritesForUser(): Promise<FavoritesState> {
  const local = readFavorites();
  if (!isSupabaseConfigured()) return local;

  try {
    const res = await fetch("/api/favorites", { method: "GET" });
    if (res.status === 401 || res.status === 503) return local;
    if (!res.ok) return local;

    const body = (await res.json()) as {
      foodIds?: unknown;
      empty?: boolean;
    };
    if (body.empty) {
      if (local.foodIds.length > 0) {
        await persistFavorites(local);
      }
      return local;
    }

    const foodIds = parseFavoriteIds(body.foodIds);
    const remote: FavoritesState = { foodIds };
    writeFavorites(remote);
    return remote;
  } catch {
    return local;
  }
}

export function clearFavoritesLocal(): void {
  writeFavorites(EMPTY_FAVORITES);
}
