import Link from "next/link";
import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="foot">
      <p className="foot-brand">
        <Image
          className="foot-mark"
          src="/brand/mark-purple-sm.png"
          alt=""
          width={28}
          height={23}
        />
        Mood Taster
      </p>
      <p className="foot-meta">
        <Link href="/prd">PRD</Link>
        {" · "}
        <Link href="/strategy">Strategy</Link>
        {" · "}
        <Link href="/brand">Brand</Link>
        {" · "}
        <Link href="/dna">Taste DNA</Link>
        {" · "}
        <Link href="/favorites">Favorites</Link>
        {" · "}
        <Link href="/history">History</Link>
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
