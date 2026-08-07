import { RANK_FOODS } from "./catalog-data";
import { RECIPES } from "./recipes";
import type { Food } from "./taste-types";

/**
 * Full catalog for server routes and result pages (includes recipes).
 * Client ranking must import RANK_FOODS from catalog-data, not this module.
 */
export const CATALOG: Food[] = RANK_FOODS.map((food) => {
  const recipe = food.hasRecipe ? RECIPES[food.id] : undefined;
  return {
    id: food.id,
    name: food.name,
    description: food.description,
    flavorTags: food.flavorTags,
    textureTags: food.textureTags,
    heaviness: food.heaviness,
    temperature: food.temperature,
    adventurousness: food.adventurousness,
    dietaryTags: food.dietaryTags,
    image: food.image,
    imageAlt: food.imageAlt,
    imageCredit: food.imageCredit,
    reasonTemplate: food.reasonTemplate,
    ...(food.snack ? { snack: true as const } : {}),
    ...(recipe ? { recipe } : {}),
  };
});

export function getFoodById(id: string): Food | undefined {
  return CATALOG.find((food) => food.id === id);
}

export function allFoodIds(): string[] {
  return CATALOG.map((f) => f.id);
}
