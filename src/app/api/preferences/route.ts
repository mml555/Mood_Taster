import { NextResponse } from "next/server";
import { failOnDbError, readJson, withUser } from "@/lib/api-route";
import {
  dietaryPrefsSchema,
  EMPTY_DIETARY,
  parseDietary,
  uniqueDietary,
  type DietaryPrefs,
} from "@/lib/dietary";
import type { Json } from "@/lib/supabase/database.types";

const LOAD_FAILED = "Could not load your preferences";
const SAVE_FAILED = "Could not save your preferences";

function isEmptyPrefs(prefs: DietaryPrefs): boolean {
  return prefs.diets.length === 0 && prefs.allergens.length === 0;
}

export const GET = withUser(
  "preferences",
  LOAD_FAILED,
  async ({ supabase, user }) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("dietary, updated_at")
      .eq("id", user.id)
      .maybeSingle();

    failOnDbError(error, "preferences", "load", LOAD_FAILED);

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
  },
);

export const PUT = withUser(
  "preferences",
  SAVE_FAILED,
  async ({ request, supabase, user }) => {
    const parsed = dietaryPrefsSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid dietary preferences" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        dietary: uniqueDietary(parsed.data) as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select("dietary, updated_at")
      .maybeSingle();

    failOnDbError(error, "preferences", "save", SAVE_FAILED);

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
  },
);
