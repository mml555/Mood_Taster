import {
  ADVENTURE,
  FLAVORS,
  HEAVINESS,
  TEXTURES,
  type Adventure,
  type Answers,
  type Flavor,
  type Heaviness,
  type Texture,
} from "./taste-types";

/**
 * Request bodies and query params are external input. Everything here returns
 * null on anything unexpected rather than throwing, so callers answer with a
 * 400 instead of a 500.
 */

function oneOf<T extends string>(
  values: readonly T[],
  raw: unknown,
): T | null {
  return typeof raw === "string" && (values as readonly string[]).includes(raw)
    ? (raw as T)
    : null;
}

export function parseAnswers(raw: unknown): Answers | null {
  if (typeof raw !== "object" || raw === null) return null;
  const src = raw as Record<string, unknown>;

  const flavor = oneOf<Flavor>(FLAVORS, src.flavor);
  const texture = oneOf<Texture>(TEXTURES, src.texture);
  const adventure = oneOf<Adventure>(ADVENTURE, src.adventure);

  const heaviness =
    src.heaviness === "any"
      ? ("any" as const)
      : oneOf<Heaviness>(HEAVINESS, src.heaviness);

  if (!flavor || !texture || !adventure || !heaviness) return null;

  return { flavor, texture, heaviness, adventure };
}

/**
 * Free text typed by a user, on its way into a model prompt. Length-capped so
 * a paste cannot blow out the token budget, and stripped of the characters
 * most useful for steering the model away from its instructions.
 */
export function parseNote(raw: unknown, maxLength = 120): string | null {
  if (typeof raw !== "string") return null;

  const text = raw
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/[<>{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!text || text.length > maxLength) return null;
  return text;
}

export function parseCoordinate(
  raw: string | null,
  limit: number,
): number | null {
  if (raw === null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || Math.abs(n) > limit) return null;
  return n;
}
