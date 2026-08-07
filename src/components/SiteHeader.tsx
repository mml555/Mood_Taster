"use client";

import Link from "next/link";
import { Dna, Utensils } from "lucide-react";
import { AuthNav } from "@/components/AuthNav";
import { useAuthSession } from "@/lib/use-auth-session";

type SiteHeaderProps = {
  current?:
    | "home"
    | "taste"
    | "result"
    | "dna"
    | "explore"
    | "favorites"
    | "history"
    | "account"
    | "prd"
    | "strategy"
    | "brand"
    | "legal";
};

/**
 * Product chrome: brand lockup or welcome row + Sign In / DNA Profile.
 * Mobile tabs live in ProductBottomNav.
 */
export function SiteHeader({ current = "home" }: SiteHeaderProps) {
  const auth = useAuthSession();
  const onDocs =
    current === "prd" ||
    current === "strategy" ||
    current === "brand" ||
    current === "legal";
  const onAuthSurface =
    current === "account" &&
    (typeof window === "undefined" || true);

  return (
    <header className={current === "home" ? "top top-home" : "top top-compact"}>
      <div className="nav-brand-row">
        {auth.status === "user" ? (
          <Link href="/account" className="nav-brand-row">
            <span
              className="profile-avatar"
              style={{ width: "2.75rem", height: "2.75rem", fontSize: "1rem" }}
              aria-hidden
            >
              {(auth.username ?? "M").charAt(0).toUpperCase()}
            </span>
            <span className="nav-welcome">
              <span className="nav-welcome-label">Welcome,</span>
              <span className="nav-welcome-name">
                {auth.username ?? "Friend"}
              </span>
            </span>
          </Link>
        ) : (
          <Link href="/" className="nav-brand-row">
            <Utensils size={22} strokeWidth={2} aria-hidden />
            <span>Mood Taster</span>
          </Link>
        )}
      </div>
      <nav aria-label="Primary">
        {onDocs ? (
          <>
            <Link className="nav-primary nav-with-icon" href="/taste">
              <Utensils size={16} strokeWidth={1.5} aria-hidden />
              Taste
            </Link>
            <AuthNav current={current} compact />
          </>
        ) : auth.status === "user" ? (
          <Link
            className="cta nav-with-icon"
            href="/dna"
            style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
          >
            <Dna size={16} strokeWidth={2} aria-hidden />
            DNA Profile
          </Link>
        ) : onAuthSurface && current === "account" ? null : (
          <AuthNav current={current} compact />
        )}
      </nav>
    </header>
  );
}
