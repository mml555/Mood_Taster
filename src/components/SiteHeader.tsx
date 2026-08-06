import Link from "next/link";
import Image from "next/image";
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
  const docs = (
    <>
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
    </>
  );

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
            <Link href="/taste">Start</Link>
            <a href="#how">How it works</a>
            <Link href="/dna">Taste DNA</Link>
            <AuthNav current={current} />
            {docs}
          </>
        ) : (
          <>
            <Link href="/">Home</Link>
            <Link
              href="/taste"
              aria-current={current === "taste" ? "page" : undefined}
            >
              Quiz
            </Link>
            <Link
              href="/dna"
              aria-current={current === "dna" ? "page" : undefined}
            >
              Taste DNA
            </Link>
            <AuthNav current={current} />
            {docs}
          </>
        )}
      </nav>
    </header>
  );
}
