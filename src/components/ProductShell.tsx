"use client";

import { usePathname } from "next/navigation";
import { ProductBottomNav } from "@/components/ProductBottomNav";

type ProductTab = "taste" | "stats" | "profile";

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
  // Sign-in is a focused surface; keep the frame without the tab bar.
  if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
    return false;
  }
  return true;
}

/**
 * Product chrome: content + Taste · Stats · Profile tab bar.
 * No site header or footer. Tabs stay mounted across soft navigations.
 */
export function ProductShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const tab = bottomTab(pathname);
  const withNav = showBottomNav(pathname);

  return (
    <>
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
