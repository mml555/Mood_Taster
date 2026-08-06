import { NextResponse } from "next/server";
import { parseDnaProfile } from "@/lib/auth-schema";
import { createNeutralDna } from "@/lib/dna";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";

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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ empty: true, profile: createNeutralDna() });
    }

    const profile = parseDnaProfile(data.profile) ?? createNeutralDna();
    return NextResponse.json({
      empty: false,
      profile,
      updatedAt: data.updated_at,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load DNA";
    return NextResponse.json({ error: message }, { status: 500 });
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
    const profile = parseDnaProfile(body.profile);
    if (!profile) {
      return NextResponse.json(
        { error: "Invalid Taste DNA payload" },
        { status: 400 },
      );
    }

    const { error } = await supabase.from("taste_dna").upsert(
      {
        user_id: user.id,
        profile,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, profile });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save DNA";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
