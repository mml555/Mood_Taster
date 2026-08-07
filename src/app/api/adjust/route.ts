import { NextResponse } from "next/server";
import { ask, isAiConfigured, parseJsonObject, sanitizeLine } from "@/lib/ai";
import { adjustBodySchema } from "@/lib/api-schemas";
import {
  ADVENTURE,
  FLAVORS,
  HEAVINESS,
  TEXTURES,
} from "@/lib/taste-types";
import { parseAnswers, parseNote } from "@/lib/validate";

/**
 * Conversational reject. The user says why the dish was wrong ("too heavy",
 * "something colder") and the model moves the craving axes instead of the app
 * just walking down the ranking.
 *
 * The model only ever returns axis values, never a dish. Ranking stays
 * deterministic, so a bad model reply can misread the request but can never
 * produce a recommendation the engine would not have made anyway.
 *
 * On any failure the caller keeps the original answers and falls back to the
 * plain "next candidate" behaviour, so the button always does something.
 */

const RULES = [
  "You adjust food craving preferences based on a complaint.",
  "Return ONLY a JSON object, no prose and no markdown fence, with keys:",
  `flavor (${FLAVORS.join("|")}),`,
  `texture (${TEXTURES.join("|")}),`,
  `heaviness (${HEAVINESS.join("|")}|any),`,
  `adventure (${ADVENTURE.join("|")}),`,
  "and note: one short sentence, under 15 words, telling the user what you changed.",
  "Change only the axes the complaint actually implies. Keep the rest identical.",
  "No em dashes anywhere.",
].join(" ");

export async function POST(request: Request) {
  if (!isAiConfigured()) {
    return NextResponse.json({ answers: null, note: null });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const envelope = adjustBodySchema.safeParse(body);
  if (!envelope.success) {
    return NextResponse.json(
      { error: "Invalid answers or note" },
      { status: 400 },
    );
  }

  const answers = parseAnswers(envelope.data.answers);
  const complaint = parseNote(envelope.data.note);

  if (!answers || !complaint) {
    return NextResponse.json(
      { error: "Invalid answers or note" },
      { status: 400 },
    );
  }

  const raw = await ask({
    instructions: RULES,
    input: `Current: ${JSON.stringify(answers)}. They said: "${complaint}"`,
    maxOutputTokens: 500,
    json: true,
  });

  if (raw === null) {
    return NextResponse.json({ answers: null, note: null });
  }

  const parsed = parseJsonObject(raw);
  if (!parsed) {
    return NextResponse.json({ answers: null, note: null });
  }

  // Re-validate against the same guards used for user input. The model is not
  // more trusted than the browser. Force original intent so adjust cannot flip
  // Eat out ↔ Cook.
  const nextAnswers = parseAnswers({ ...parsed, intent: answers.intent });
  if (!nextAnswers) {
    return NextResponse.json({ answers: null, note: null });
  }

  const note =
    typeof parsed.note === "string" ? sanitizeLine(parsed.note, 120) : null;

  return NextResponse.json({ answers: nextAnswers, note });
}
