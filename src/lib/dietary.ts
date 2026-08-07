import type { FoodLike } from "./taste-types";

export const DIETARY_KEY = "mood-taster-dietary";

export const DIET_OPTIONS = [
  { id: "vegan", label: "Vegan" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "gluten_free", label: "Gluten free" },
] as const;

export const ALLERGEN_OPTIONS = [
  { id: "dairy", label: "Dairy", tag: "contains-dairy" },
  { id: "egg", label: "Egg", tag: "contains-egg" },
  { id: "fish", label: "Fish", tag: "contains-fish" },
  { id: "shellfish", label: "Shellfish", tag: "contains-shellfish" },
  { id: "pork", label: "Pork", tag: "contains-pork" },
  { id: "beef", label: "Beef", tag: "contains-beef" },
  { id: "gluten", label: "Gluten", tag: "contains-gluten" },
] as const;

export type DietId = (typeof DIET_OPTIONS)[number]["id"];
export type AllergenId = (typeof ALLERGEN_OPTIONS)[number]["id"];

export type DietaryPrefs = {
  diets: DietId[];
  /** Safety exclusions. Never soft-matched away. */
  allergens: AllergenId[];
};

export const EMPTY_DIETARY: DietaryPrefs = { diets: [], allergens: [] };

const DIET_IDS = new Set<string>(DIET_OPTIONS.map((d) => d.id));
const ALLERGEN_IDS = new Set<string>(ALLERGEN_OPTIONS.map((a) => a.id));
const ALLERGEN_TAG: Record<AllergenId, string> = Object.fromEntries(
  ALLERGEN_OPTIONS.map((a) => [a.id, a.tag]),
) as Record<AllergenId, string>;

export function readDietary(): DietaryPrefs {
  if (typeof window === "undefined") return EMPTY_DIETARY;
  try {
    const raw = localStorage.getItem(DIETARY_KEY);
    if (!raw) return EMPTY_DIETARY;
    const parsed = JSON.parse(raw) as Partial<DietaryPrefs>;
    const diets = Array.isArray(parsed.diets)
      ? parsed.diets.filter((d): d is DietId => DIET_IDS.has(d))
      : [];
    const allergens = Array.isArray(parsed.allergens)
      ? parsed.allergens.filter((a): a is AllergenId => ALLERGEN_IDS.has(a))
      : [];
    return { diets, allergens };
  } catch {
    return EMPTY_DIETARY;
  }
}

export function writeDietary(prefs: DietaryPrefs): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DIETARY_KEY, JSON.stringify(prefs));
}

export function hasDietaryConstraints(prefs: DietaryPrefs): boolean {
  return prefs.diets.length > 0 || prefs.allergens.length > 0;
}

export function parseDietary(raw: unknown): DietaryPrefs {
  if (typeof raw !== "object" || raw === null) return EMPTY_DIETARY;
  const src = raw as Record<string, unknown>;
  const diets = Array.isArray(src.diets)
    ? src.diets.filter((d): d is DietId => typeof d === "string" && DIET_IDS.has(d))
    : [];
  const allergens = Array.isArray(src.allergens)
    ? src.allergens.filter(
        (a): a is AllergenId => typeof a === "string" && ALLERGEN_IDS.has(a),
      )
    : [];
  return { diets, allergens };
}

/**
 * Hard filter. Diets and allergens are safety/commitment constraints, not
 * soft preferences. Exploration and novelty must not override these.
 */
export function passesHardConstraints(
  food: FoodLike,
  prefs: DietaryPrefs,
): boolean {
  if (!hasDietaryConstraints(prefs)) return true;

  const tags = new Set(food.dietaryTags);

  if (prefs.diets.includes("vegan") && !tags.has("vegan")) {
    return false;
  }

  if (
    prefs.diets.includes("vegetarian") &&
    !tags.has("vegetarian") &&
    !tags.has("vegan")
  ) {
    return false;
  }

  if (prefs.diets.includes("gluten_free") && tags.has("contains-gluten")) {
    return false;
  }

  for (const allergen of prefs.allergens) {
    const tag = ALLERGEN_TAG[allergen];
    if (tag && tags.has(tag)) return false;
  }

  // Vegan diet also excludes common animal tags even if vegan tag is present
  // on a mis-tagged item. Belt and suspenders.
  if (prefs.diets.includes("vegan")) {
    const animal = [
      "contains-dairy",
      "contains-egg",
      "contains-fish",
      "contains-shellfish",
      "contains-pork",
      "contains-beef",
    ];
    if (animal.some((t) => tags.has(t))) return false;
  }

  if (prefs.diets.includes("vegetarian")) {
    const meat = [
      "contains-fish",
      "contains-shellfish",
      "contains-pork",
      "contains-beef",
    ];
    if (meat.some((t) => tags.has(t))) return false;
  }

  return true;
}
