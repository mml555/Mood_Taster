import type { Answers, FoodLike, Heaviness } from "./taste-types";

const FLAVOR_LABEL: Record<Answers["flavor"], string> = {
  savory: "savory",
  spicy: "spicy",
  sweet: "sweet",
  fresh: "fresh",
};

const TEXTURE_LABEL: Record<Answers["texture"], string> = {
  crunchy: "crunchy",
  creamy: "creamy",
  juicy: "juicy",
  soft: "soft",
};

const HEAVINESS_LABEL: Record<Heaviness | "any", string> = {
  light: "light",
  medium: "medium",
  filling: "filling",
  any: "however you like",
};

export function buildExplanation(food: FoodLike, answers: Answers): string {
  const flavor = FLAVOR_LABEL[answers.flavor];
  const texture = TEXTURE_LABEL[answers.texture];
  const heaviness = HEAVINESS_LABEL[answers.heaviness];

  return food.reasonTemplate
    .replaceAll("{flavor}", flavor)
    .replaceAll("{texture}", texture)
    .replaceAll("{heaviness}", heaviness);
}

export function matchedAttributes(
  answers: Answers,
  food: FoodLike,
): string[] {
  const attrs: string[] = [];

  if (food.flavorTags.includes(answers.flavor)) {
    attrs.push(capitalize(answers.flavor));
  } else {
    const near = food.flavorTags[0];
    if (near) attrs.push(capitalize(near));
  }

  if (food.textureTags.includes(answers.texture)) {
    attrs.push(capitalize(answers.texture));
  } else {
    const near = food.textureTags[0];
    if (near) attrs.push(capitalize(near));
  }

  if (answers.heaviness === "any") {
    attrs.push(capitalize(food.heaviness));
  } else {
    attrs.push(capitalize(food.heaviness));
  }

  return [...new Set(attrs)].slice(0, 3);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Sanitize optional AI-polished explanation; fall back to template on violation. */
export function sanitizeExplanation(
  text: string,
  fallback: string,
): string {
  let cleaned = text
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return fallback;
  if (cleaned.includes("—") || cleaned.includes("–")) return fallback;

  const sentence = cleaned.split(/(?<=[.!?])\s+/)[0] ?? cleaned;
  cleaned = sentence.trim();
  if (cleaned.length > 180) return fallback;
  if (!/[.!?]$/.test(cleaned)) cleaned = `${cleaned}.`;
  return cleaned;
}
