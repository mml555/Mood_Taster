import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";

/**
 * Wipe cloud account data, then delete the Auth user.
 *
 * Service role stays on the server. Clients never see SUPABASE_SERVICE_ROLE_KEY.
 * Row deletes are explicit so a missing ON DELETE CASCADE still clears data;
 * auth.users delete then removes anything that did cascade.
 *
 * History (P1-1): best-effort wipe of likely table names if that agent lands
 * them. Prefer ON DELETE CASCADE on those tables when they ship.
 */
const DELETE_FAILED = "Could not delete your account";
const HISTORY_TABLES = ["match_history", "history", "taste_history"] as const;

export async function DELETE() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Accounts are not configured" },
      { status: 503 },
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    console.error("[account] delete needs SUPABASE_SERVICE_ROLE_KEY");
    return NextResponse.json({ error: DELETE_FAILED }, { status: 503 });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    let admin;
    try {
      admin = createServiceClient();
    } catch (err) {
      console.error("[account] service client unavailable:", err);
      return NextResponse.json({ error: DELETE_FAILED }, { status: 503 });
    }

    const { error: dnaError } = await admin
      .from("taste_dna")
      .delete()
      .eq("user_id", userId);
    if (dnaError) {
      console.error("[account] taste_dna wipe failed:", dnaError.message);
      return NextResponse.json({ error: DELETE_FAILED }, { status: 500 });
    }

    const { error: favError } = await admin
      .from("favorites")
      .delete()
      .eq("user_id", userId);
    if (favError) {
      console.error("[account] favorites wipe failed:", favError.message);
      return NextResponse.json({ error: DELETE_FAILED }, { status: 500 });
    }

    // Parallel history work may add one of these. Prefer ON DELETE CASCADE when
    // they ship; this is a best-effort wipe until then. Tables are not in
    // database.types yet, so the client is loosely typed here.
    const loose = admin as unknown as {
      from: (name: string) => {
        delete: () => {
          eq: (
            column: string,
            value: string,
          ) => Promise<{ error: { message: string } | null }>;
        };
      };
    };

    for (const table of HISTORY_TABLES) {
      const { error: histError } = await loose
        .from(table)
        .delete()
        .eq("user_id", userId);
      if (
        histError &&
        !/does not exist|Could not find the table|schema cache/i.test(
          histError.message,
        )
      ) {
        console.error(`[account] ${table} wipe failed:`, histError.message);
      }
    }

    const { error: profileError } = await admin
      .from("profiles")
      .delete()
      .eq("id", userId);
    if (profileError) {
      console.error("[account] profiles wipe failed:", profileError.message);
      return NextResponse.json({ error: DELETE_FAILED }, { status: 500 });
    }

    const { error: authError } = await admin.auth.admin.deleteUser(userId);
    if (authError) {
      console.error("[account] auth user delete failed:", authError.message);
      return NextResponse.json({ error: DELETE_FAILED }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[account] delete threw:", err);
    return NextResponse.json({ error: DELETE_FAILED }, { status: 500 });
  }
}
