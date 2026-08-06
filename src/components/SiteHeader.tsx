import Link from "next/link";
import Image from "next/image";
import { Home, Sparkles } from "lucide-react";
import { AuthNav } from "@/components/AuthNav";

type SiteHeaderProps = {
  current?:
    | "home"
    | "taste"
    | "result"
    | "dna"
    | "account"
    | "prd"
    | "strategy"
    | "brand"
    | "legal";
};

export function SiteHeader({ current = "home" }: SiteHeaderProps) {
  return (
    <header className="top">
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
      <nav aria-label="Primary">
        {current === "home" ? (
          <>
            <Link className="nav-primary" href="/taste">
              Start
            </Link>
            <a className="nav-secondary" href="#how">
              How it works
            </a>
            <Link className="nav-primary nav-with-icon" href="/dna">
              <Sparkles size={16} strokeWidth={1.5} aria-hidden />
              DNA
            </Link>
            <AuthNav current={current} />
          </>
        ) : (
          <>
            <Link className="nav-primary nav-with-icon" href="/">
              <Home size={16} strokeWidth={1.5} aria-hidden />
              <span className="nav-label">Home</span>
            </Link>
            <Link
              className="nav-primary"
              href="/taste"
              aria-current={current === "taste" ? "page" : undefined}
            >
              Quiz
            </Link>
            <Link
              className="nav-primary nav-with-icon"
              href="/dna"
              aria-current={current === "dna" ? "page" : undefined}
            >
              <Sparkles size={16} strokeWidth={1.5} aria-hidden />
              DNA
            </Link>
            <AuthNav current={current} />
          </>
        )}
        <span className="nav-docs" aria-label="Docs">
          <Link href="/prd" aria-current={current === "prd" ? "page" : undefined}>
            PRD
          </Link>
          <Link
            href="/strategy"
            aria-current={current === "strategy" ? "page" : undefined}
          >
            Strategy
          </Link>
          <Link
            href="/brand"
            aria-current={current === "brand" ? "page" : undefined}
          >
            Brand
          </Link>
        </span>
      </nav>
    </header>
  );
}
