import { allRankFoodIds } from "./catalog-data";
import type { Recipe } from "./taste-types";

export const FAVORITES_KEY = "mood-taster-favorites";
export const FAVORITES_CAP = 50;

export type FavoritesState = {
  foodIds: string[];
};

export const EMPTY_FAVORITES: FavoritesState = { foodIds: [] };

const KNOWN_IDS = new Set(allRankFoodIds());

function sanitizeIds(ids: unknown[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (typeof id !== "string" || !id || !KNOWN_IDS.has(id) || seen.has(id)) {
      continue;
    }
    seen.add(id);
    out.push(id);
    if (out.length >= FAVORITES_CAP) break;
  }
  return out;
}

export function parseFavoriteIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return sanitizeIds(raw);
}

export function parseFavorites(raw: unknown): FavoritesState {
  if (typeof raw !== "object" || raw === null) return EMPTY_FAVORITES;
  const src = raw as Record<string, unknown>;
  return { foodIds: parseFavoriteIds(src.foodIds) };
}

export function readFavorites(): FavoritesState {
  if (typeof window === "undefined") return EMPTY_FAVORITES;
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return EMPTY_FAVORITES;
    return parseFavorites(JSON.parse(raw) as unknown);
  } catch {
    return EMPTY_FAVORITES;
  }
}

export function writeFavorites(state: FavoritesState): void {
  if (typeof window === "undefined") return;
  const next: FavoritesState = {
    foodIds: sanitizeIds(state.foodIds).slice(0, FAVORITES_CAP),
  };
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
}

export function isFavorite(foodId: string, state?: FavoritesState): boolean {
  const favs = state ?? readFavorites();
  return favs.foodIds.includes(foodId);
}

/** Newest first. Cap at FAVORITES_CAP. */
export function toggleFavorite(
  foodId: string,
  state?: FavoritesState,
): FavoritesState {
  if (!KNOWN_IDS.has(foodId)) {
    return state ?? readFavorites();
  }
  const current = state ?? readFavorites();
  const exists = current.foodIds.includes(foodId);
  const foodIds = exists
    ? current.foodIds.filter((id) => id !== foodId)
    : [foodId, ...current.foodIds.filter((id) => id !== foodId)].slice(
        0,
        FAVORITES_CAP,
      );
  const next = { foodIds };
  writeFavorites(next);
  return next;
}

export function favoriteIdSet(
  ids: ReadonlySet<string> | readonly string[] | FavoritesState = EMPTY_FAVORITES,
): Set<string> {
  if (ids instanceof Set) return ids;
  if (Array.isArray(ids)) return new Set(ids);
  return new Set((ids as FavoritesState).foodIds);
}

/** Plain-text recipe for clipboard / notes apps. */
export function formatRecipeText(
  name: string,
  recipe: Recipe,
): string {
  const lines = [
    name,
    `${recipe.timeMinutes} min · ${recipe.servings} servings`,
    "",
    "Ingredients",
    ...recipe.ingredients.map((item) => `- ${item}`),
    "",
    "Steps",
    ...recipe.steps.map((step, i) => `${i + 1}. ${step}`),
  ];
  return lines.join("\n");
}
