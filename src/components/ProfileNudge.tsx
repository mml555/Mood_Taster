"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type ProfileNudgeProps = {
  /** Where the nudge sits: drives the one-line pitch. */
  context?: "result" | "dna" | "home";
};

/**
 * Soft prompt only. Never blocks the flow. Hidden when signed in or when
 * Supabase is not configured.
 */
export function ProfileNudge({ context = "dna" }: ProfileNudgeProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!isSupabaseConfigured()) {
        if (!cancelled) setShow(false);
        return;
      }

      void (async () => {
        try {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!cancelled) setShow(!user);
        } catch {
          if (!cancelled) setShow(false);
        }
      })();
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!show) return null;

  const copy =
    context === "result"
      ? "Like how this is shaping up? Save a free profile so your Taste DNA follows you, and you can tune it over time."
      : context === "home"
        ? "No account needed to find a dish. A free profile saves your Taste DNA so matches get more you."
        : "This Taste DNA lives on this device for now. Save a free profile to keep it, sync it, and customize how you get matched.";

  return (
    <aside className="profile-nudge" aria-label="Save your taste profile">
      <p className="profile-nudge-copy">{copy}</p>
      <div className="profile-nudge-actions">
        <Link className="cta" href="/signup">
          Save my taste
        </Link>
        <Link className="text-link" href="/login">
          Sign in
        </Link>
        <span className="profile-nudge-aside">Optional. You can keep going.</span>
      </div>
    </aside>
  );
}
