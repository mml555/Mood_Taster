import Link from "next/link";
import Image from "next/image";
import { Heart, Search, Sparkles } from "lucide-react";
import { AuthNav } from "@/components/AuthNav";

type SiteHeaderProps = {
  current?:
    | "home"
    | "taste"
    | "result"
    | "dna"
    | "favorites"
    | "account"
    | "prd"
    | "strategy"
    | "brand"
    | "legal";
};

export function SiteHeader({ current = "home" }: SiteHeaderProps) {
  const inLoop = current === "taste" || current === "result";

  return (
    <header className={inLoop ? "top top-compact" : "top"}>
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
              href="/favorites"
              aria-current={current === "favorites" ? "page" : undefined}
            >
              <Heart size={16} strokeWidth={1.5} aria-hidden />
              <span className="nav-dna-label">Saved</span>
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
