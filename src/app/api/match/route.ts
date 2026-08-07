import { NextResponse } from "next/server";
import { readJson } from "@/lib/api-route";
import { matchBodySchema } from "@/lib/api-schemas";
import { parseDnaProfile } from "@/lib/auth-schema";
import { parseDietary } from "@/lib/dietary";
import { createNeutralDna } from "@/lib/dna";
import { NoDietaryMatchError, rank } from "@/lib/engine";
import { parseFavoriteIds } from "@/lib/favorites";
import { emptySession } from "@/lib/session";
import type { DnaProfile, SessionState } from "@/lib/taste-types";
import { parseAnswers } from "@/lib/validate";

/**
 * Server-side initial match. Client still keeps a slim rank catalog for
 * instant reject / swipe rematches. This endpoint owns the first pick so the
 * quiz finish path does not need to ship recipe bodies.
 */

const MAX_ALTERNATES = 8;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await readJson(request);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const envelope = matchBodySchema.safeParse(body);
  if (!envelope.success) {
    return NextResponse.json({ error: "Invalid answers" }, { status: 400 });
  }

  const answers = parseAnswers(envelope.data.answers);
  if (!answers) {
    return NextResponse.json({ error: "Invalid answers" }, { status: 400 });
  }

  const dna: DnaProfile = parseDnaProfile(envelope.data.dna) ?? createNeutralDna();
  const session: SessionState = {
    ...emptySession(answers),
    rejectedIds: envelope.data.rejectedIds ?? [],
    servedIds: envelope.data.servedIds ?? [],
  };

  try {
    const rec = rank(
      answers,
      dna,
      session,
      parseDietary(envelope.data.dietary),
      parseFavoriteIds(envelope.data.favoriteIds),
    );
    return NextResponse.json({
      foodId: rec.primary.food.id,
      explanation: rec.primary.explanation,
      matchedAttributes: rec.primary.matchedAttributes,
      alternateIds: rec.alternates
        .slice(0, MAX_ALTERNATES)
        .map((a) => a.food.id),
    });
  } catch (err) {
    if (err instanceof NoDietaryMatchError) {
      return NextResponse.json(
        { error: "No foods match your dietary settings" },
        { status: 422 },
      );
    }
    console.error("[match] rank failed:", err);
    return NextResponse.json(
      { error: "Could not rank foods for these answers" },
      { status: 500 },
    );
  }
}
