import { NextResponse } from "next/server";
import { failOnDbError, readJson, withUser } from "@/lib/api-route";
import { parseDnaProfile } from "@/lib/auth-schema";
import { createNeutralDna, normalizeDna } from "@/lib/dna";

const LOAD_FAILED = "Could not load your Taste DNA";
const SAVE_FAILED = "Could not save your Taste DNA";

export const GET = withUser("dna", LOAD_FAILED, async ({ supabase, user }) => {
  const { data, error } = await supabase
    .from("taste_dna")
    .select("profile, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  failOnDbError(error, "dna", "load", LOAD_FAILED);

  if (!data) {
    return NextResponse.json({ empty: true, profile: createNeutralDna() });
  }

  // parseDnaProfile upgrades flat v1 JSONB to prefs/experience v2.
  const profile = parseDnaProfile(data.profile) ?? createNeutralDna();
  return NextResponse.json({
    empty: false,
    profile: normalizeDna(profile),
    updatedAt: data.updated_at,
  });
});

export const PUT = withUser(
  "dna",
  SAVE_FAILED,
  async ({ request, supabase, user }) => {
    const body = (await readJson(request)) as { profile?: unknown } | null;
    const parsed = parseDnaProfile(body?.profile);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid Taste DNA payload" },
        { status: 400 },
      );
    }

    // Always persist v2 so cloud rows upgrade on next save.
    const profile = normalizeDna(parsed);

    const { error } = await supabase.from("taste_dna").upsert(
      {
        user_id: user.id,
        profile,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    failOnDbError(error, "dna", "save", SAVE_FAILED);

    return NextResponse.json({ ok: true, profile });
  },
);
