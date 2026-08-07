import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { PrdArticle } from "@/content/prd-article";

export const metadata: Metadata = {
  title: "Product Requirements",
  description:
    "Mood Taster PRD v1.0: craving capture, specific recommendations, Taste DNA, feedback, and the roadmap beyond Ship Night.",
};

export default function PrdPage() {
  return (
    <div className="doc-page">
      <SiteHeader current="prd" />
      <main className="doc">
        <header className="doc-hero">
          <p className="eyebrow">Product requirements · v1.0</p>
          <h1>Mood Taster</h1>
          <p className="lede">
            Figure out what you&apos;re craving: one specific dish, not another
            endless menu. Ship Night is the shipped baseline. This PRD is the
            product target.
          </p>
          <p className="doc-meta">
            Status: v1.0 · Last updated: August 6, 2026 ·{" "}
            <a href="https://raw.githubusercontent.com/mml555/Mood_Taster/main/PRD.md">
              Markdown
            </a>{" "}
            ·{" "}
            <a href="https://github.com/mml555/Mood_Taster/blob/main/BACKLOG.md">
              Backlog
            </a>{" "}
            · <a href="/strategy">Strategy</a> · <a href="/brand">Brand</a> ·{" "}
            <a href="https://github.com/mml555/Mood_Taster">GitHub</a>
          </p>
        </header>

        <aside className="callout" aria-label="North star">
          <p className="callout-label">North star</p>
          <p>
            Increase the probability that Mood Taster correctly identifies what
            the user wants to eat. Everything else exists to make that happen.
          </p>
        </aside>

        <nav className="toc" aria-label="On this page">
          <p className="toc-label">On this page</p>
          <ol>
            <li>
              <a href="#baseline">Ship Night baseline</a>
            </li>
            <li>
              <a href="#summary">1. Product summary</a>
            </li>
            <li>
              <a href="#vision">2. Vision and value</a>
            </li>
            <li>
              <a href="#principles">3. Principles</a>
            </li>
            <li>
              <a href="#jobs">4. Jobs to be done</a>
            </li>
            <li>
              <a href="#ia">5. Information architecture</a>
            </li>
            <li>
              <a href="#intents">6. Intents</a>
            </li>
            <li>
              <a href="#result">7. Result and places</a>
            </li>
            <li>
              <a href="#dna">8. Taste DNA and feedback</a>
            </li>
            <li>
              <a href="#engine">9. Recommendation engine</a>
            </li>
            <li>
              <a href="#auth">10. Auth and privacy</a>
            </li>
            <li>
              <a href="#gamification">11. Explore and gamification</a>
            </li>
            <li>
              <a href="#roadmap">12. Roadmap</a>
            </li>
            <li>
              <a href="#priority">13. Development priority</a>
            </li>
            <li>
              <a href="#north-star">14. North star</a>
            </li>
          </ol>
        </nav>

        <PrdArticle />
      </main>
      <SiteFooter />
    </div>
  );
}
