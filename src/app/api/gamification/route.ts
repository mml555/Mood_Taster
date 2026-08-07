import { NextResponse } from "next/server";
import { failOnDbError, readJson, withUser } from "@/lib/api-route";
import { gamificationBodySchema } from "@/lib/api-schemas";
import {
  createEmptyGamification,
  gamificationHasEvidence,
  parseGamification,
} from "@/lib/gamification";

const LOAD_FAILED = "Could not load your progress";
const SAVE_FAILED = "Could not save your progress";

export const GET = withUser(
  "gamification",
  LOAD_FAILED,
  async ({ supabase, user }) => {
    const { data, error } = await supabase
      .from("gamification")
      .select("state, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    failOnDbError(error, "gamification", "load", LOAD_FAILED);

    if (!data) {
      return NextResponse.json({
        empty: true,
        state: createEmptyGamification(),
      });
    }

    const state = parseGamification(data.state);
    return NextResponse.json({
      empty: !gamificationHasEvidence(state),
      state,
      updatedAt: data.updated_at,
    });
  },
);

export const PUT = withUser(
  "gamification",
  SAVE_FAILED,
  async ({ request, supabase, user }) => {
    const envelope = gamificationBodySchema.safeParse(await readJson(request));
    if (!envelope.success) {
      return NextResponse.json(
        { error: envelope.error.issues[0]?.message ?? "Invalid progress payload" },
        { status: 400 },
      );
    }

    const state = parseGamification(envelope.data.state);

    const { error } = await supabase.from("gamification").upsert(
      {
        user_id: user.id,
        state,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    failOnDbError(error, "gamification", "save", SAVE_FAILED);

    return NextResponse.json({ ok: true, state });
  },
);
