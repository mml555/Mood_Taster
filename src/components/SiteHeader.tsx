import Link from "next/link";

type SiteHeaderProps = {
  current?:
    | "home"
    | "taste"
    | "result"
    | "dna"
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
        Mood Taster
      </Link>
      <nav aria-label="Primary">
        {current === "home" ? (
          <>
            <Link href="/taste">Start</Link>
            <a href="#how">How it works</a>
            <Link href="/dna">Taste DNA</Link>
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
            {docs}
          </>
        )}
      </nav>
    </header>
  );
}
