"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import { signupSchema } from "@/lib/auth-schema";
import { loadDnaForUser } from "@/lib/dna-sync";
import { loadDietaryForUser } from "@/lib/dietary-sync";
import { loadFavoritesForUser } from "@/lib/favorites-sync";
import { loadGamificationForUser } from "@/lib/gamification-sync";
import { loadHistoryForUser } from "@/lib/history-sync";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    track(ANALYTICS_EVENTS.signupShown, { source: "signup_page" });
  }, []);

  if (!isSupabaseConfigured()) {
    return (
      <p className="auth-error" role="alert">
        Accounts are not configured yet. Add{" "}
        <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code>.env</code>, then
        run <code>supabase/schema.sql</code> in your project.
      </p>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const parsed = signupSchema.safeParse({
      username: form.get("username"),
      email: form.get("email"),
      password: form.get("password"),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details");
      setPending(false);
      return;
    }

    try {
      // Create + sign-in happen server side so Confirm email cannot strand the
      // user. Cookies land on the response; the browser is signed in on OK.
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: parsed.data.username,
          email: parsed.data.email,
          password: parsed.data.password,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(body.error ?? "Could not create account");
        setPending(false);
        return;
      }

      await Promise.all([
        loadDnaForUser(),
        loadDietaryForUser(),
        loadFavoritesForUser(),
        loadHistoryForUser(),
        loadGamificationForUser(),
      ]);
      track(ANALYTICS_EVENTS.signupCompleted, { confirmed: true });
      router.push("/account");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
      setPending(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <label className="auth-label" htmlFor="username">
        Username
      </label>
      <input
        id="username"
        name="username"
        className="auth-input"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="next"
        required
        minLength={3}
        maxLength={32}
        pattern="[a-z0-9_]+"
        title="Lowercase letters, numbers, underscore"
        disabled={pending}
      />

      <label className="auth-label" htmlFor="email">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        className="auth-input"
        autoComplete="email"
        inputMode="email"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="next"
        required
        disabled={pending}
      />

      <label className="auth-label" htmlFor="password">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        className="auth-input"
        autoComplete="new-password"
        enterKeyHint="go"
        required
        minLength={8}
        disabled={pending}
      />

      {error ? (
        <p className="auth-error" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" className="cta auth-submit" disabled={pending}>
        <Sparkles size={20} strokeWidth={1.5} aria-hidden />
        {pending ? "Saving…" : "Save my taste"}
      </button>

      <p className="auth-switch">
        Prefer to keep going as a guest?{" "}
        <Link href="/taste">Back to the quiz</Link>
        {" · "}
        Already have a profile? <Link href="/login">Sign in</Link>
      </p>
    </form>
  );
}
