import { z } from "zod";
import type { Answers } from "@/lib/taste-types";

/**
 * Warms the /api/explain call while the quiz interstitial is still on screen.
 *
 * The result screen renders correct deterministic copy immediately, then swaps
 * in the warmer model copy when it lands. That swap is the problem: the model
 * takes seconds, so the line rewrites itself long after the user started
 * reading it, and the riff drops in under it. Fetching during the interstitial
 * spends that wait somewhere the user is already expecting to wait, so in the
 * common flow the result paints with the final copy and never swaps at all.
 *
 * Two layers, because both matter:
 *   inflight  a module Map, so a result mount during the prefetch awaits that
 *             request instead of firing a second one
 *   session   sessionStorage, so a reload or a back-navigation still skips it
 *
 * Pure enhancement, like the endpoint behind it. Every failure path resolves to
 * null and the caller keeps the copy it already has.
 */

const PREFIX = "mood-taster-copy:";
const TTL_MS = 5 * 60 * 1000;

const copySchema = z.object({
  why: z.string().nullable().catch(null),
  riff: z.string().nullable().catch(null),
  cookTip: z.string().nullable().catch(null),
});

export type PolishedCopy = z.infer<typeof copySchema>;

type CopyCache = PolishedCopy & { at: number };

/** Survives client navigation; cleared with the tab. */
const inflight = new Map<string, Promise<PolishedCopy | null>>();

/** Nothing usable came back. Saves callers a three-null check. */
function isEmpty(copy: PolishedCopy): boolean {
  return !copy.why && !copy.riff && !copy.cookTip;
}

export function readPrefetchedCopy(foodId: string): PolishedCopy | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PREFIX + foodId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CopyCache;
    if (typeof parsed.at !== "number" || Date.now() - parsed.at > TTL_MS) {
      return null;
    }
    const copy = copySchema.safeParse(parsed);
    if (!copy.success || isEmpty(copy.data)) return null;
    return copy.data;
  } catch {
    return null;
  }
}

function writePrefetchedCopy(foodId: string, copy: PolishedCopy): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      PREFIX + foodId,
      JSON.stringify({ ...copy, at: Date.now() } satisfies CopyCache),
    );
  } catch {
    /* quota or private mode: the live fetch still covers us */
  }
}

async function requestCopy(
  foodId: string,
  answers: Answers,
): Promise<PolishedCopy | null> {
  try {
    const res = await fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ foodId, answers }),
    });
    if (!res.ok) return null;

    const copy = copySchema.safeParse(await res.json());
    if (!copy.success || isEmpty(copy.data)) return null;

    writePrefetchedCopy(foodId, copy.data);
    return copy.data;
  } catch {
    return null;
  }
}

/**
 * Fire and forget, called the moment the match is known and before the
 * interstitial finishes. Never awaited: a slow model must not hold up the
 * navigation it is trying to get ahead of.
 */
export function prefetchCopyForFood(foodId: string, answers: Answers): void {
  if (typeof window === "undefined") return;
  if (readPrefetchedCopy(foodId) || inflight.has(foodId)) return;

  const pending = requestCopy(foodId, answers).finally(() => {
    inflight.delete(foodId);
  });
  inflight.set(foodId, pending);
}

/**
 * What the result screen calls. Returns cached copy synchronously-ish, joins an
 * in-flight prefetch, or starts its own request when the user landed here
 * without passing through the quiz.
 */
export function loadCopyForFood(
  foodId: string,
  answers: Answers,
): { cached: PolishedCopy | null; pending: Promise<PolishedCopy | null> } {
  const cached = readPrefetchedCopy(foodId);
  if (cached) return { cached, pending: Promise.resolve(cached) };

  const existing = inflight.get(foodId);
  if (existing) return { cached: null, pending: existing };

  const pending = requestCopy(foodId, answers).finally(() => {
    inflight.delete(foodId);
  });
  inflight.set(foodId, pending);
  return { cached: null, pending };
}
