import { NextResponse } from "next/server";
import { failOnDbError, readJson, withUser } from "@/lib/api-route";
import { favoritesBodySchema } from "@/lib/api-schemas";
import { parseFavoriteIds } from "@/lib/favorites";

const LOAD_FAILED = "Could not load your favorites";
const SAVE_FAILED = "Could not save your favorites";

export const GET = withUser(
  "favorites",
  LOAD_FAILED,
  async ({ supabase, user }) => {
    const { data, error } = await supabase
      .from("favorites")
      .select("food_ids, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    failOnDbError(error, "favorites", "load", LOAD_FAILED);

    if (!data) {
      return NextResponse.json({ empty: true, foodIds: [] });
    }

    return NextResponse.json({
      empty: false,
      foodIds: parseFavoriteIds(data.food_ids),
      updatedAt: data.updated_at,
    });
  },
);

export const PUT = withUser(
  "favorites",
  SAVE_FAILED,
  async ({ request, supabase, user }) => {
    const envelope = favoritesBodySchema.safeParse(await readJson(request));
    if (!envelope.success) {
      return NextResponse.json({ error: "Invalid favorites" }, { status: 400 });
    }

    // parseFavoriteIds drops unknown ids, dedupes, and caps the list.
    const foodIds = parseFavoriteIds(envelope.data.foodIds);

    const { error } = await supabase.from("favorites").upsert(
      {
        user_id: user.id,
        food_ids: foodIds,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    failOnDbError(error, "favorites", "save", SAVE_FAILED);

    return NextResponse.json({ ok: true, foodIds });
  },
);
