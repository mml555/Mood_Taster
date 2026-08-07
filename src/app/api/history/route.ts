import { NextResponse } from "next/server";
import { failOnDbError, readJson, withUser } from "@/lib/api-route";
import { historyAppendSchema, historyPatchSchema } from "@/lib/api-schemas";
import {
  parseHistoryEntries,
  parseHistoryEntry,
  HISTORY_CAP,
} from "@/lib/history";
import type { Database } from "@/lib/supabase/database.types";

const LOAD_FAILED = "Could not load your history";
const SAVE_FAILED = "Could not save your history";
const DELETE_FAILED = "Could not update your history";

const ROW_COLUMNS = "id, food_id, intent, rating, answers, place, created_at";

type HistoryRow =
  Database["public"]["Tables"]["recommendation_history"]["Row"];

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

/** Clamp ?limit to 1..HISTORY_CAP; anything unparseable means the full page. */
function readLimit(request: Request): number {
  const raw = Number(
    new URL(request.url).searchParams.get("limit") ?? HISTORY_CAP,
  );
  if (!Number.isFinite(raw)) return HISTORY_CAP;
  return Math.min(Math.max(1, Math.floor(raw)), HISTORY_CAP);
}

export const GET = withUser(
  "history",
  LOAD_FAILED,
  async ({ request, supabase, user }) => {
    const { data, error } = await supabase
      .from("recommendation_history")
      .select(ROW_COLUMNS)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(readLimit(request));

    failOnDbError(error, "history", "load", LOAD_FAILED);

    const entries = parseHistoryEntries(
      (data ?? []).map((row) => rowToEntry(row as HistoryRow)).filter(Boolean),
    );

    return NextResponse.json({ empty: entries.length === 0, entries });
  },
);

export const POST = withUser(
  "history",
  SAVE_FAILED,
  async ({ request, supabase, user }) => {
    const parsed = historyAppendSchema.safeParse(await readJson(request));
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

    failOnDbError(error, "history", "save", SAVE_FAILED);

    // Cap: drop oldest beyond HISTORY_CAP for this user. Best effort, so a
    // failure here still leaves the row the caller asked us to store.
    const { data: overflow } = await supabase
      .from("recommendation_history")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(HISTORY_CAP, HISTORY_CAP + 50);

    if (overflow && overflow.length > 0) {
      await supabase
        .from("recommendation_history")
        .delete()
        .eq("user_id", user.id)
        .in(
          "id",
          overflow.map((row) => row.id),
        );
    }

    return NextResponse.json({ ok: true, entry });
  },
);

export const PATCH = withUser(
  "history",
  SAVE_FAILED,
  async ({ request, supabase, user }) => {
    const parsed = historyPatchSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid history patch" },
        { status: 400 },
      );
    }

    const { id, rating } = parsed.data;
    const { error } = await supabase
      .from("recommendation_history")
      .update({ rating })
      .eq("user_id", user.id)
      .eq("id", id);

    failOnDbError(error, "history", "patch", SAVE_FAILED);

    return NextResponse.json({ ok: true, id, rating });
  },
);

export const DELETE = withUser(
  "history",
  DELETE_FAILED,
  async ({ request, supabase, user }) => {
    const params = new URL(request.url).searchParams;

    if (params.get("all") === "1") {
      const { error } = await supabase
        .from("recommendation_history")
        .delete()
        .eq("user_id", user.id);

      failOnDbError(error, "history", "clear", DELETE_FAILED);
      return NextResponse.json({ ok: true, cleared: true });
    }

    const id = params.get("id");
    if (!id || id.length > 80) {
      return NextResponse.json({ error: "Provide id or all=1" }, { status: 400 });
    }

    const { error } = await supabase
      .from("recommendation_history")
      .delete()
      .eq("user_id", user.id)
      .eq("id", id);

    failOnDbError(error, "history", "delete", DELETE_FAILED);

    return NextResponse.json({ ok: true, id });
  },
);
