import { NextResponse } from "next/server";
import { ask, isAiConfigured, parseJsonObject, sanitizeLine } from "@/lib/ai";
import { CATALOG } from "@/lib/catalog";
import { buildExplanation } from "@/lib/explain";
import { parseAnswers } from "@/lib/validate";

/**
 * Rewrites the deterministic explanation into something warmer, and adds a
 * short practical tip about the dish.
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
  "Return ONLY a JSON object, no markdown fence, with exactly two keys:",
  '"why": one sentence saying why this dish fits what the person asked for.',
  "Speak to them as 'you'. Name the qualities they asked for.",
  "Never mention scores, matching, or algorithms. Under 25 words.",
  '"riff": one sentence with a practical tip: what to pair with it, how to',
  "order it, or what makes a good one. Concrete, never generic praise.",
  "Do not repeat the why. Do not use the word 'perfect'. Under 20 words.",
  "No em dashes anywhere.",
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

  const raw = await ask({
    instructions: RULES,
    input: [
      `Dish: ${food.name}.`,
      `What it is: ${food.description}.`,
      `They asked for: ${answers.flavor}, ${answers.texture}, ${heaviness},`,
      `feeling ${answers.adventure}.`,
      `Current line: ${buildExplanation(food, answers)}`,
    ].join(" "),
    maxOutputTokens: 500,
    json: true,
  });

  if (raw === null) {
    return NextResponse.json({ why: null, riff: null });
  }

  const parsed = parseJsonObject(raw);
  if (!parsed) {
    return NextResponse.json({ why: null, riff: null });
  }

  // Each line is sanitized independently, so a bad riff cannot cost us a good
  // why line.
  const why =
    typeof parsed.why === "string" ? sanitizeLine(parsed.why, 160) : null;
  const riff =
    typeof parsed.riff === "string" ? sanitizeLine(parsed.riff, 140) : null;

  return NextResponse.json({ why, riff });
}
