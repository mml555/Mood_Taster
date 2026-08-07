"use client";

import Link from "next/link";
import { Clock, Compass, Search, Sparkles } from "lucide-react";
import { useAuthSession } from "@/lib/use-auth-session";

type ProductTab = "taste" | "dna" | "explore" | "history";

type ProductBottomNavProps = {
  current: ProductTab;
};

const TABS: {
  id: ProductTab;
  href: string;
  label: string;
  Icon: typeof Search;
}[] = [
  { id: "taste", href: "/taste", label: "Taste", Icon: Search },
  { id: "dna", href: "/dna", label: "DNA", Icon: Sparkles },
  { id: "explore", href: "/explore", label: "Explore", Icon: Compass },
  { id: "history", href: "/history", label: "History", Icon: Clock },
];

/**
 * Persistent mobile nav for authenticated users (BACKLOG P2-1).
 * Taste · DNA · Explore · History.
 */
export function ProductBottomNav({ current }: ProductBottomNavProps) {
  const auth = useAuthSession();

  if (auth.status !== "user") return null;

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
                <Icon size={20} strokeWidth={1.5} aria-hidden />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
