import { NextResponse } from "next/server";
import { failOnDbError, HttpError, withUser } from "@/lib/api-route";
import { createServiceClient } from "@/lib/supabase/admin";

/**
 * Wipe cloud account data, then delete the Auth user.
 *
 * Service role stays on the server. Clients never see SUPABASE_SERVICE_ROLE_KEY.
 * Every table already cascades from auth.users, but the rows are deleted
 * explicitly first so a dropped or forgotten ON DELETE CASCADE still leaves
 * nothing behind.
 */
const DELETE_FAILED = "Could not delete your account";

export const DELETE = withUser(
  "account",
  DELETE_FAILED,
  async ({ user }) => {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
      console.error("[account] delete needs SUPABASE_SERVICE_ROLE_KEY");
      throw new HttpError(503, DELETE_FAILED);
    }

    let admin;
    try {
      admin = createServiceClient();
    } catch (err) {
      console.error("[account] service client unavailable:", err);
      throw new HttpError(503, DELETE_FAILED);
    }

    const userId = user.id;

    // Built as thenables, awaited in order below. Profiles goes last so a
    // partial failure leaves the account recognisable in support tooling.
    const wipes = [
      ["taste_dna", admin.from("taste_dna").delete().eq("user_id", userId)],
      ["favorites", admin.from("favorites").delete().eq("user_id", userId)],
      [
        "recommendation_history",
        admin.from("recommendation_history").delete().eq("user_id", userId),
      ],
      ["profiles", admin.from("profiles").delete().eq("id", userId)],
    ] as const;

    for (const [table, pending] of wipes) {
      const { error } = await pending;
      // Soft-fail when recommendation_history is not applied yet in Supabase.
      if (
        table === "recommendation_history" &&
        error &&
        /does not exist|Could not find the table|schema cache/i.test(
          error.message,
        )
      ) {
        continue;
      }
      failOnDbError(error, "account", `${table} wipe`, DELETE_FAILED);
    }

    const { error: authError } = await admin.auth.admin.deleteUser(userId);
    failOnDbError(authError, "account", "auth user delete", DELETE_FAILED);

    return NextResponse.json({ ok: true });
  },
);
