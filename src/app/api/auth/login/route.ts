import { NextResponse } from "next/server";
import { z } from "zod";
import { usernameSchema } from "@/lib/auth-schema";
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

function invalid() {
  return NextResponse.json({ error: INVALID }, { status: 401 });
}

/**
 * Username to email, via the service role because `profiles` is owner-only
 * readable and the caller is anonymous at this point. Returns null for every
 * failure so the caller cannot tell "no such user" from "lookup broken".
 */
async function emailForUsername(identifier: string): Promise<string | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "[auth] username sign-in needs SUPABASE_SERVICE_ROLE_KEY; falling back to invalid credentials",
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
      console.error("[auth] email_for_username failed:", error.message);
      return null;
    }

    return typeof data === "string" && data.length > 0 ? data : null;
  } catch (err) {
    console.error("[auth] email_for_username threw:", err);
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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("[auth] sign-in rejected:", error.message);
      return invalid();
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth] sign-in threw:", err);
    return NextResponse.json({ error: "Could not sign in" }, { status: 500 });
  }
}
