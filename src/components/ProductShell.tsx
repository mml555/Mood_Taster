"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { ProductBottomNav } from "@/components/ProductBottomNav";

type ProductTab = "taste" | "stats" | "profile";

type HeaderCurrent =
  | "home"
  | "taste"
  | "result"
  | "dna"
  | "explore"
  | "favorites"
  | "history"
  | "account";

function headerCurrent(pathname: string): HeaderCurrent {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/taste")) return "taste";
  if (pathname.startsWith("/result")) return "result";
  if (pathname.startsWith("/dna")) return "dna";
  if (pathname.startsWith("/explore") || pathname.startsWith("/passport")) {
    return "explore";
  }
  if (pathname.startsWith("/favorites")) return "favorites";
  if (pathname.startsWith("/history")) return "history";
  if (
    pathname.startsWith("/account") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup")
  ) {
    return "account";
  }
  return "taste";
}

function bottomTab(pathname: string): ProductTab | undefined {
  if (pathname.startsWith("/dna")) {
    return "stats";
  }
  if (
    pathname.startsWith("/account") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup")
  ) {
    return "profile";
  }
  if (
    pathname === "/" ||
    pathname.startsWith("/taste") ||
    pathname.startsWith("/result") ||
    pathname.startsWith("/explore") ||
    pathname.startsWith("/favorites") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/passport")
  ) {
    return "taste";
  }
  return undefined;
}

function showBottomNav(pathname: string): boolean {
  if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
    return false;
  }
  return true;
}

/**
 * Persistent product chrome. Header and bottom nav stay mounted across
 * soft navigations so the frame does not re-rise or jump between pages.
 */
export function ProductShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const current = headerCurrent(pathname);
  const tab = bottomTab(pathname);
  const withNav = showBottomNav(pathname);

  return (
    <>
      <SiteHeader current={current} />
      <main
        className={
          withNav ? "product-main product-main-with-nav" : "product-main"
        }
      >
        {children}
      </main>
      {withNav ? <ProductBottomNav current={tab} /> : null}
    </>
  );
}
