import { NextResponse } from "next/server";
import {
  dietaryPrefsSchema,
  EMPTY_DIETARY,
  parseDietary,
  uniqueDietary,
  type DietaryPrefs,
} from "@/lib/dietary";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

/**
 * Database errors are logged, never returned. Raw Postgres messages name
 * schemas and constraints, which is free reconnaissance for a caller.
 */
const LOAD_FAILED = "Could not load your preferences";
const SAVE_FAILED = "Could not save your preferences";

function isEmptyPrefs(prefs: DietaryPrefs): boolean {
  return prefs.diets.length === 0 && prefs.allergens.length === 0;
}

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
      .from("profiles")
      .select("dietary, updated_at")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[preferences] load failed:", error.message);
      return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({
        empty: true,
        diets: EMPTY_DIETARY.diets,
        allergens: EMPTY_DIETARY.allergens,
      });
    }

    const prefs = parseDietary(data.dietary);
    return NextResponse.json({
      empty: isEmptyPrefs(prefs),
      diets: prefs.diets,
      allergens: prefs.allergens,
      updatedAt: data.updated_at,
    });
  } catch (err) {
    console.error("[preferences] load threw:", err);
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

    const parsed = dietaryPrefsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid dietary preferences" },
        { status: 400 },
      );
    }

    const prefs = uniqueDietary(parsed.data);
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("profiles")
      .update({
        dietary: prefs as unknown as Json,
        updated_at: now,
      })
      .eq("id", user.id)
      .select("dietary, updated_at")
      .maybeSingle();

    if (error) {
      console.error("[preferences] save failed:", error.message);
      return NextResponse.json({ error: SAVE_FAILED }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const saved = parseDietary(data.dietary);
    return NextResponse.json({
      ok: true,
      diets: saved.diets,
      allergens: saved.allergens,
      updatedAt: data.updated_at,
    });
  } catch (err) {
    console.error("[preferences] save threw:", err);
    return NextResponse.json({ error: SAVE_FAILED }, { status: 500 });
  }
}
