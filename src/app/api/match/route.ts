import { NextResponse } from "next/server";
import { createNeutralDna } from "@/lib/dna";
import { rank } from "@/lib/engine";
import { emptySession } from "@/lib/session";
import type { DnaProfile, SessionState } from "@/lib/taste-types";
import { parseAnswers } from "@/lib/validate";
import { parseDnaProfile } from "@/lib/auth-schema";

/**
 * Server-side initial match. Client still keeps a slim rank catalog for
 * instant reject / swipe rematches. This endpoint owns the first pick so the
 * quiz finish path does not need to ship recipe bodies.
 */

function parseIdList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is string => typeof id === "string" && id.length > 0);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const src = body as Record<string, unknown>;
  const answers = parseAnswers(src.answers);
  if (!answers) {
    return NextResponse.json({ error: "Invalid answers" }, { status: 400 });
  }

  const dna: DnaProfile = parseDnaProfile(src.dna) ?? createNeutralDna();
  const session: SessionState = {
    ...emptySession(answers),
    rejectedIds: parseIdList(src.rejectedIds),
    servedIds: parseIdList(src.servedIds),
  };

  try {
    const rec = rank(answers, dna, session);
    return NextResponse.json({
      foodId: rec.primary.food.id,
      explanation: rec.primary.explanation,
      matchedAttributes: rec.primary.matchedAttributes,
      alternateIds: rec.alternates.slice(0, 8).map((a) => a.food.id),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not rank foods for these answers" },
      { status: 500 },
    );
  }
}
