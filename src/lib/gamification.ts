/**
 * Coherent P2 progress blob: XP, passport, quests, streak, explore balance.
 * Local modules stay the source of truth per field; this layer parses/merges
 * for cloud sync.
 */

import {
  DEFAULT_EXPLORE_BALANCE,
  parseExploreBalance,
  type ExploreBalance,
} from "./explore-balance";
import {
  EMPTY_PASSPORT,
  parsePassport,
  type PassportStamp,
  type PassportState,
} from "./passport";
import { EMPTY_QUESTS, parseQuests, type QuestsState, type TasteQuest } from "./quests";
import { EMPTY_STREAK, parseStreak, type StreakState } from "./streak";
import { createEmptyXp, parseXp, totalXp, type XpState } from "./xp";

export type GamificationState = {
  version: 1;
  xp: XpState;
  passport: PassportState;
  quests: QuestsState;
  streak: StreakState;
  exploreBalance: ExploreBalance;
};

export function createEmptyGamification(): GamificationState {
  return {
    version: 1,
    xp: createEmptyXp(),
    passport: { ...EMPTY_PASSPORT, stamps: [] },
    quests: { ...EMPTY_QUESTS, quests: [] },
    streak: { ...EMPTY_STREAK },
    exploreBalance: DEFAULT_EXPLORE_BALANCE,
  };
}

export function parseGamification(raw: unknown): GamificationState {
  if (!raw || typeof raw !== "object") return createEmptyGamification();
  const src = raw as Record<string, unknown>;
  return {
    version: 1,
    xp: parseXp(src.xp ?? src),
    passport: parsePassport(src.passport ?? { stamps: src.stamps }),
    quests: parseQuests(src.quests ?? { quests: src.questList }),
    streak: parseStreak(src.streak ?? src),
    exploreBalance: parseExploreBalance(src.exploreBalance),
  };
}

/** True when any field shows real progress (not a blank seed). */
export function gamificationHasEvidence(state: GamificationState): boolean {
  if (totalXp(state.xp) > 0) return true;
  if (state.passport.stamps.length > 0) return true;
  if (state.quests.quests.length > 0) return true;
  if (state.streak.count > 0 || state.streak.lastWeekKey) return true;
  if (state.exploreBalance !== DEFAULT_EXPLORE_BALANCE) return true;
  return false;
}

const QUEST_STATUS_RANK: Record<TasteQuest["status"], number> = {
  available: 0,
  active: 1,
  completed: 2,
};

function mergeStamp(a: PassportStamp, b: PassportStamp): PassportStamp {
  const richer =
    a.experiences > b.experiences
      ? a
      : b.experiences > a.experiences
        ? b
        : a.lastExploredAt >= b.lastExploredAt
          ? a
          : b;
  return {
    ...richer,
    experiences: Math.max(a.experiences, b.experiences),
    firstExploredAt:
      a.firstExploredAt <= b.firstExploredAt
        ? a.firstExploredAt
        : b.firstExploredAt,
    lastExploredAt:
      a.lastExploredAt >= b.lastExploredAt
        ? a.lastExploredAt
        : b.lastExploredAt,
    avgMatch: Math.max(a.avgMatch, b.avgMatch),
  };
}

function mergePassport(a: PassportState, b: PassportState): PassportState {
  const byCuisine = new Map<string, PassportStamp>();
  for (const stamp of [...a.stamps, ...b.stamps]) {
    const prev = byCuisine.get(stamp.cuisine);
    byCuisine.set(
      stamp.cuisine,
      prev ? mergeStamp(prev, stamp) : stamp,
    );
  }
  return {
    version: 1,
    stamps: [...byCuisine.values()].sort((x, y) =>
      x.cuisine.localeCompare(y.cuisine),
    ),
  };
}

function mergeQuest(a: TasteQuest, b: TasteQuest): TasteQuest {
  if (QUEST_STATUS_RANK[a.status] !== QUEST_STATUS_RANK[b.status]) {
    return QUEST_STATUS_RANK[a.status] > QUEST_STATUS_RANK[b.status] ? a : b;
  }
  if (a.completedAt && b.completedAt) {
    return a.completedAt >= b.completedAt ? a : b;
  }
  if (a.completedAt) return a;
  if (b.completedAt) return b;
  return a.createdAt <= b.createdAt ? a : b;
}

function mergeQuests(a: QuestsState, b: QuestsState): QuestsState {
  const byId = new Map<string, TasteQuest>();
  for (const quest of [...a.quests, ...b.quests]) {
    const prev = byId.get(quest.id);
    byId.set(quest.id, prev ? mergeQuest(prev, quest) : quest);
  }
  const quests = [...byId.values()].sort((x, y) =>
    y.createdAt.localeCompare(x.createdAt),
  );
  return { version: 1, quests: quests.slice(0, 20) };
}

function mergeXp(a: XpState, b: XpState): XpState {
  const byDimension = { ...a.byDimension };
  for (const dim of Object.keys(b.byDimension) as (keyof XpState["byDimension"])[]) {
    byDimension[dim] = Math.max(a.byDimension[dim] ?? 0, b.byDimension[dim] ?? 0);
  }
  return { version: 1, byDimension };
}

function mergeStreak(a: StreakState, b: StreakState): StreakState {
  if (a.count > b.count) return { ...a, version: 1 };
  if (b.count > a.count) return { ...b, version: 1 };
  const aKey = a.lastWeekKey ?? "";
  const bKey = b.lastWeekKey ?? "";
  if (aKey >= bKey) return { ...a, version: 1 };
  return { ...b, version: 1 };
}

function mergeExploreBalance(
  a: ExploreBalance,
  b: ExploreBalance,
): ExploreBalance {
  if (a === DEFAULT_EXPLORE_BALANCE && b !== DEFAULT_EXPLORE_BALANCE) return b;
  if (b === DEFAULT_EXPLORE_BALANCE && a !== DEFAULT_EXPLORE_BALANCE) return a;
  // Both default or both intentional: prefer remote (second arg) on load.
  return b;
}

/**
 * Merge local + remote so empty or poorer cloud does not wipe richer local.
 * `remote` is the second arg for explore-balance ties (cloud preference).
 */
export function mergeGamification(
  local: GamificationState,
  remote: GamificationState,
): GamificationState {
  return {
    version: 1,
    xp: mergeXp(local.xp, remote.xp),
    passport: mergePassport(local.passport, remote.passport),
    quests: mergeQuests(local.quests, remote.quests),
    streak: mergeStreak(local.streak, remote.streak),
    exploreBalance: mergeExploreBalance(
      local.exploreBalance,
      remote.exploreBalance,
    ),
  };
}
