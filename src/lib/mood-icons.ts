import type { LucideIcon } from "lucide-react";
import {
  AlarmClock,
  Beef,
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
  Heart,
  Infinity as InfinityIcon,
  Layers,
  Leaf,
  Lollipop,
  MapPin,
  Milk,
  Mouse,
  Salad,
  Scale,
  Search,
  Shield,
  Snowflake,
  Sofa,
  Sparkles,
  Thermometer,
  Timer,
  Utensils,
  UtensilsCrossed,
  Weight,
  Zap,
} from "lucide-react";

/** Lucide icons that teach each quiz pick. Use strokeWidth={1.5} at call site. */
export const QUIZ_OPTION_ICONS: Record<string, LucideIcon> = {
  // Intent
  restaurant: MapPin,
  recipe: ChefHat,
  snack: Cookie,
  clue: CircleHelp,
  // Flavor
  savory: Beef,
  spicy: Flame,
  sweet: Lollipop,
  fresh: Leaf,
  // Texture
  crunchy: Cookie,
  creamy: Milk,
  juicy: Droplets,
  soft: Feather,
  // Heaviness
  light: Feather,
  medium: Scale,
  filling: Weight,
  any: InfinityIcon,
  // Adventure
  safe: Shield,
  curious: Compass,
  surprise: Dices,
  // Temperature
  hot: Flame,
  cold: Snowflake,
  // Cook effort
  barely: Zap,
  fifteen: Timer,
  cook: ChefHat,
  // Hunger (Go out)
  peckish: Mouse,
  hungry: Utensils,
  starving: UtensilsCrossed,
  // Vibe (Go out)
  cozy: Sofa,
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
  flavor: Salad,
  texture: Layers,
  heaviness: Scale,
  adventure: Dices,
  temperature: Thermometer,
  cookEffort: Clock,
  hunger: AlarmClock,
  vibe: Heart,
};

/** DNA dimension labels share the same marks as quiz picks. */
export const DNA_DIMENSION_ICONS: Record<string, LucideIcon> = {
  savory: Beef,
  spicy: Flame,
  sweet: Lollipop,
  fresh: Leaf,
  crunchy: Cookie,
  creamy: Milk,
  juicy: Droplets,
  soft: Feather,
};

export const FLOW_ICONS = {
  feel: HandHeart,
  match: Search,
  react: Sparkles,
} as const;
