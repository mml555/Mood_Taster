import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { StrategyArticle } from "@/content/strategy-article";

export const metadata: Metadata = {
  title: "Go-to-Market Strategy",
  description:
    "Mood Taster go-to-market, growth, and monetization strategy — craving-intent advertising with trust first.",
};

export default function StrategyPage() {
  return (
    <div className="doc-page">
      <SiteHeader current="strategy" />
      <main className="doc">
        <header className="doc-hero">
          <p className="eyebrow">Public strategy · v1.0</p>
          <h1>Go-to-Market, Growth &amp; Monetization</h1>
          <p className="lede">
            How Mood Taster enters the market, earns trust, and builds toward a
            high-intent food advertising platform — without selling attention.
          </p>
          <p className="doc-meta">
            Status: v1.0 · Last updated: August 6, 2026 · Mobile-first web ·{" "}
            <a href="https://github.com/mml555/Mood_Taster">Source repo</a>
          </p>
        </header>

        <aside className="callout" aria-label="Central business insight">
          <p className="callout-label">Central business insight</p>
          <p>
            Mood Taster does not monetize attention. It monetizes{" "}
            <strong>craving intent</strong>.
          </p>
          <p>
            A person choosing between random content is not necessarily ready to
            buy. A person who just said they want something hot, crunchy, spicy,
            casual, and nearby is highly actionable.
          </p>
        </aside>

        <nav className="toc" aria-label="On this page">
          <p className="toc-label">On this page</p>
          <ol>
            <li>
              <a href="#purpose">1. Document purpose</a>
            </li>
            <li>
              <a href="#thesis">2. Business thesis</a>
            </li>
            <li>
              <a href="#positioning">3. Commercial positioning</a>
            </li>
            <li>
              <a href="#model">4. Business model</a>
            </li>
            <li>
              <a href="#order">5. Order of operations</a>
            </li>
            <li>
              <a href="#north-star">6. North star</a>
            </li>
            <li>
              <a href="#market">7–10. Market, beachhead &amp; promise</a>
            </li>
            <li>
              <a href="#phases">11. Go-to-market phases</a>
            </li>
            <li>
              <a href="#acquisition">12–18. Acquisition &amp; free product</a>
            </li>
            <li>
              <a href="#restaurants">19–25. Restaurant monetization</a>
            </li>
            <li>
              <a href="#brands">26–28. Brands &amp; commerce</a>
            </li>
            <li>
              <a href="#trust">29–30. Advertising trust</a>
            </li>
            <li>
              <a href="#media">31–42. Media, creators &amp; launch</a>
            </li>
            <li>
              <a href="#retention">43–47. Retention</a>
            </li>
            <li>
              <a href="#loops">48–56. Loops, funnel &amp; pilots</a>
            </li>
            <li>
              <a href="#limits">57–62. Limits, flywheel &amp; don’ts</a>
            </li>
            <li>
              <a href="#roadmap">63–67. Roadmap &amp; one-sentence plan</a>
            </li>
          </ol>
        </nav>

        <StrategyArticle />
      </main>
      <SiteFooter />
    </div>
  );
}
