"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { loginSchema } from "@/lib/auth-schema";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { loadDnaForUser } from "@/lib/dna-sync";

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
      const resolveRes = await fetch("/api/auth/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: parsed.data.identifier }),
      });
      const resolveBody = (await resolveRes.json()) as {
        email?: string;
        error?: string;
      };

      if (!resolveRes.ok || !resolveBody.email) {
        setError(resolveBody.error ?? "Could not find that account");
        setPending(false);
        return;
      }

      const supabase = createClient();
      const { error: signError } = await supabase.auth.signInWithPassword({
        email: resolveBody.email,
        password: parsed.data.password,
      });

      if (signError) {
        setError(signError.message);
        setPending(false);
        return;
      }

      await loadDnaForUser();
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
