import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Brand Guide",
  description:
    "Mood Taster Brand Guide: Ghost White, Indigo Purple, Royal Gold. Playful pressable chrome. See, tap, taste.",
};

export default function BrandPage() {
  return (
    <div className="doc-page">
      <main className="doc">
        <header className="doc-hero">
          <p className="doc-back">
            <Link href="/">Mood Taster</Link>
          </p>
          <p className="eyebrow">Brand guide · v1.1</p>
          <h1>Don&apos;t make me think. Let me react.</h1>
          <p className="lede">
            Mood Taster should feel playful, pressable, fast, and clear. See →
            Tap → Taste → Get something better.
          </p>
          <p className="doc-meta">
            Status: v1.1 · Last updated: August 6, 2026 ·{" "}
            <a href="/prd">PRD</a> · <a href="/strategy">Strategy</a> ·{" "}
            <a href="https://github.com/mml555/Mood_Taster">GitHub</a>
          </p>
        </header>

        <aside className="callout" aria-label="Hard visual rules">
          <p className="callout-label">Hard rules</p>
          <p>
            Ghost White dominates. Indigo drives actions. Gold is a surprise,
            not a second primary. Pressable thick bottom borders on product
            controls. Soft shadows on primary cards. No emojis. Short copy. One
            primary CTA per screen.
          </p>
        </aside>

        <nav className="toc" aria-label="On this page">
          <p className="toc-label">On this page</p>
          <ol>
            <li>
              <a href="#feel">1. Brand feel</a>
            </li>
            <li>
              <a href="#palette">2. Color</a>
            </li>
            <li>
              <a href="#philosophy">3. UI philosophy</a>
            </li>
            <li>
              <a href="#shape">4. Shape &amp; spacing</a>
            </li>
            <li>
              <a href="#buttons">5. Buttons &amp; icons</a>
            </li>
            <li>
              <a href="#swipe">6. Cards &amp; reactions</a>
            </li>
            <li>
              <a href="#copy">7. Copy</a>
            </li>
            <li>
              <a href="#logo">8. Logo</a>
            </li>
            <li>
              <a href="#checklist">9. Ship checklist</a>
            </li>
          </ol>
        </nav>

        <article className="doc-body brand-guide">
          <section id="feel" aria-labelledby="feel-title">
            <h2 id="feel-title">1. Brand feel</h2>
            <p>
              Minimal. Playful. Fast. Premium. Simple. The product should feel
              almost effortless. Users should rarely need to stop and figure out
              what something means.
            </p>
            <p>
              Think dating-app speed, built around discovering things that match
              your mood. Core flow stays mood → match → act.
            </p>
          </section>

          <section id="palette" aria-labelledby="palette-title">
            <h2 id="palette-title">2. Color</h2>
            <p>
              If a screen feels colorful, we probably used too much color.
              Neutrals are mixes of Ghost White and Indigo only.
            </p>

            <ul className="swatch-grid" aria-label="Brand color tokens">
              <li>
                <span className="swatch swatch-paper" aria-hidden="true" />
                <span className="swatch-name">Ghost White</span>
                <span className="swatch-meta">
                  <code>--paper</code> · #FDFAFF · Canvas ~80%
                </span>
              </li>
              <li>
                <span className="swatch swatch-ink" aria-hidden="true" />
                <span className="swatch-name">Indigo Purple</span>
                <span className="swatch-meta">
                  <code>--ink</code> · #510C85 · Primary ~20%
                </span>
              </li>
              <li>
                <span className="swatch swatch-accent" aria-hidden="true" />
                <span className="swatch-name">Royal Gold</span>
                <span className="swatch-meta">
                  <code>--accent</code> · #FFDF6E · Highlight, sparingly
                </span>
              </li>
              <li>
                <span
                  className="swatch swatch-paper-muted"
                  aria-hidden="true"
                />
                <span className="swatch-name">Muted</span>
                <span className="swatch-meta">
                  <code>--paper-muted</code> · mix ink into paper
                </span>
              </li>
              <li>
                <span
                  className="swatch swatch-paper-quiet"
                  aria-hidden="true"
                />
                <span className="swatch-name">Quiet</span>
                <span className="swatch-meta">
                  <code>--paper-quiet</code> · quieter mix
                </span>
              </li>
              <li>
                <span
                  className="swatch swatch-ink-raised"
                  aria-hidden="true"
                />
                <span className="swatch-name">Raised</span>
                <span className="swatch-meta">
                  <code>--ink-raised</code> · soft surface step
                </span>
              </li>
            </ul>

            <h3>Usage</h3>
            <ul>
              <li>
                <strong>Ghost White</strong> is the default background. Screens
                stay bright and open, not purple-heavy.
              </li>
              <li>
                <strong>Indigo</strong> for primary CTAs, active states,
                selected items, headings when emphasis is needed, and major
                brand moments.
              </li>
              <li>
                <strong>Gold</strong> for a great match, special recommendation,
                selected highlight, or a tiny mark the user should notice. Never
                let it compete with purple.
              </li>
            </ul>
          </section>

          <section id="philosophy" aria-labelledby="philosophy-title">
            <h2 id="philosophy-title">3. UI philosophy</h2>
            <p>Content first, controls second. Keep screens spacious.</p>
            <p>Every element should answer one of three questions:</p>
            <ul>
              <li>What is this?</li>
              <li>Do I like it?</li>
              <li>What do I do next?</li>
            </ul>
            <p>If it does not help answer one of those, remove it.</p>

            <div className="brand-demos" aria-label="Visual examples">
              <div className="brand-demo">
                <p className="brand-demo-label">Do</p>
                <div className="brand-demo-do">
                  <p className="eyebrow">Your match</p>
                  <p className="brand-demo-title">One pick. React.</p>
                  <p className="brand-demo-copy">
                    Space, type, and tone. One clear next step.
                  </p>
                  <span className="brand-demo-cta">Show me</span>
                </div>
              </div>
              <div className="brand-demo">
                <p className="brand-demo-label">Don&apos;t</p>
                <div className="brand-demo-dont">
                  <p>
                    Boxes inside boxes, long forms, competing CTAs, and copy
                    that needs a dictionary. If we can make it simpler, make it
                    simpler.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section id="shape" aria-labelledby="shape-title">
            <h2 id="shape-title">4. Shape &amp; spacing</h2>
            <p>
              One rounded language. Nothing extremely sharp or overly bubbly.
            </p>
            <ul>
              <li>
                Cards: <code>--radius-card</code> 20px
              </li>
              <li>
                Large containers / modals: <code>--radius-lg</code> 24px
              </li>
              <li>
                Buttons / inputs: <code>--radius-btn</code> 14–16px
              </li>
              <li>
                Small controls: <code>--radius-sm</code> 12px
              </li>
              <li>
                Pills: <code>--radius-pill</code> fully rounded
              </li>
            </ul>
            <p>
              Spacing uses an 8px system: 8 → 16 → 24 → 32 → 48 → 64. Most
              component spacing uses 16px or 24px. Give important content room
              to breathe.
            </p>
            <ul className="space-ramp" aria-label="Spacing scale">
              <li>
                <span className="space-bar" style={{ width: "0.5rem" }} />
                <code>--space-2</code> 8px
              </li>
              <li>
                <span className="space-bar" style={{ width: "1rem" }} />
                <code>--space-3</code> 16px
              </li>
              <li>
                <span className="space-bar" style={{ width: "1.5rem" }} />
                <code>--space-4</code> 24px
              </li>
              <li>
                <span className="space-bar" style={{ width: "2rem" }} />
                <code>--space-5</code> 32px
              </li>
              <li>
                <span className="space-bar" style={{ width: "3rem" }} />
                <code>--space-6</code> 48px
              </li>
              <li>
                <span className="space-bar" style={{ width: "4rem" }} />
                <code>--space-7</code> 64px
              </li>
            </ul>
          </section>

          <section id="buttons" aria-labelledby="buttons-title">
            <h2 id="buttons-title">5. Buttons &amp; icons</h2>
            <h3>Buttons</h3>
            <ul>
              <li>
                <strong>Primary:</strong> Indigo fill, ghost text, thick bottom
                edge in deeper indigo. Compress on press.
              </li>
              <li>
                <strong>Secondary:</strong> White fill, indigo border, thick
                bottom edge.
              </li>
              <li>
                <strong>Highlight:</strong> Gold background, indigo text.
                Special actions only.
              </li>
            </ul>
            <p>
              Product chrome is pressable. Button copy stays tiny: Show me,
              Taste my mood, Let&apos;s go, Make this.
            </p>

            <h3>Icons</h3>
            <p>
              Icons teach how the app works. Prefer icon + 1–3 words. No emojis
              in product UI.
            </p>
            <ul>
              <li>♡ Like</li>
              <li>× Not for me</li>
              <li>↻ Try something else</li>
              <li>← → Browse</li>
              <li>＋ Add</li>
              <li>✓ Pick / confirm</li>
              <li>⌕ Search</li>
            </ul>
          </section>

          <section id="swipe" aria-labelledby="swipe-title">
            <h2 id="swipe-title">6. Cards &amp; reactions</h2>
            <p>
              Personality comes from clear reactions instead of menus. A
              recommendation appears:
            </p>
            <ul>
              <li>× → Not for me / next match</li>
              <li>♡ + CTA → Like (Let&apos;s go / Make this / That&apos;s the one)</li>
              <li>Tap quiet links for Kinda, Why, or Off</li>
            </ul>
            <p>
              Favor taps and choices over forms. Quiz craving steps use a
              2-column icon grid. Intent stays full-width cards.
            </p>
            <h3>Cards</h3>
            <p>
              Large, clean, content-driven. White cards with indigo borders and
              a thick bottom edge. Soft shadows are allowed on the main result
              card and key stats cards.
            </p>
          </section>

          <section id="copy" aria-labelledby="copy-title">
            <h2 id="copy-title">7. Copy</h2>
            <p>
              Write for a third grader. Short sentences. Common words. One idea
              at a time. Headlines ideally 2–6 words. Body rarely more than two
              short sentences.
            </p>
            <ul>
              <li>
                Instead of &quot;Tell us your current emotional state…&quot;
                use <strong>How do you feel?</strong>
              </li>
              <li>
                Instead of &quot;We couldn&apos;t find any results…&quot; use{" "}
                <strong>Nothing yet. Try again.</strong>
              </li>
              <li>
                Instead of &quot;Would you like us to generate an
                alternative…&quot; use <strong>Want another one?</strong>
              </li>
            </ul>
            <p>
              User-facing words: mood, taste, match, pick. Avoid algorithm,
              optimization, wellness score. No em dashes anywhere.
            </p>
            <p>
              Each screen: one main idea, one main action, one obvious next
              step.
            </p>
          </section>

          <section id="logo" aria-labelledby="logo-title">
            <h2 id="logo-title">8. Logo</h2>
            <p>
              The mark is a stylized tongue. Use yellow on indigo surfaces,
              purple on Ghost White fields. Never stretch, rotate, or add a
              stroke.
            </p>

            <ul className="logo-grid" aria-label="Logo variants">
              <li>
                <div className="logo-tile logo-tile-ink">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/brand/mark-yellow.png"
                    alt=""
                    width={128}
                    height={105}
                  />
                </div>
                <span className="swatch-name">Mark · yellow</span>
                <span className="swatch-meta">On indigo surfaces.</span>
              </li>
              <li>
                <div className="logo-tile logo-tile-paper">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/brand/mark-purple.png"
                    alt=""
                    width={128}
                    height={105}
                  />
                </div>
                <span className="swatch-name">Mark · purple</span>
                <span className="swatch-meta">On Ghost White. Site default.</span>
              </li>
              <li>
                <div className="logo-tile logo-tile-paper logo-tile-wide">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/brand/lockup-purple-sm.png"
                    alt=""
                    width={280}
                    height={36}
                  />
                </div>
                <span className="swatch-name">Lockup · purple</span>
                <span className="swatch-meta">Header on light canvas.</span>
              </li>
              <li>
                <div className="logo-tile logo-tile-ink logo-tile-wide">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/brand/lockup-yellow-sm.png"
                    alt=""
                    width={280}
                    height={36}
                  />
                </div>
                <span className="swatch-name">Lockup · yellow</span>
                <span className="swatch-meta">On indigo fills.</span>
              </li>
            </ul>
          </section>

          <section id="checklist" aria-labelledby="checklist-title">
            <h2 id="checklist-title">9. Ship checklist</h2>
            <ul className="brand-checklist">
              <li>Ghost White dominates the interface</li>
              <li>Purple drives actions and branding</li>
              <li>Gold is an accent, not a second primary</li>
              <li>One consistent radius system</li>
              <li>8px spacing system</li>
              <li>No emojis</li>
              <li>Pressable borders and thick bottom edges on product controls</li>
              <li>Soft shadows on primary result and stats cards only</li>
              <li>Icons explain actions</li>
              <li>Favor taps and reactions over forms</li>
              <li>One clear primary CTA per screen</li>
              <li>Copy stays extremely short</li>
              <li>Focus states still visible on keyboard nav</li>
            </ul>
            <p>
              Accessibility exceptions that must survive:{" "}
              <code>:focus-visible</code> outlines,{" "}
              <code>box-sizing: border-box</code>, underlines on inline text
              links, and the monochrome <code>.grain</code> overlay.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
