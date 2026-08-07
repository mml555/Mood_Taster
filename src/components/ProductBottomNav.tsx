"use client";

import Link from "next/link";
import { LayoutDashboard, UserRound, Utensils } from "lucide-react";

type ProductTab = "taste" | "stats" | "profile";

type ProductBottomNavProps = {
  current?: ProductTab;
};

const TABS: {
  id: ProductTab;
  href: string;
  label: string;
  Icon: typeof Utensils;
}[] = [
  { id: "taste", href: "/", label: "Taste", Icon: Utensils },
  { id: "stats", href: "/dna", label: "Stats", Icon: LayoutDashboard },
  { id: "profile", href: "/account", label: "Profile", Icon: UserRound },
];

/**
 * Product nav: Taste · Stats · Profile (prototype IA).
 */
export function ProductBottomNav({ current }: ProductBottomNavProps) {
  return (
    <nav className="product-bottom-nav" aria-label="Product">
      <ul className="product-bottom-nav-list">
        {TABS.map(({ id, href, label, Icon }) => {
          const active = current === id;
          return (
            <li key={id}>
              <Link
                href={href}
                className={
                  active
                    ? "product-bottom-nav-link is-active"
                    : "product-bottom-nav-link"
                }
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={
                    active
                      ? "product-bottom-nav-icon is-active"
                      : "product-bottom-nav-icon"
                  }
                >
                  <Icon size={28} strokeWidth={active ? 2 : 1.75} aria-hidden />
                </span>
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
