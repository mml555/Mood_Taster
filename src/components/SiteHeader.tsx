"use client";

import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, UserRound, Utensils } from "lucide-react";
import { AuthNav } from "@/components/AuthNav";

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

const PRODUCT_LINKS = [
  { id: "taste", href: "/taste", label: "Taste", Icon: Utensils },
  { id: "stats", href: "/dna", label: "Stats", Icon: LayoutDashboard },
  { id: "profile", href: "/account", label: "Profile", Icon: UserRound },
] as const;

function productActive(
  current: SiteHeaderProps["current"],
): "taste" | "stats" | "profile" | null {
  if (current === "dna") return "stats";
  if (current === "account") return "profile";
  if (
    current === "home" ||
    current === "taste" ||
    current === "result" ||
    current === "explore" ||
    current === "favorites" ||
    current === "history"
  ) {
    return "taste";
  }
  return null;
}

/**
 * Product chrome stays visually stable. Home skips the lockup (hero owns brand).
 * Everywhere else: lockup + desktop product tabs + auth. Mobile tabs live in
 * ProductBottomNav; header product links use .nav-tab and hide ≤720px.
 */
export function SiteHeader({ current = "home" }: SiteHeaderProps) {
  const onHome = current === "home";
  const onDocs =
    current === "prd" ||
    current === "strategy" ||
    current === "brand" ||
    current === "legal";
  const active = productActive(current);

  return (
    <header className={onHome ? "top top-home" : "top top-compact"}>
      {!onHome ? (
        <Link className="mark" href="/">
          <Image
            className="mark-lockup"
            src="/brand/lockup-purple-sm.png"
            alt="Mood Taster"
            width={200}
            height={26}
            priority
          />
        </Link>
      ) : null}
      <nav aria-label="Primary">
        {onHome ? (
          <>
            <a className="nav-secondary" href="#how">
              How it works
            </a>
            <AuthNav current={current} compact />
          </>
        ) : onDocs ? (
          <>
            <Link className="nav-primary nav-with-icon" href="/taste">
              <Utensils size={16} strokeWidth={1.5} aria-hidden />
              Taste
            </Link>
            <AuthNav current={current} compact />
          </>
        ) : (
          <>
            {PRODUCT_LINKS.map(({ id, href, label, Icon }) => (
              <Link
                key={id}
                className="nav-primary nav-with-icon nav-tab"
                href={href}
                aria-current={active === id ? "page" : undefined}
              >
                <Icon size={16} strokeWidth={1.5} aria-hidden />
                <span className="nav-dna-label">{label}</span>
              </Link>
            ))}
            <AuthNav current={current} compact />
          </>
        )}
      </nav>
    </header>
  );
}
