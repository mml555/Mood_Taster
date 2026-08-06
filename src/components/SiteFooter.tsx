import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="foot">
      <p className="foot-brand">Mood Taster</p>
      <p className="foot-meta">
        <Link href="/prd">PRD</Link>
        {" · "}
        <a href="https://github.com/mml555/Mood_Taster">GitHub</a>
      </p>
    </footer>
  );
}
