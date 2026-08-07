import { NextResponse } from "next/server";
import { ask, isAiConfigured, parseJsonObject, sanitizeLine } from "@/lib/ai";
import { readJson, withRoute } from "@/lib/api-route";
import { explainBodySchema } from "@/lib/api-schemas";
import { CATALOG } from "@/lib/catalog";
import { buildExplanation } from "@/lib/explain";
import { clientRateKey, enforceRateLimit } from "@/lib/rate-limit";
import { parseAnswers } from "@/lib/validate";

/**
 * Rewrites the deterministic explanation into something warmer, and adds a
 * short practical tip about the dish.
 *
 * For Cook (intent=recipe), the tip is a home-cook note and an optional cookTip
 * lands inside the recipe block. Catalog ingredients and steps stay the source
 * of truth. AI never invents a replacement recipe here.
 *
 * Both lines come from ONE request. An earlier version issued two calls in
 * parallel, which doubled the quota cost and, on a cold instance, doubled the
 * TLS handshakes for no benefit. One call is the single biggest latency win
 * available here short of precomputing.
 *
 * This endpoint is pure enhancement. The result screen has already rendered a
 * correct explanation before it is ever called, so every failure path returns
 * 200 with nulls rather than an error the client has to handle.
 */

const RULES = [
  "You write copy for a food recommendation app.",
  "Return ONLY a JSON object, no markdown fence, with keys:",
  '"why": one sentence saying why this dish fits what the person asked for.',
  "Speak to them as 'you'. Name the qualities they asked for.",
  "Never mention scores, matching, or algorithms. Under 25 words.",
  '"riff": one sentence with a practical tip.',
  "If mode is cook: tip how to cook, shop, or plate it at home.",
  "If mode is eat out: tip how to order or what to look for.",
  "If mode is snack: tip how to find or enjoy the snack.",
  "If mode is unsure: tip something concrete about eating it.",
  "Do not repeat the why. Do not use the word 'perfect'. Under 20 words.",
  '"cookTip": only when mode is cook. One short chef tip tied to THIS recipe',
  "(timing, heat, or a simple swap). Under 18 words. Else omit or use null.",
  "No em dashes anywhere.",
  "Respect mode: eat out, cook, snack, or unsure.",
  "Never invent new ingredient lists or replace the given steps.",
].join(" ");

/** Every soft failure looks the same: the deterministic copy already rendered. */
const NO_COPY = { why: null, riff: null, cookTip: null };

export const POST = withRoute("explain", "Could not explain", async (request) => {
  if (!isAiConfigured()) {
    return NextResponse.json(NO_COPY);
  }

  if (!(await enforceRateLimit(clientRateKey(request, "explain")))) {
    return NextResponse.json(NO_COPY);
  }

  const envelope = explainBodySchema.safeParse(await readJson(request));
  if (!envelope.success) {
    return NextResponse.json(
      { error: "Unknown food id or invalid answers" },
      { status: 400 },
    );
  }

  const food = CATALOG.find((f) => f.id === envelope.data.foodId);
  const answers = parseAnswers(envelope.data.answers);

  if (!food || !answers) {
    return NextResponse.json(
      { error: "Unknown food id or invalid answers" },
      { status: 400 },
    );
  }

  const heaviness =
    answers.heaviness === "any" ? "no preference" : answers.heaviness;
  const mode =
    answers.intent === "recipe"
      ? "cook"
      : answers.intent === "snack"
        ? "snack"
        : answers.intent === "clue"
          ? "unsure"
          : "eat out";
  const recipe = food.recipe;

  // Keep the cook prompt short: full step lists add latency for a tip that is
  // only one sentence. Catalog steps stay on screen either way.
  const recipeBlock =
    answers.intent === "recipe" && recipe
      ? [
          `Recipe time: ${recipe.timeMinutes} min. Servings: ${recipe.servings}.`,
          `Key ingredients: ${recipe.ingredients.slice(0, 5).join("; ")}.`,
          `First steps: ${recipe.steps.slice(0, 2).join(" ")}`,
        ].join(" ")
      : "No recipe block for this mode.";

  const raw = await ask({
    instructions: RULES,
    input: [
      `Mode: ${mode}.`,
      `Dish: ${food.name}.`,
      `What it is: ${food.description}.`,
      `They asked for: ${answers.flavor}, ${answers.texture}, ${heaviness},`,
      `feeling ${answers.adventure}.`,
      `Current line: ${buildExplanation(food, answers)}`,
      recipeBlock,
    ].join(" "),
    maxOutputTokens: answers.intent === "recipe" ? 550 : 400,
    json: true,
  });

  if (raw === null) {
    return NextResponse.json(NO_COPY);
  }

  const parsed = parseJsonObject(raw);
  if (!parsed) {
    return NextResponse.json(NO_COPY);
  }

  // Each line is sanitized independently, so a bad riff cannot cost us a good
  // why line.
  const why =
    typeof parsed.why === "string" ? sanitizeLine(parsed.why, 160) : null;
  const riff =
    typeof parsed.riff === "string" ? sanitizeLine(parsed.riff, 140) : null;
  const cookTip =
    answers.intent === "recipe" && typeof parsed.cookTip === "string"
      ? sanitizeLine(parsed.cookTip, 120)
      : null;

  return NextResponse.json({ why, riff, cookTip });
});
