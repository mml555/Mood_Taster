import {
  ADVENTURE,
  COOK_EFFORTS,
  FLAVORS,
  HEAVINESS,
  HUNGERS,
  INTENTS,
  TEMPERATURES,
  TEXTURES,
  VIBES,
  type Adventure,
  type Answers,
  type CookEffort,
  type Flavor,
  type Heaviness,
  type Hunger,
  type Intent,
  type Temperature,
  type Texture,
  type Vibe,
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

  const intent = oneOf<Intent>(INTENTS, src.intent);
  const flavor = oneOf<Flavor>(FLAVORS, src.flavor);
  const texture = oneOf<Texture>(TEXTURES, src.texture);
  const adventure = oneOf<Adventure>(ADVENTURE, src.adventure);

  const heaviness =
    src.heaviness === "any"
      ? ("any" as const)
      : oneOf<Heaviness>(HEAVINESS, src.heaviness);

  // Older sessions omit temperature; treat as any.
  const temperature =
    src.temperature === undefined || src.temperature === null
      ? ("any" as const)
      : oneOf<Temperature>(TEMPERATURES, src.temperature);

  // Older sessions omit cookEffort; treat as any.
  const cookEffort =
    src.cookEffort === undefined ||
    src.cookEffort === null ||
    src.cookEffort === "any"
      ? ("any" as const)
      : oneOf<CookEffort>(COOK_EFFORTS, src.cookEffort);

  // Older sessions omit hunger / vibe; treat as any.
  const hunger =
    src.hunger === undefined ||
    src.hunger === null ||
    src.hunger === "any"
      ? ("any" as const)
      : oneOf<Hunger>(HUNGERS, src.hunger);

  const vibe =
    src.vibe === undefined || src.vibe === null || src.vibe === "any"
      ? ("any" as const)
      : oneOf<Vibe>(VIBES, src.vibe);

  if (
    !intent ||
    !flavor ||
    !texture ||
    !adventure ||
    !heaviness ||
    !temperature ||
    !cookEffort ||
    !hunger ||
    !vibe
  ) {
    return null;
  }

  // Recipe sessions should carry a real effort when present; tolerate any for
  // legacy drafts so old tabs still parse. Same for Go Out hunger / vibe.
  return {
    intent,
    flavor,
    texture,
    heaviness,
    adventure,
    temperature,
    cookEffort,
    hunger,
    vibe,
  };
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

/**
 * City, ZIP, or short place string for manual location.
 * Letters (any script), digits, spaces, and common place punctuation only.
 */
export function parsePlaceQuery(
  raw: string | null,
  maxLength = 80,
): string | null {
  if (raw === null) return null;
  const text = raw
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text || text.length > maxLength) return null;
  // Reject anything outside letters, numbers, and place punctuation.
  if (!/^[\p{L}\p{N}\s,.'#/\-]+$/u.test(text)) return null;
  return text;
}
