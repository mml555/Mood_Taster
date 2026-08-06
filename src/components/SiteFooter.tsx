import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="foot">
      <p className="foot-brand">Mood Taster</p>
      <p className="foot-meta">
        <Link href="/prd">PRD</Link>
        {" · "}
        <Link href="/strategy">Strategy</Link>
        {" · "}
        <Link href="/brand">Brand</Link>
        {" · "}
        <Link href="/privacy">Privacy</Link>
        {" · "}
        <Link href="/terms">Terms</Link>
        {" · "}
        <Link href="/contact">Contact</Link>
        {" · "}
        <a href="https://github.com/mml555/Mood_Taster">GitHub</a>
      </p>
    </footer>
  );
}
