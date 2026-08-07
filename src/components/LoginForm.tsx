"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { loadDnaForUser } from "@/lib/dna-sync";
import { loadHistoryForUser } from "@/lib/history-sync";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/auth-schema";
import { loadDietaryForUser } from "@/lib/dietary-sync";
import { loadFavoritesForUser } from "@/lib/favorites-sync";
import { loadGamificationForUser } from "@/lib/gamification-sync";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!isSupabaseConfigured()) {
    return (
      <p className="auth-error" role="alert">
        Accounts are not configured yet. Add{" "}
        <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code>.env</code>.
      </p>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const parsed = loginSchema.safeParse({
      identifier: form.get("identifier"),
      password: form.get("password"),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details");
      setPending(false);
      return;
    }

    try {
      // Sign-in happens server side. The response carries the session cookies;
      // the browser never sees the account's email address.
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: parsed.data.identifier,
          password: parsed.data.password,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(body.error ?? "Could not sign in");
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
      router.push("/account");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      setPending(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <label className="auth-label" htmlFor="identifier">
        Email or username
      </label>
      <input
        id="identifier"
        name="identifier"
        className="auth-input"
        autoComplete="username"
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
        autoComplete="current-password"
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
        {pending ? "Signing in…" : "Sign in"}
      </button>

      <p className="auth-switch">
        New here? <Link href="/signup">Create an account</Link>
      </p>
    </form>
  );
}
