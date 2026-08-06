export const FLAVORS = ["savory", "spicy", "sweet", "fresh"] as const;
export const TEXTURES = ["crunchy", "creamy", "juicy", "soft"] as const;
export const HEAVINESS = ["light", "medium", "filling"] as const;
export const ADVENTURE = ["safe", "curious", "surprise"] as const;

export type Flavor = (typeof FLAVORS)[number];
export type Texture = (typeof TEXTURES)[number];
export type Heaviness = (typeof HEAVINESS)[number];
export type Adventure = (typeof ADVENTURE)[number];

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
};

export type Answers = {
  flavor: Flavor;
  texture: Texture;
  heaviness: Heaviness | "any";
  adventure: Adventure;
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

export type DnaProfile = Record<DnaDimension, DnaEntry>;

export type SessionState = {
  answers: Answers;
  rejectedIds: string[];
  servedIds: string[];
};

export type ScoredFood = {
  food: Food;
  score: number;
  matchedAttributes: string[];
  explanation: string;
};

export type Recommendation = {
  primary: ScoredFood;
  alternates: ScoredFood[];
};

export type Rating = "nailed" | "kinda" | "nope";
