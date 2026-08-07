"use client";

import Link from "next/link";
import { LogIn, Sparkles } from "lucide-react";
import { useAuthSession } from "@/lib/use-auth-session";

type ProfileNudgeProps = {
  /** Where the nudge sits: drives the one-line pitch. */
  context?: "result" | "dna" | "home";
};

/**
 * Soft prompt only. Never blocks the flow. Hidden when signed in or when
 * Supabase is not configured.
 */
export function ProfileNudge({ context = "dna" }: ProfileNudgeProps) {
  const auth = useAuthSession();

  if (auth.status !== "guest") return null;

  const copy =
    context === "result"
      ? "Want this Taste DNA to follow you? Save a free profile."
      : context === "home"
        ? "No account needed. A free profile saves your Taste DNA."
        : "This Taste DNA lives on this device. Save a free profile to keep it.";

  return (
    <aside className="profile-nudge" aria-label="Save your taste profile">
      <p className="profile-nudge-copy">{copy}</p>
      <div className="profile-nudge-actions">
        <Link className="cta" href="/signup">
          <Sparkles size={20} strokeWidth={1.5} aria-hidden />
          Save my taste
        </Link>
        <Link className="text-link" href="/login">
          <LogIn size={16} strokeWidth={1.5} aria-hidden />
          Sign in
        </Link>
        <span className="profile-nudge-aside">Optional.</span>
      </div>
    </aside>
  );
}
