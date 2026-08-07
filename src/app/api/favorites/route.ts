import { NextResponse } from "next/server";
import { parseFavoriteIds } from "@/lib/favorites";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";

/**
 * Database errors are logged, never returned. The raw Postgres message names
 * schemas and constraints, which is free reconnaissance for an anonymous caller.
 */
const LOAD_FAILED = "Could not load your favorites";
const SAVE_FAILED = "Could not save your favorites";

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
      .from("favorites")
      .select("food_ids, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[favorites] load failed:", error.message);
      return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ empty: true, foodIds: [] });
    }

    const foodIds = parseFavoriteIds(data.food_ids);
    return NextResponse.json({
      empty: false,
      foodIds,
      updatedAt: data.updated_at,
    });
  } catch (err) {
    console.error("[favorites] load threw:", err);
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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const src = body as Record<string, unknown>;
    const foodIds = parseFavoriteIds(src.foodIds);

    const { error } = await supabase.from("favorites").upsert(
      {
        user_id: user.id,
        food_ids: foodIds,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (error) {
      console.error("[favorites] save failed:", error.message);
      return NextResponse.json({ error: SAVE_FAILED }, { status: 500 });
    }

    return NextResponse.json({ ok: true, foodIds });
  } catch (err) {
    console.error("[favorites] save threw:", err);
    return NextResponse.json({ error: SAVE_FAILED }, { status: 500 });
  }
}
