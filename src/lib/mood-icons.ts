import type { LucideIcon } from "lucide-react";
import {
  ChefHat,
  Compass,
  Cookie,
  Dices,
  Droplets,
  Feather,
  Flame,
  HandHeart,
  Infinity as InfinityIcon,
  Layers,
  Leaf,
  MapPin,
  Milk,
  Scale,
  Search,
  Shield,
  Sparkles,
  Utensils,
  Weight,
} from "lucide-react";

/** Lucide icons that teach each quiz pick. Use strokeWidth={1.5} at call site. */
export const QUIZ_OPTION_ICONS: Record<string, LucideIcon> = {
  restaurant: MapPin,
  recipe: ChefHat,
  savory: Utensils,
  spicy: Flame,
  sweet: Cookie,
  fresh: Leaf,
  crunchy: Layers,
  creamy: Milk,
  juicy: Droplets,
  soft: Feather,
  light: Feather,
  medium: Scale,
  filling: Weight,
  any: InfinityIcon,
  safe: Shield,
  curious: Compass,
  surprise: Dices,
};

/** One mark per quiz question step. */
export const QUIZ_STEP_ICONS: Record<
  "intent" | "flavor" | "texture" | "heaviness" | "adventure",
  LucideIcon
> = {
  intent: Utensils,
  flavor: ChefHat,
  texture: Layers,
  heaviness: Scale,
  adventure: Dices,
};

/** DNA dimension labels share the same marks as quiz picks. */
export const DNA_DIMENSION_ICONS: Record<string, LucideIcon> = {
  savory: Utensils,
  spicy: Flame,
  sweet: Cookie,
  fresh: Leaf,
  crunchy: Layers,
  creamy: Milk,
  juicy: Droplets,
  soft: Feather,
};

export const FLOW_ICONS = {
  feel: HandHeart,
  match: Search,
  react: Sparkles,
} as const;
