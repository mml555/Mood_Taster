import { NextResponse } from "next/server";
import {
  historyAppendSchema,
  historyPatchSchema,
} from "@/lib/api-schemas";
import {
  parseHistoryEntries,
  parseHistoryEntry,
  HISTORY_CAP,
} from "@/lib/history";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

const LOAD_FAILED = "Could not load your history";
const SAVE_FAILED = "Could not save your history";
const DELETE_FAILED = "Could not update your history";

type HistoryRow = {
  id: string;
  food_id: string;
  intent: string;
  rating: string | null;
  answers: Json | null;
  place: Json | null;
  created_at: string;
};

function rowToEntry(row: HistoryRow) {
  return parseHistoryEntry({
    id: row.id,
    foodId: row.food_id,
    intent: row.intent,
    rating: row.rating,
    answers: row.answers,
    place: row.place,
    createdAt: row.created_at,
  });
}

export async function GET(request: Request) {
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

    const url = new URL(request.url);
    const rawLimit = Number(url.searchParams.get("limit") ?? HISTORY_CAP);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(1, Math.floor(rawLimit)), HISTORY_CAP)
      : HISTORY_CAP;

    const { data, error } = await supabase
      .from("recommendation_history")
      .select("id, food_id, intent, rating, answers, place, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[history] load failed:", error.message);
      return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
    }

    const rows = (data ?? []) as HistoryRow[];
    const entries = parseHistoryEntries(
      rows.map((row) => rowToEntry(row)).filter(Boolean),
    );

    return NextResponse.json({
      empty: entries.length === 0,
      entries,
    });
  } catch (err) {
    console.error("[history] load threw:", err);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const parsed = historyAppendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid history payload" },
        { status: 400 },
      );
    }

    const entry = parseHistoryEntry({
      ...parsed.data,
      createdAt: parsed.data.createdAt ?? new Date().toISOString(),
    });
    if (!entry) {
      return NextResponse.json(
        { error: "Invalid history payload" },
        { status: 400 },
      );
    }

    const { error } = await supabase.from("recommendation_history").upsert(
      {
        id: entry.id,
        user_id: user.id,
        food_id: entry.foodId,
        intent: entry.intent,
        rating: entry.rating,
        answers: entry.answers,
        place: entry.place,
        created_at: entry.createdAt,
      },
      { onConflict: "id" },
    );

    if (error) {
      console.error("[history] save failed:", error.message);
      return NextResponse.json({ error: SAVE_FAILED }, { status: 500 });
    }

    // Cap: drop oldest beyond HISTORY_CAP for this user.
    const { data: overflow } = await supabase
      .from("recommendation_history")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(HISTORY_CAP, HISTORY_CAP + 50);

    if (overflow && overflow.length > 0) {
      const dropIds = overflow.map((row) => row.id as string);
      await supabase
        .from("recommendation_history")
        .delete()
        .eq("user_id", user.id)
        .in("id", dropIds);
    }

    return NextResponse.json({ ok: true, entry });
  } catch (err) {
    console.error("[history] save threw:", err);
    return NextResponse.json({ error: SAVE_FAILED }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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

    const parsed = historyPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid history patch" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("recommendation_history")
      .update({ rating: parsed.data.rating })
      .eq("user_id", user.id)
      .eq("id", parsed.data.id);

    if (error) {
      console.error("[history] patch failed:", error.message);
      return NextResponse.json({ error: SAVE_FAILED }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: parsed.data.id, rating: parsed.data.rating });
  } catch (err) {
    console.error("[history] patch threw:", err);
    return NextResponse.json({ error: SAVE_FAILED }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
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

    const url = new URL(request.url);
    const clearAll = url.searchParams.get("all") === "1";
    const id = url.searchParams.get("id");

    if (clearAll) {
      const { error } = await supabase
        .from("recommendation_history")
        .delete()
        .eq("user_id", user.id);
      if (error) {
        console.error("[history] clear failed:", error.message);
        return NextResponse.json({ error: DELETE_FAILED }, { status: 500 });
      }
      return NextResponse.json({ ok: true, cleared: true });
    }

    if (!id || id.length > 80) {
      return NextResponse.json(
        { error: "Provide id or all=1" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("recommendation_history")
      .delete()
      .eq("user_id", user.id)
      .eq("id", id);

    if (error) {
      console.error("[history] delete failed:", error.message);
      return NextResponse.json({ error: DELETE_FAILED }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("[history] delete threw:", err);
    return NextResponse.json({ error: DELETE_FAILED }, { status: 500 });
  }
}
