import {
  ADVENTURE,
  FLAVORS,
  HEAVINESS,
  INTENTS,
  TEXTURES,
  type Answers,
  type Intent,
} from "./taste-types";
import { CATALOG } from "./catalog";
import { createNeutralDna } from "./dna";
import { rank } from "./engine";
import { emptySession } from "./session";

/**
 * Assert catalog coverage: every major quiz answer has enough strong matches.
 * Run: npx tsx src/lib/catalog-coverage.ts
 */
const THRESHOLD = 0.55;
const MIN_MATCHES = 5;
const MIN_SNACK_MATCHES = 3;

function baseAnswers(intent: Intent): Answers {
  return {
    intent,
    flavor: "savory",
    texture: "soft",
    heaviness: "any",
    adventure: "curious",
    temperature: intent === "clue" ? "hot" : "any",
    cookEffort: intent === "recipe" ? "fifteen" : "any",
  };
}

function countStrong(answers: Answers): number {
  const dna = createNeutralDna();
  const session = emptySession(answers);
  const rec = rank(answers, dna, session);
  const all = [rec.primary, ...rec.alternates];
  return all.filter((s) => s.score >= THRESHOLD).length;
}

function casesForIntent(intent: Intent): { label: string; answers: Answers }[] {
  const base = baseAnswers(intent);
  return [
    ...FLAVORS.map((flavor) => ({
      label: `${intent} flavor=${flavor}`,
      answers: { ...base, flavor },
    })),
    ...TEXTURES.map((texture) => ({
      label: `${intent} texture=${texture}`,
      answers: { ...base, texture },
    })),
    ...HEAVINESS.map((heaviness) => ({
      label: `${intent} heaviness=${heaviness}`,
      answers: { ...base, heaviness },
    })),
    ...ADVENTURE.map((adventure) => ({
      label: `${intent} adventure=${adventure}`,
      answers: { ...base, adventure },
    })),
  ];
}

function main() {
  const withRecipe = CATALOG.filter((f) => f.recipe != null).length;
  const snacks = CATALOG.filter((f) => f.snack === true).length;
  console.log(
    `Catalog size: ${CATALOG.length} (${withRecipe} with recipes, ${snacks} snacks)`,
  );

  if (withRecipe !== CATALOG.length) {
    console.error(
      `FAIL: ${CATALOG.length - withRecipe} dishes missing recipes (Cook needs full coverage)`,
    );
    process.exit(1);
  }

  if (snacks < 8) {
    console.error(`FAIL: need at least 8 snacks, found ${snacks}`);
    process.exit(1);
  }

  let failed = false;
  for (const intent of INTENTS) {
    const min = intent === "snack" ? MIN_SNACK_MATCHES : MIN_MATCHES;
    for (const c of casesForIntent(intent)) {
      const count = countStrong(c.answers);
      const ok = count >= min;
      console.log(
        `${ok ? "OK" : "FAIL"} ${c.label}: ${count} foods ≥ ${THRESHOLD} (min ${min})`,
      );
      if (!ok) failed = true;
    }
  }

  if (failed) process.exit(1);
  console.log("Coverage OK");
}

main();
