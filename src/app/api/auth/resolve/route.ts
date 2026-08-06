import { NextResponse } from "next/server";
import { z } from "zod";
import { usernameSchema } from "@/lib/auth-schema";
import { createServiceClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const resolveSchema = z.object({
  identifier: z.string().trim().min(1, "Email or username is required"),
});

/**
 * Resolve email or username → email for client-side password sign-in.
 * Password is still verified by Supabase Auth on the client.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Accounts are not configured" },
      { status: 503 },
    );
  }

  try {
    const json = await request.json();
    const parsed = resolveSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const identifier = parsed.data.identifier;
    if (identifier.includes("@")) {
      return NextResponse.json({ email: identifier.toLowerCase() });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          error:
            "Username login needs SUPABASE_SERVICE_ROLE_KEY. Sign in with email, or add the service role key.",
        },
        { status: 503 },
      );
    }

    const username = usernameSchema.safeParse(identifier);
    if (!username.success) {
      return NextResponse.json(
        { error: "Enter a valid username or email" },
        { status: 400 },
      );
    }

    const admin = createServiceClient();
    const { data, error } = await admin.rpc("email_for_username", {
      lookup_username: username.data,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || typeof data !== "string") {
      return NextResponse.json(
        { error: "No account found for that username" },
        { status: 404 },
      );
    }

    return NextResponse.json({ email: data });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not resolve login";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
