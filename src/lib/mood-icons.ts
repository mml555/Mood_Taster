import type { LucideIcon } from "lucide-react";
import {
  Candy,
  ChefHat,
  CircleHelp,
  Clock,
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
  Snowflake,
  Sparkles,
  Thermometer,
  Timer,
  Utensils,
  Weight,
  Zap,
} from "lucide-react";

/** Lucide icons that teach each quiz pick. Use strokeWidth={1.5} at call site. */
export const QUIZ_OPTION_ICONS: Record<string, LucideIcon> = {
  restaurant: MapPin,
  recipe: ChefHat,
  snack: Candy,
  clue: CircleHelp,
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
  hot: Flame,
  cold: Snowflake,
  barely: Zap,
  fifteen: Timer,
  cook: ChefHat,
  peckish: Feather,
  hungry: Utensils,
  starving: Flame,
  cozy: HandHeart,
  bright: Sparkles,
  bold: Zap,
};

/** One mark per quiz question step. */
export const QUIZ_STEP_ICONS: Record<
  | "intent"
  | "flavor"
  | "texture"
  | "heaviness"
  | "adventure"
  | "temperature"
  | "cookEffort"
  | "hunger"
  | "vibe",
  LucideIcon
> = {
  intent: Utensils,
  flavor: ChefHat,
  texture: Layers,
  heaviness: Scale,
  adventure: Dices,
  temperature: Thermometer,
  cookEffort: Clock,
  hunger: Weight,
  vibe: Sparkles,
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
