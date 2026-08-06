import Link from "next/link";

type SiteHeaderProps = {
  current?: "home" | "prd";
};

export function SiteHeader({ current = "home" }: SiteHeaderProps) {
  return (
    <header className="top">
      <Link className="mark" href="/">
        Mood Taster
      </Link>
      <nav aria-label="Primary">
        {current === "home" ? (
          <>
            <a href="#how">How it works</a>
            <Link href="/prd/">PRD</Link>
          </>
        ) : (
          <>
            <Link href="/">Home</Link>
            <Link href="/prd/" aria-current="page">
              PRD
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
