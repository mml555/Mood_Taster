import { NextResponse } from "next/server";
import { signupSchema } from "@/lib/auth-schema";
import { clientRateKey, enforceRateLimit } from "@/lib/rate-limit";
import { reportServerError } from "@/lib/server-errors";
import { createServiceClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Create account and sign in in one shot.
 *
 * Client `signUp` respects Supabase "Confirm email". When that toggle is on,
 * GoTrue returns no session and the user is stuck until they click a mail link.
 * This product treats accounts as optional taste memory, not a verified inbox,
 * so we provision with the service role (`email_confirm: true`) and set the
 * session cookies here. Same pattern as `/api/auth/login`.
 */

const TOO_MANY = "Too many sign-up attempts. Try again in a minute";

/** 5 attempts, refilling at 5 a minute. Signup is rarer than mistyped logins. */
const SIGNUP_BUCKET = { capacity: 5, refillPerMs: 5 / 60_000 };

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Accounts are not configured" },
      { status: 503 },
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    reportServerError(
      "auth",
      new Error("signup needs SUPABASE_SERVICE_ROLE_KEY"),
      { kind: "config" },
    );
    return NextResponse.json(
      { error: "Accounts are not configured" },
      { status: 503 },
    );
  }

  if (
    !(await enforceRateLimit(clientRateKey(request, "signup"), SIGNUP_BUCKET))
  ) {
    return NextResponse.json({ error: TOO_MANY }, { status: 429 });
  }

  try {
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: "Check your details" }, { status: 400 });
    }

    const parsed = signupSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Check your details" },
        { status: 400 },
      );
    }

    const username = parsed.data.username;
    const email = parsed.data.email.toLowerCase();
    const password = parsed.data.password;
    const admin = createServiceClient();

    const { data: taken, error: lookupError } = await admin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (lookupError) {
      reportServerError("auth", lookupError, { kind: "username_lookup" });
      return NextResponse.json(
        { error: "Could not create account" },
        { status: 500 },
      );
    }

    if (taken) {
      return NextResponse.json(
        { error: "That username is taken" },
        { status: 409 },
      );
    }

    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          username,
          display_name: username,
        },
      });

    if (createError || !created.user) {
      const message = createError?.message ?? "Could not create account";
      // Duplicate email is a normal rejection, not a server fault.
      if (/already|registered|exists/i.test(message)) {
        return NextResponse.json(
          { error: "An account with that email already exists" },
          { status: 409 },
        );
      }
      reportServerError("auth", createError ?? new Error(message), {
        kind: "create_user",
      });
      return NextResponse.json(
        { error: "Could not create account" },
        { status: 500 },
      );
    }

    // Trigger usually inserts the profile; upsert covers lag or a failed trigger.
    const { error: profileError } = await admin.from("profiles").upsert({
      id: created.user.id,
      username,
      display_name: username,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      reportServerError("auth", profileError, { kind: "profile_upsert" });
      // User exists; still try to sign them in so they are not stranded.
    }

    const supabase = await createClient();
    const { error: signError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signError) {
      reportServerError("auth", signError, { kind: "signup_sign_in" });
      return NextResponse.json(
        { error: "Account created, but sign-in failed. Try signing in." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    reportServerError("auth", err, { kind: "signup_unhandled" });
    return NextResponse.json(
      { error: "Could not create account" },
      { status: 500 },
    );
  }
}
