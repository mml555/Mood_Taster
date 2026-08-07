export const INTENTS = ["restaurant", "recipe", "snack", "clue"] as const;
export const FLAVORS = ["savory", "spicy", "sweet", "fresh"] as const;
export const TEXTURES = ["crunchy", "creamy", "juicy", "soft"] as const;
export const HEAVINESS = ["light", "medium", "filling"] as const;
export const ADVENTURE = ["safe", "curious", "surprise"] as const;
export const TEMPERATURES = ["hot", "cold", "any"] as const;
export const COOK_EFFORTS = ["barely", "fifteen", "cook"] as const;
/** Go Out path; "any" skips. Appetite size, separate from dish heaviness. */
export const HUNGERS = ["peckish", "hungry", "starving"] as const;
/** Go Out path; "any" skips. Table mood signal for ranking. */
export const VIBES = ["cozy", "bright", "bold"] as const;

export type Intent = (typeof INTENTS)[number];
export type Flavor = (typeof FLAVORS)[number];
export type Texture = (typeof TEXTURES)[number];
export type Heaviness = (typeof HEAVINESS)[number];
export type Adventure = (typeof ADVENTURE)[number];
export type Temperature = (typeof TEMPERATURES)[number];
export type CookEffort = (typeof COOK_EFFORTS)[number];
export type Hunger = (typeof HUNGERS)[number];
export type Vibe = (typeof VIBES)[number];

export type Recipe = {
  servings: number;
  timeMinutes: number;
  ingredients: string[];
  steps: string[];
};

export type Food = {
  id: string;
  name: string;
  description: string;
  flavorTags: Flavor[];
  textureTags: Texture[];
  heaviness: Heaviness;
  temperature: "hot" | "cold" | "room";
  adventurousness: 1 | 2 | 3 | 4 | 5;
  dietaryTags: string[];
  image: string;
  imageAlt: string;
  imageCredit?: string;
  reasonTemplate: string;
  /** Present when this dish can be cooked at home. */
  recipe?: Recipe;
  /** Curated for Grab a snack intent. */
  snack?: boolean;
};

/**
 * Slim food used by the ranking engine. Ships in the client bundle without
 * recipe bodies (those live in recipes.ts and attach on the server).
 */
export type RankFood = Omit<Food, "recipe"> & {
  hasRecipe: boolean;
  /** Minutes when hasRecipe; used for Cook effort ranking. */
  recipeMinutes: number | null;
};

/** Ranking / DNA helpers accept full foods or slim rank foods. */
export type FoodLike = Omit<Food, "recipe"> | RankFood;

export type Answers = {
  intent: Intent;
  flavor: Flavor;
  texture: Texture;
  heaviness: Heaviness | "any";
  adventure: Adventure;
  /** "any" for standard quiz; hot/cold from no-clue mode. */
  temperature: Temperature;
  /** Cook path only; "any" for other intents. */
  cookEffort: CookEffort | "any";
  /** Go Out path; "any" when skipped or other intents. */
  hunger: Hunger | "any";
  /** Go Out path; "any" when skipped or other intents. */
  vibe: Vibe | "any";
};

export type DnaDimension =
  | "sweet"
  | "spicy"
  | "savory"
  | "fresh"
  | "crunchy"
  | "creamy"
  | "juicy"
  | "soft"
  | "light"
  | "filling"
  | "adventurous";

export type DnaEntry = {
  score: number;
  confidence: number;
  samples: number;
};

/** One score axis across all sensory dimensions. */
export type DnaBucket = Record<DnaDimension, DnaEntry>;

/**
 * Taste DNA v2: stated preference vs lived experience.
 * Prefer reading via dna helpers (`normalizeDna`, `effectiveEntry`).
 * Legacy flat `Record<DnaDimension, DnaEntry>` still loads via migration.
 */
export type DnaProfile = {
  version: 2;
  /** Stated taste from quiz answers. */
  prefs: DnaBucket;
  /** Lived taste from ratings and repeats. */
  experience: DnaBucket;
};

/** Pre-v2 localStorage / cloud shape (ratings mixed into one score). */
export type DnaProfileV1 = Record<DnaDimension, DnaEntry>;

export type SessionState = {
  answers: Answers;
  rejectedIds: string[];
  servedIds: string[];
};

export type ScoredFood = {
  food: RankFood;
  score: number;
  matchedAttributes: string[];
  explanation: string;
};

export type Recommendation = {
  primary: ScoredFood;
  alternates: ScoredFood[];
};

export type Rating = "nailed" | "kinda" | "nope";

/** Role on a labeled restaurant card (Best match / Closest / Wildcard). */
export type PlaceLabel = "best" | "closest" | "wildcard";

/** Nearby place from /api/places. Kept out of the route module so clients do not import it. */
export type NearbyPlace = {
  name: string;
  address: string;
  rating: number | null;
  mapsUri: string | null;
  miles: number | null;
  /** Display price: $, $$, $$$, $$$$, or Free when API provides priceLevel. */
  price: string | null;
  /** Whether open now when currentOpeningHours is present; null if unknown. */
  openNow: boolean | null;
  /** Selection role; null for legacy/cached payloads without labels. */
  label: PlaceLabel | null;
};
