import { NextResponse } from "next/server";
import { askForLine, isAiConfigured } from "@/lib/ai";
import { CATALOG } from "@/lib/catalog";
import { buildExplanation } from "@/lib/explain";
import { parseAnswers } from "@/lib/validate";

/**
 * Rewrites the deterministic explanation into something warmer, and adds a
 * short riff about the dish.
 *
 * This endpoint is pure enhancement. The result screen has already rendered a
 * correct explanation before this is ever called, so every failure path here
 * returns 200 with nulls rather than an error the client has to handle.
 */

const WHY_RULES = [
  "You write one sentence for a food recommendation app.",
  "Explain why this dish fits what the person asked for.",
  "Speak to them as 'you'. Warm, plain, specific.",
  "Name the qualities they asked for. Never mention scores, matching, or algorithms.",
  "One sentence, under 25 words. No em dashes. No quotes. No markdown.",
].join(" ");

const RIFF_RULES = [
  "You write one short sentence for a food recommendation app.",
  "Give a practical tip about eating this dish: what to pair with it,",
  "how to order it, or what makes a good one. Concrete, never generic praise.",
  "Do not repeat why it was recommended. Do not use the word 'perfect'.",
  "One sentence, under 20 words. No em dashes. No quotes. No markdown.",
].join(" ");

export async function POST(request: Request) {
  if (!isAiConfigured()) {
    return NextResponse.json({ why: null, riff: null });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const src = body as Record<string, unknown>;
  const food = CATALOG.find((f) => f.id === src.foodId);
  const answers = parseAnswers(src.answers);

  if (!food || !answers) {
    return NextResponse.json(
      { error: "Unknown food id or invalid answers" },
      { status: 400 },
    );
  }

  const heaviness =
    answers.heaviness === "any" ? "no preference" : answers.heaviness;
  const context = [
    `Dish: ${food.name}.`,
    `What it is: ${food.description}.`,
    `They asked for: ${answers.flavor}, ${answers.texture}, ${heaviness},`,
    `feeling ${answers.adventure}.`,
  ].join(" ");

  // Both calls are independent, so a slow riff must not delay the why line.
  const [why, riff] = await Promise.all([
    askForLine({
      instructions: WHY_RULES,
      input: `${context} Current line: ${buildExplanation(food, answers)}`,
      maxOutputTokens: 400,
      maxLength: 160,
    }),
    askForLine({
      instructions: RIFF_RULES,
      input: context,
      maxOutputTokens: 400,
      maxLength: 140,
    }),
  ]);

  return NextResponse.json({ why, riff });
}
