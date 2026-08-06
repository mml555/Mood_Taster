import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { StrategyArticle } from "@/content/strategy-article";

export const metadata: Metadata = {
  title: "Go-to-Market Strategy",
  description:
    "Mood Taster go-to-market, growth, and monetization: own the moment before the craving forms, then charge for outcomes.",
};

export default function StrategyPage() {
  return (
    <div className="doc-page">
      <SiteHeader current="strategy" />
      <main className="doc">
        <header className="doc-hero">
          <p className="eyebrow">Public strategy · v1.1</p>
          <h1>Go-to-Market, Growth &amp; Monetization</h1>
          <p className="lede">
            How Mood Taster enters the market, earns trust, and builds outcome
            revenue without selling attention or personal Taste DNA.
          </p>
          <p className="doc-meta">
            Status: v1.1 · Last updated: August 6, 2026 · Mobile-first web ·{" "}
            <a href="/brand">Brand</a> ·{" "}
            <a href="https://github.com/mml555/Mood_Taster">Source repo</a>
          </p>
        </header>

        <aside className="callout" aria-label="Central business insight">
          <p className="callout-label">Central business insight</p>
          <p>
            Mood Taster does not monetize attention. It monetizes{" "}
            <strong>craving intent as outcomes</strong>, not impressions.
          </p>
          <p>
            Google owns &quot;pizza near me.&quot; Yelp owns &quot;best
            pizza.&quot; Delivery apps own the order. We own the thirty seconds
            before that thought exists. Because we shape the decision, we can
            charge for the handoff, the visit, the subscription, and the
            aggregate trend, not the banner.
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
              <a href="#model">4. Four revenue streams</a>
            </li>
            <li>
              <a href="#order">5. Order of operations</a>
            </li>
            <li>
              <a href="#north-star">6. North star</a>
            </li>
            <li>
              <a href="#trust">7. Trust &amp; data guardrails</a>
            </li>
            <li>
              <a href="#market">8–11. Market, beachhead &amp; promise</a>
            </li>
            <li>
              <a href="#phases">12. Go-to-market phases</a>
            </li>
            <li>
              <a href="#acquisition">13–19. Acquisition &amp; free product</a>
            </li>
            <li>
              <a href="#affiliate">20. Affiliate routing</a>
            </li>
            <li>
              <a href="#visits">21. Verified visits</a>
            </li>
            <li>
              <a href="#saas">22. Restaurant software</a>
            </li>
            <li>
              <a href="#intelligence">23. Aggregate taste intelligence</a>
            </li>
            <li>
              <a href="#media">24–35. Media, creators &amp; launch</a>
            </li>
            <li>
              <a href="#retention">36–40. Retention</a>
            </li>
            <li>
              <a href="#loops">41–49. Loops, funnel &amp; pilots</a>
            </li>
            <li>
              <a href="#limits">50–55. Limits, flywheel &amp; don’ts</a>
            </li>
            <li>
              <a href="#roadmap">56–60. Roadmap &amp; one-sentence plan</a>
            </li>
          </ol>
        </nav>

        <StrategyArticle />
      </main>
      <SiteFooter />
    </div>
  );
}
