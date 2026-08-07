"use client";

import Link from "next/link";
import { LogIn, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type AuthNavState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "user"; username: string | null };

export function AuthNav({ current }: { current?: string }) {
  const [state, setState] = useState<AuthNavState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    queueMicrotask(() => {
      if (!isSupabaseConfigured()) {
        if (!cancelled) setState({ status: "guest" });
        return;
      }

      const supabase = createClient();

      void (async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled) return;

        if (!user) {
          setState({ status: "guest" });
          return;
        }

        const { data } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .maybeSingle();

        if (!cancelled) {
          setState({ status: "user", username: data?.username ?? null });
        }
      })();

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session?.user) {
          setState({ status: "guest" });
          return;
        }
        void supabase
          .from("profiles")
          .select("username")
          .eq("id", session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (!cancelled) {
              setState({ status: "user", username: data?.username ?? null });
            }
          });
      });

      unsubscribe = () => subscription.unsubscribe();
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  if (state.status === "loading") {
    return null;
  }

  if (state.status === "user") {
    return (
      <Link
        className="nav-primary nav-with-icon"
        href="/account"
        aria-label={state.username ? `Account @${state.username}` : "Account"}
        aria-current={current === "account" ? "page" : undefined}
      >
        <UserRound size={16} strokeWidth={1.5} aria-hidden />
        <span className="nav-label">
          {state.username ? `@${state.username}` : "Account"}
        </span>
      </Link>
    );
  }

  return (
    <>
      <Link className="nav-save" href="/signup">
        Save
      </Link>
      <Link
        className="nav-primary nav-with-icon"
        href="/login"
        aria-label="Sign in"
        aria-current={current === "account" ? "page" : undefined}
      >
        <LogIn size={16} strokeWidth={1.5} aria-hidden />
        <span className="nav-label">Sign in</span>
      </Link>
    </>
  );
}
