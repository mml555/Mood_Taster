import type { SessionState } from "./taste-types";
import { parseAnswers } from "./validate";

export const SESSION_KEY = "mood-taster-session";

export function emptySession(answers: SessionState["answers"]): SessionState {
  return {
    answers,
    rejectedIds: [],
    servedIds: [],
  };
}

export function readSession(): SessionState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionState;
    const answers = parseAnswers(parsed?.answers);
    if (
      !answers ||
      !Array.isArray(parsed.rejectedIds) ||
      !Array.isArray(parsed.servedIds)
    ) {
      return null;
    }
    return {
      answers,
      rejectedIds: parsed.rejectedIds.filter(
        (id): id is string => typeof id === "string",
      ),
      servedIds: parsed.servedIds.filter(
        (id): id is string => typeof id === "string",
      ),
    };
  } catch {
    return null;
  }
}

export function writeSession(state: SessionState): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
}

export function markServed(state: SessionState, id: string): SessionState {
  const servedIds = state.servedIds.includes(id)
    ? state.servedIds
    : [...state.servedIds, id];
  return { ...state, servedIds };
}

export function markRejected(state: SessionState, id: string): SessionState {
  const rejectedIds = state.rejectedIds.includes(id)
    ? state.rejectedIds
    : [...state.rejectedIds, id];
  const servedIds = state.servedIds.includes(id)
    ? state.servedIds
    : [...state.servedIds, id];
  return { ...state, rejectedIds, servedIds };
}
