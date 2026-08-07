/**
 * Food Passport cuisine taxonomy (BACKLOG P2-5 / PRD §42–44).
 * Catalog foods map to one primary cuisine for stamping.
 */

export const CUISINES = [
  "Italian",
  "Mexican",
  "Japanese",
  "Korean",
  "Thai",
  "Chinese",
  "Indian",
  "Mediterranean",
  "Israeli",
  "Greek",
  "French",
  "Ethiopian",
  "Vietnamese",
  "Caribbean",
  "American",
  "Middle Eastern",
] as const;

export type Cuisine = (typeof CUISINES)[number];

const CUISINE_SET = new Set<string>(CUISINES);

/** Primary cuisine per catalog food id. */
const FOOD_CUISINE: Record<string, Cuisine> = {
  "crispy-hot-honey-chicken-sandwich": "American",
  "spicy-vodka-rigatoni": "Italian",
  "birria-tacos": "Mexican",
  "poke-bowl": "Japanese",
  "grilled-cheese-tomato-soup": "American",
  "sour-gummy-candy": "American",
  "mango-with-tajin": "Mexican",
  "garlic-butter-noodles": "American",
  "miso-ramen": "Japanese",
  "avocado-toast": "American",
  "korean-fried-chicken": "Korean",
  "caprese-salad": "Italian",
  "chocolate-lava-cake": "French",
  ceviche: "Caribbean",
  "mac-and-cheese": "American",
  "falafel-wrap": "Middle Eastern",
  "thai-green-curry": "Thai",
  "soft-serve-cone": "American",
  shakshuka: "Israeli",
  "crispy-pork-belly-bao": "Chinese",
  "watermelon-feta-salad": "Mediterranean",
  "loaded-nachos": "Mexican",
  "matcha-latte": "Japanese",
  "beef-pho": "Vietnamese",
  "churro-bites": "Mexican",
  "sashimi-plate": "Japanese",
  "mushroom-risotto": "Italian",
  elote: "Mexican",
  "pad-thai": "Thai",
  affogato: "Italian",
};

export function isCuisine(raw: unknown): raw is Cuisine {
  return typeof raw === "string" && CUISINE_SET.has(raw);
}

export function cuisineForFood(foodId: string): Cuisine | null {
  return FOOD_CUISINE[foodId] ?? null;
}

export function labelCuisine(cuisine: Cuisine): string {
  return cuisine;
}

/** Cuisines with no stamp yet, for Explore unexplored list. */
export function unexploredCuisines(
  stamped: ReadonlySet<Cuisine> | readonly Cuisine[],
  limit = 4,
): Cuisine[] {
  const have = stamped instanceof Set ? stamped : new Set(stamped);
  return CUISINES.filter((c) => !have.has(c)).slice(0, limit);
}
