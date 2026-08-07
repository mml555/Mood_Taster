import { NextResponse } from "next/server";
import { parseDnaProfile } from "@/lib/auth-schema";
import { createNeutralDna, normalizeDna } from "@/lib/dna";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";

/**
 * Database errors are logged, never returned. The raw Postgres message names
 * schemas, functions, and constraints, which is free reconnaissance for an
 * anonymous caller and tells the user nothing they can act on.
 */
const LOAD_FAILED = "Could not load your Taste DNA";
const SAVE_FAILED = "Could not save your Taste DNA";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Accounts are not configured" },
      { status: 503 },
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("taste_dna")
      .select("profile, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[dna] load failed:", error.message);
      return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
    }

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
  } catch (err) {
    console.error("[dna] load threw:", err);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Accounts are not configured" },
      { status: 503 },
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { profile?: unknown };
    const parsed = parseDnaProfile(body.profile);
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

    if (error) {
      console.error("[dna] save failed:", error.message);
      return NextResponse.json({ error: SAVE_FAILED }, { status: 500 });
    }

    return NextResponse.json({ ok: true, profile });
  } catch (err) {
    console.error("[dna] save threw:", err);
    return NextResponse.json({ error: SAVE_FAILED }, { status: 500 });
  }
}
