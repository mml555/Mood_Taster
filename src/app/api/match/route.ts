import { NextResponse } from "next/server";
import { HttpError, readJson, withRoute } from "@/lib/api-route";
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
const RANK_FAILED = "Could not rank foods for these answers";

export const POST = withRoute("match", RANK_FAILED, async (request) => {
  const envelope = matchBodySchema.safeParse(await readJson(request));
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
      throw new HttpError(422, "No foods match your dietary settings");
    }
    // Anything else is a bug in the ranker. withRoute logs it and answers 500.
    throw err;
  }
});
