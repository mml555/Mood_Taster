import Link from "next/link";

type SiteHeaderProps = {
  current?: "home" | "prd" | "strategy" | "brand" | "legal";
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
            <a href="#how">How it works</a>
            <a href="#lanes">Lanes</a>
            {docs}
          </>
        ) : (
          <>
            <Link href="/">Home</Link>
            {docs}
          </>
        )}
      </nav>
    </header>
  );
}
