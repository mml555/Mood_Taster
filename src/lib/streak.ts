/**
 * Weekly Taste Streak (BACKLOG P2-6 / PRD §47).
 * Meaningful actions: feedback, quest complete, Quick Bite.
 * Not a daily forced-eating streak.
 */

export const STREAK_KEY = "mood-taster-streak";

export type StreakState = {
  version: 1;
  /** ISO week key YYYY-Www in UTC. */
  lastWeekKey: string | null;
  /** Consecutive weeks with at least one meaningful action. */
  count: number;
};

export const EMPTY_STREAK: StreakState = {
  version: 1,
  lastWeekKey: null,
  count: 0,
};

/** UTC ISO week number (Mon-based). */
export function weekKeyFromDate(date: Date = new Date()): string {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function previousWeekKey(key: string): string {
  const match = /^(\d{4})-W(\d{2})$/.exec(key);
  if (!match) return key;
  const year = Number(match[1]);
  const week = Number(match[2]);
  if (week > 1) {
    return `${year}-W${String(week - 1).padStart(2, "0")}`;
  }
  // Prior year's last ISO week ≈ 52 or 53; approximate with Dec 28.
  return weekKeyFromDate(new Date(Date.UTC(year - 1, 11, 28)));
}

export function parseStreak(raw: unknown): StreakState {
  if (!raw || typeof raw !== "object") return { ...EMPTY_STREAK };
  const src = raw as Record<string, unknown>;
  const lastWeekKey =
    typeof src.lastWeekKey === "string" && src.lastWeekKey
      ? src.lastWeekKey
      : null;
  const count =
    typeof src.count === "number" && Number.isFinite(src.count)
      ? Math.max(0, Math.floor(src.count))
      : 0;
  return { version: 1, lastWeekKey, count };
}

export function readStreak(): StreakState {
  if (typeof window === "undefined") return { ...EMPTY_STREAK };
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { ...EMPTY_STREAK };
    return parseStreak(JSON.parse(raw) as unknown);
  } catch {
    return { ...EMPTY_STREAK };
  }
}

export function writeStreak(state: StreakState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STREAK_KEY, JSON.stringify(parseStreak(state)));
}

export function clearStreak(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STREAK_KEY);
}

/**
 * Record a meaningful action. Same week is idempotent for count.
 * Consecutive weeks increment; a gap resets to 1.
 */
export function recordMeaningfulAction(
  state: StreakState = readStreak(),
  now: Date = new Date(),
): StreakState {
  const thisWeek = weekKeyFromDate(now);
  if (state.lastWeekKey === thisWeek) {
    return state;
  }

  let count = 1;
  if (state.lastWeekKey && state.lastWeekKey === previousWeekKey(thisWeek)) {
    count = state.count + 1;
  }

  const next: StreakState = {
    version: 1,
    lastWeekKey: thisWeek,
    count,
  };
  writeStreak(next);
  return next;
}

export function formatStreak(state: StreakState): string {
  if (state.count <= 0) return "No streak yet";
  if (state.count === 1) return "1-week Taste Streak";
  return `${state.count}-week Taste Streak`;
}
