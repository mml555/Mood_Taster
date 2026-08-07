import { RANK_FOODS } from "./catalog-data";
import { RECIPES } from "./recipes";
import type { Food } from "./taste-types";

/**
 * Full catalog for server routes and result pages (includes recipes).
 * Client ranking must import RANK_FOODS from catalog-data, not this module.
 */
export const CATALOG: Food[] = RANK_FOODS.map((food) => {
  const { hasRecipe, ...rest } = food;
  const recipe = RECIPES[food.id];
  return recipe ? { ...rest, recipe } : { ...rest };
});

export function getFoodById(id: string): Food | undefined {
  return CATALOG.find((food) => food.id === id);
}

export function allFoodIds(): string[] {
  return CATALOG.map((f) => f.id);
}
