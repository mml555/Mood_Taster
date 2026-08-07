/**
 * Taste Quests (BACKLOG P2-4 / PRD §39–41).
 * Rule-generated exploration challenges. MVP completion = user confirm.
 */

import { underexploredDimensions, labelDimension } from "./dna";
import {
  foodIdForCuisine,
  unexploredCuisines,
  type Cuisine,
} from "./cuisines";
import { stampedCuisineSet, type PassportState } from "./passport";
import type { DnaDimension, DnaProfile } from "./taste-types";

export const QUESTS_KEY = "mood-taster-quests";

export const QUEST_TYPES = [
  "dimension",
  "texture",
  "passport",
  "comfort_breaker",
] as const;

export type QuestType = (typeof QUEST_TYPES)[number];
export type QuestStatus = "available" | "active" | "completed";

export type TasteQuest = {
  id: string;
  type: QuestType;
  title: string;
  description: string;
  targetDimension: DnaDimension | null;
  targetCuisine: Cuisine | null;
  status: QuestStatus;
  createdAt: string;
  completedAt: string | null;
};

export type QuestsState = {
  version: 1;
  quests: TasteQuest[];
};

export const EMPTY_QUESTS: QuestsState = { version: 1, quests: [] };

const QUEST_TYPE_SET = new Set<string>(QUEST_TYPES);

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `quest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function isQuestType(raw: unknown): raw is QuestType {
  return typeof raw === "string" && QUEST_TYPE_SET.has(raw);
}

function isStatus(raw: unknown): raw is QuestStatus {
  return raw === "available" || raw === "active" || raw === "completed";
}

function parseQuest(raw: unknown): TasteQuest | null {
  if (!raw || typeof raw !== "object") return null;
  const src = raw as Record<string, unknown>;
  if (typeof src.id !== "string" || !src.id) return null;
  if (!isQuestType(src.type)) return null;
  if (typeof src.title !== "string" || !src.title) return null;
  if (typeof src.description !== "string") return null;
  if (!isStatus(src.status)) return null;
  if (typeof src.createdAt !== "string") return null;
  return {
    id: src.id,
    type: src.type,
    title: src.title.slice(0, 80),
    description: src.description.slice(0, 160),
    targetDimension:
      typeof src.targetDimension === "string"
        ? (src.targetDimension as DnaDimension)
        : null,
    targetCuisine:
      typeof src.targetCuisine === "string"
        ? (src.targetCuisine as Cuisine)
        : null,
    status: src.status,
    createdAt: src.createdAt,
    completedAt:
      typeof src.completedAt === "string" ? src.completedAt : null,
  };
}

export function parseQuests(raw: unknown): QuestsState {
  if (!raw || typeof raw !== "object") return { ...EMPTY_QUESTS };
  const src = raw as Record<string, unknown>;
  const list = Array.isArray(src.quests) ? src.quests : [];
  const quests: TasteQuest[] = [];
  for (const item of list) {
    const q = parseQuest(item);
    if (q) quests.push(q);
  }
  return { version: 1, quests };
}

export function readQuests(): QuestsState {
  if (typeof window === "undefined") return { ...EMPTY_QUESTS };
  try {
    const raw = localStorage.getItem(QUESTS_KEY);
    if (!raw) return { ...EMPTY_QUESTS };
    return parseQuests(JSON.parse(raw) as unknown);
  } catch {
    return { ...EMPTY_QUESTS };
  }
}

export function writeQuests(state: QuestsState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUESTS_KEY, JSON.stringify(parseQuests(state)));
}

export function clearQuests(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(QUESTS_KEY);
}

function dimQuest(dim: DnaDimension, now: string): TasteQuest {
  const label = labelDimension(dim);
  return {
    id: createId(),
    type: dim === "creamy" || dim === "crunchy" || dim === "soft" || dim === "juicy"
      ? "texture"
      : "dimension",
    title: `${label} quest`,
    description: `Try something ${label.toLowerCase()}. Confirm when you do.`,
    targetDimension: dim,
    targetCuisine: null,
    status: "available",
    createdAt: now,
    completedAt: null,
  };
}

function passportQuest(cuisine: Cuisine, now: string): TasteQuest {
  return {
    id: createId(),
    type: "passport",
    title: `${cuisine} quest`,
    description: `Try ${cuisine} food. Confirm to stamp your passport.`,
    targetDimension: null,
    targetCuisine: cuisine,
    status: "available",
    createdAt: now,
    completedAt: null,
  };
}

function comfortBreakerQuest(now: string): TasteQuest {
  return {
    id: createId(),
    type: "comfort_breaker",
    title: "Comfort breaker",
    description: "Try something outside your usual picks. Confirm when you do.",
    targetDimension: "adventurous",
    targetCuisine: null,
    status: "available",
    createdAt: now,
    completedAt: null,
  };
}

/**
 * Ensure there is one available or active quest. Regenerates from DNA gaps
 * and passport holes when the queue is empty.
 */
export function ensureTodaysQuest(
  state: QuestsState,
  dna: DnaProfile,
  passport: PassportState,
  now: Date = new Date(),
): QuestsState {
  const open = state.quests.find(
    (q) => q.status === "available" || q.status === "active",
  );
  if (open) return state;

  const iso = now.toISOString();
  const under = underexploredDimensions(dna, 1);
  let quest: TasteQuest;
  if (under[0]) {
    quest = dimQuest(under[0].dimension, iso);
  } else {
    const missing = unexploredCuisines(stampedCuisineSet(passport), 8).filter(
      (c) => foodIdForCuisine(c) != null,
    );
    if (missing[0]) {
      quest = passportQuest(missing[0], iso);
    } else {
      quest = comfortBreakerQuest(iso);
    }
  }

  const next = {
    version: 1 as const,
    quests: [quest, ...state.quests].slice(0, 20),
  };
  writeQuests(next);
  return next;
}

export function activeOrAvailableQuest(
  state: QuestsState,
): TasteQuest | null {
  return (
    state.quests.find((q) => q.status === "active") ??
    state.quests.find((q) => q.status === "available") ??
    null
  );
}

export function startQuest(
  state: QuestsState,
  questId: string,
): QuestsState {
  const next = {
    version: 1 as const,
    quests: state.quests.map((q) => {
      if (q.id === questId && q.status === "available") {
        return { ...q, status: "active" as const };
      }
      if (q.status === "active" && q.id !== questId) {
        return { ...q, status: "available" as const };
      }
      return q;
    }),
  };
  writeQuests(next);
  return next;
}

export function completeQuest(
  state: QuestsState,
  questId: string,
  now: Date = new Date(),
): { state: QuestsState; quest: TasteQuest | null } {
  let completed: TasteQuest | null = null;
  const next = {
    version: 1 as const,
    quests: state.quests.map((q) => {
      if (q.id !== questId) return q;
      if (q.status !== "available" && q.status !== "active") return q;
      completed = {
        ...q,
        status: "completed",
        completedAt: now.toISOString(),
      };
      return completed;
    }),
  };
  writeQuests(next);
  return { state: next, quest: completed };
}

export function recentCompletedQuests(
  state: QuestsState,
  limit = 3,
): TasteQuest[] {
  return state.quests
    .filter((q) => q.status === "completed")
    .slice(0, limit);
}
