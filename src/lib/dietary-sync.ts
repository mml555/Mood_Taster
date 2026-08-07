import {
  EMPTY_DIETARY,
  hasDietaryConstraints,
  parseDietary,
  readDietary,
  writeDietary,
  type DietaryPrefs,
} from "./dietary";
import { isSupabaseConfigured } from "./supabase/client";

/** Write dietary prefs locally and, when signed in, mirror to Supabase. */
export async function persistDietary(prefs: DietaryPrefs): Promise<void> {
  writeDietary(prefs);
  if (!isSupabaseConfigured()) return;

  try {
    await fetch("/api/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        diets: prefs.diets,
        allergens: prefs.allergens,
      }),
    });
  } catch {
    // Local write already succeeded; cloud sync is best-effort.
  }
}

/**
 * Load dietary prefs for the current user: prefer cloud when signed in,
 * seed cloud from local on first login, always keep local in sync.
 * Guests stay on localStorage only.
 */
export async function loadDietaryForUser(): Promise<DietaryPrefs> {
  const local = readDietary();
  if (!isSupabaseConfigured()) return local;

  try {
    const res = await fetch("/api/preferences", { method: "GET" });
    if (res.status === 401 || res.status === 503) return local;
    if (!res.ok) return local;

    const body = (await res.json()) as {
      diets?: unknown;
      allergens?: unknown;
      empty?: boolean;
    };

    if (body.empty) {
      if (hasDietaryConstraints(local)) {
        await persistDietary(local);
      }
      return local;
    }

    const remote = parseDietary({
      diets: body.diets,
      allergens: body.allergens,
    });
    writeDietary(remote);
    return remote;
  } catch {
    return local;
  }
}

export function clearDietaryLocal(): void {
  writeDietary(EMPTY_DIETARY);
}
