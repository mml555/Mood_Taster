import {
  ADVENTURE,
  FLAVORS,
  HEAVINESS,
  TEXTURES,
  type Answers,
} from "./taste-types";
import { CATALOG } from "./catalog";
import { createNeutralDna } from "./dna";
import { rank } from "./engine";
import { emptySession } from "./session";

/**
 * Assert catalog coverage: every major quiz answer has ≥5 strong matches.
 * Run: npx tsx src/lib/catalog-coverage.ts
 */
const THRESHOLD = 0.55;
const MIN_MATCHES = 5;

function baseAnswers(): Answers {
  return {
    flavor: "savory",
    texture: "soft",
    heaviness: "any",
    adventure: "curious",
  };
}

function countStrong(answers: Answers): number {
  const dna = createNeutralDna();
  const session = emptySession(answers);
  const rec = rank(answers, dna, session);
  const all = [rec.primary, ...rec.alternates];
  return all.filter((s) => s.score >= THRESHOLD).length;
}

function main() {
  const cases: { label: string; answers: Answers }[] = [
    ...FLAVORS.map((flavor) => ({
      label: `flavor=${flavor}`,
      answers: { ...baseAnswers(), flavor },
    })),
    ...TEXTURES.map((texture) => ({
      label: `texture=${texture}`,
      answers: { ...baseAnswers(), texture },
    })),
    ...HEAVINESS.map((heaviness) => ({
      label: `heaviness=${heaviness}`,
      answers: { ...baseAnswers(), heaviness },
    })),
    ...ADVENTURE.map((adventure) => ({
      label: `adventure=${adventure}`,
      answers: { ...baseAnswers(), adventure },
    })),
  ];

  console.log(`Catalog size: ${CATALOG.length}`);
  let failed = false;
  for (const c of cases) {
    const count = countStrong(c.answers);
    const ok = count >= MIN_MATCHES;
    console.log(
      `${ok ? "OK" : "FAIL"} ${c.label}: ${count} foods ≥ ${THRESHOLD}`,
    );
    if (!ok) failed = true;
  }
  if (failed) process.exit(1);
  console.log("Coverage OK");
}

main();
