/**
 * Cloud sync for P2 gamification (XP, passport, quests, streak, explore balance).
 * Guests stay localStorage-only. Signed-in users mirror via /api/gamification.
 */

import {
  createEmptyGamification,
  gamificationHasEvidence,
  mergeGamification,
  parseGamification,
  type GamificationState,
} from "./gamification";
import {
  readExploreBalance,
  writeExploreBalance,
} from "./explore-balance";
import { readPassport, writePassport } from "./passport";
import { readQuests, writeQuests } from "./quests";
import { readStreak, writeStreak } from "./streak";
import { isSupabaseConfigured } from "./supabase/client";
import { readXp, writeXp } from "./xp";

export function readGamificationLocal(): GamificationState {
  return {
    version: 1,
    xp: readXp(),
    passport: readPassport(),
    quests: readQuests(),
    streak: readStreak(),
    exploreBalance: readExploreBalance(),
  };
}

export function writeGamificationLocal(state: GamificationState): void {
  const next = parseGamification(state);
  writeXp(next.xp);
  writePassport(next.passport);
  writeQuests(next.quests);
  writeStreak(next.streak);
  writeExploreBalance(next.exploreBalance);
}

/** Write locally and, when signed in, mirror to Supabase (best-effort). */
export async function persistGamification(
  state?: GamificationState,
): Promise<void> {
  const next = parseGamification(state ?? readGamificationLocal());
  writeGamificationLocal(next);
  if (!isSupabaseConfigured()) return;

  try {
    await fetch("/api/gamification", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: next }),
    });
  } catch {
    // Local write already succeeded; cloud sync is best-effort.
  }
}

/**
 * Load progress for the current user: merge local + cloud so empty cloud
 * never wipes richer local; seed cloud on first login; keep local in sync.
 */
export async function loadGamificationForUser(): Promise<GamificationState> {
  const local = readGamificationLocal();
  if (!isSupabaseConfigured()) return local;

  try {
    const res = await fetch("/api/gamification", { method: "GET" });
    if (res.status === 401 || res.status === 503) return local;
    if (!res.ok) return local;

    const body = (await res.json()) as {
      state?: unknown;
      empty?: boolean;
    };

    if (body.empty) {
      if (gamificationHasEvidence(local)) {
        await persistGamification(local);
      }
      return local;
    }

    const remote = parseGamification(body.state);
    const merged = mergeGamification(local, remote);
    writeGamificationLocal(merged);

    // Push merged when local contributed progress cloud lacked, or fields differ.
    if (
      gamificationHasEvidence(local) &&
      JSON.stringify(merged) !== JSON.stringify(remote)
    ) {
      try {
        await fetch("/api/gamification", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: merged }),
        });
      } catch {
        /* best-effort */
      }
    }

    return merged;
  } catch {
    return local;
  }
}

export function clearGamificationLocal(): void {
  writeGamificationLocal(createEmptyGamification());
}
