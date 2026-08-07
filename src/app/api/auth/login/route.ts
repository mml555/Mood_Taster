import { NextResponse } from "next/server";
import { z } from "zod";
import { usernameSchema } from "@/lib/auth-schema";
import { clientRateKey, enforceRateLimit } from "@/lib/rate-limit";
import { reportServerError } from "@/lib/server-errors";
import { createServiceClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Password sign-in, start to finish, on the server.
 *
 * An earlier version resolved username to email and handed the address back to
 * the browser so the client could sign in. That turned a public identifier into
 * private data: anyone could POST a username and read the account owner's email
 * without holding the password. The lookup still happens, but the email never
 * leaves this process.
 *
 * Every rejection returns the same message and the same status. Anything that
 * varies by cause (unknown username vs wrong password vs unconfigured service
 * role) is an enumeration oracle, so causes are logged here and never returned.
 */

const loginSchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1).max(72),
});

const INVALID = "Invalid email, username, or password";
const TOO_MANY = "Too many sign-in attempts. Try again in a minute";

/** 10 attempts, refilling at 10 a minute. Well clear of a person mistyping. */
const LOGIN_BUCKET = { capacity: 10, refillPerMs: 10 / 60_000 };

function invalid() {
  return NextResponse.json({ error: INVALID }, { status: 401 });
}

/**
 * Mark an auth user confirmed by email. Used to recover accounts created while
 * Supabase required inbox verification. Returns false on any miss or fault.
 */
async function confirmEmail(email: string): Promise<boolean> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return false;

  try {
    const admin = createServiceClient();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY.trim();
    if (!url || !key) return false;

    // GoTrue admin list supports ?email=; avoid paging the whole user table.
    const res = await fetch(
      `${url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${key}`,
          apikey: key,
        },
        cache: "no-store",
      },
    );
    if (!res.ok) {
      reportServerError(
        "auth",
        new Error(`confirmEmail list failed: ${res.status}`),
        { kind: "confirm_list" },
      );
      return false;
    }

    const body = (await res.json()) as {
      users?: Array<{ id: string; email?: string | null }>;
    };
    const user = body.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (!user) return false;

    const { error } = await admin.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    });
    if (error) {
      reportServerError("auth", error, { kind: "confirm_update" });
      return false;
    }
    return true;
  } catch (err) {
    reportServerError("auth", err, { kind: "confirm" });
    return false;
  }
}

/**
 * Username to email, via the service role because `profiles` is owner-only
 * readable and the caller is anonymous at this point. Returns null for every
 * failure so the caller cannot tell "no such user" from "lookup broken".
 */
async function emailForUsername(identifier: string): Promise<string | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    reportServerError(
      "auth",
      new Error(
        "username sign-in needs SUPABASE_SERVICE_ROLE_KEY; falling back to invalid credentials",
      ),
      { kind: "config" },
    );
    return null;
  }

  const username = usernameSchema.safeParse(identifier);
  if (!username.success) return null;

  try {
    const admin = createServiceClient();
    const { data, error } = await admin.rpc("email_for_username", {
      lookup_username: username.data,
    });

    if (error) {
      reportServerError(
        "auth",
        new Error(`email_for_username failed: ${error.message}`),
        { kind: "database" },
      );
      return null;
    }

    return typeof data === "string" && data.length > 0 ? data : null;
  } catch (err) {
    reportServerError("auth", err, { kind: "lookup" });
    return null;
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Accounts are not configured" },
      { status: 503 },
    );
  }

  // Shared across instances when a Redis store is configured, per instance
  // otherwise. Either way it caps how fast one caller can walk a password list.
  if (!(await enforceRateLimit(clientRateKey(request, "login"), LOGIN_BUCKET))) {
    return NextResponse.json({ error: TOO_MANY }, { status: 429 });
  }

  try {
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return invalid();
    }

    const parsed = loginSchema.safeParse(json);
    if (!parsed.success) return invalid();

    const { identifier, password } = parsed.data;

    const email = identifier.includes("@")
      ? identifier.toLowerCase()
      : await emailForUsername(identifier);

    if (!email) return invalid();

    // Signing in through the SSR client is what writes the session cookies onto
    // this response, so the browser is authenticated when this returns.
    const supabase = await createClient();
    let { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Accounts created while Supabase "Confirm email" was on never get a
    // session. GoTrue only returns this after the password checks out, so
    // confirming here unlocks stuck users without weakening auth.
    if (error && /email not confirmed/i.test(error.message)) {
      const unlocked = await confirmEmail(email);
      if (unlocked) {
        ({ error } = await supabase.auth.signInWithPassword({
          email,
          password,
        }));
      }
    }

    if (error) {
      // Log only, deliberately. A wrong password is the system working, not a
      // fault, and routing it to error tracking would bury real issues under
      // everyday typos.
      console.error("[auth] sign-in rejected:", error.message);
      return invalid();
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    reportServerError("auth", err, { kind: "unhandled" });
    return NextResponse.json({ error: "Could not sign in" }, { status: 500 });
  }
}
