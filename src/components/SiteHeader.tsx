import Link from "next/link";
import Image from "next/image";
import { Clock, Compass, Heart, Search, Sparkles } from "lucide-react";
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

export function SiteHeader({ current = "home" }: SiteHeaderProps) {
  const inLoop = current === "taste" || current === "result";
  const onHome = current === "home";

  return (
    <header
      className={
        onHome ? "top top-home" : inLoop ? "top top-compact" : "top"
      }
    >
      {/* Home hero already owns the brand mark; skip the lockup there. */}
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
            <Link className="nav-primary nav-with-icon" href="/taste">
              <Search size={16} strokeWidth={1.5} aria-hidden />
              Start
            </Link>
            <a className="nav-secondary" href="#how">
              How it works
            </a>
            <Link className="nav-primary nav-with-icon" href="/dna">
              <Sparkles size={16} strokeWidth={1.5} aria-hidden />
              <span className="nav-dna-label">DNA</span>
            </Link>
            <AuthNav current={current} />
          </>
        ) : inLoop ? (
          <>
            <Link className="nav-primary nav-with-icon" href="/dna">
              <Sparkles size={16} strokeWidth={1.5} aria-hidden />
              <span className="nav-dna-label">DNA</span>
            </Link>
            <AuthNav current={current} compact />
          </>
        ) : (
          <>
            <Link className="nav-primary nav-with-icon" href="/taste">
              <Search size={16} strokeWidth={1.5} aria-hidden />
              Quiz
            </Link>
            <Link
              className="nav-primary nav-with-icon"
              href="/explore"
              aria-current={current === "explore" ? "page" : undefined}
            >
              <Compass size={16} strokeWidth={1.5} aria-hidden />
              <span className="nav-dna-label">Explore</span>
            </Link>
            <Link
              className="nav-primary nav-with-icon"
              href="/favorites"
              aria-current={current === "favorites" ? "page" : undefined}
            >
              <Heart size={16} strokeWidth={1.5} aria-hidden />
              <span className="nav-dna-label">Saved</span>
            </Link>
            <Link
              className="nav-primary nav-with-icon"
              href="/history"
              aria-current={current === "history" ? "page" : undefined}
            >
              <Clock size={16} strokeWidth={1.5} aria-hidden />
              <span className="nav-dna-label">History</span>
            </Link>
            <Link
              className="nav-primary nav-with-icon"
              href="/dna"
              aria-current={current === "dna" ? "page" : undefined}
            >
              <Sparkles size={16} strokeWidth={1.5} aria-hidden />
              <span className="nav-dna-label">DNA</span>
            </Link>
            <AuthNav current={current} />
          </>
        )}
      </nav>
    </header>
  );
}
