"use client";

import Link from "next/link";
import { LogIn, UserRound } from "lucide-react";
import { useAuthSession } from "@/lib/use-auth-session";

export function AuthNav({
  current,
  compact = false,
}: {
  current?: string;
  compact?: boolean;
}) {
  const state = useAuthSession();

  if (state.status === "loading") {
    return (
      <span
        className="nav-auth-slot"
        aria-hidden
        style={{ width: compact ? "2.5rem" : "5.5rem", height: "2.5rem" }}
      />
    );
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
    <Link
      className="cta nav-with-icon nav-signin"
      href="/login"
      aria-label="Sign in"
      aria-current={current === "account" ? "page" : undefined}
    >
      <LogIn size={20} strokeWidth={1.5} aria-hidden />
      <span className="nav-label">Sign in</span>
    </Link>
  );
}
