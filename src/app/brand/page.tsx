import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Brand Guide",
  description:
    "Mood Taster brand rules and design guidelines: two tones, no borders, sharp corners, and voice that stays brief and human.",
};

export default function BrandPage() {
  return (
    <div className="doc-page">
      <SiteHeader current="brand" />
      <main className="doc">
        <header className="doc-hero">
          <p className="eyebrow">Brand guide · v1.0</p>
          <h1>Brand rules &amp; design guidelines</h1>
          <p className="lede">
            Mood Taster looks like a well-set page, not a dashboard. Two tones
            and generous space do all the work. If a change needs a line or a
            gradient to read clearly, the spacing or the type is wrong.
          </p>
          <p className="doc-meta">
            Status: v1.0 · Last updated: August 6, 2026 ·{" "}
            <a href="/prd">PRD</a> · <a href="/strategy">Strategy</a> ·{" "}
            <a href="https://github.com/mml555/Mood_Taster">GitHub</a>
          </p>
        </header>

        <aside className="callout" aria-label="Hard visual rules">
          <p className="callout-label">Hard rules</p>
          <p>
            Two tones (<strong>ink</strong> and <strong>paper</strong>), one
            saffron accent for small marks. No borders. No rounded corners. No
            gradients. No shadows.
          </p>
        </aside>

        <nav className="toc" aria-label="On this page">
          <p className="toc-label">On this page</p>
          <ol>
            <li>
              <a href="#stance">1. Stance</a>
            </li>
            <li>
              <a href="#voice">2. Voice</a>
            </li>
            <li>
              <a href="#palette">3. Palette</a>
            </li>
            <li>
              <a href="#never">4. Never / Instead</a>
            </li>
            <li>
              <a href="#type">5. Type</a>
            </li>
            <li>
              <a href="#spacing">6. Spacing</a>
            </li>
            <li>
              <a href="#motion">7. Motion</a>
            </li>
            <li>
              <a href="#sponsored">8. Sponsored placements</a>
            </li>
            <li>
              <a href="#checklist">9. Ship checklist</a>
            </li>
          </ol>
        </nav>

        <article className="doc-body brand-guide">
          <section id="stance" aria-labelledby="stance-title">
            <h2 id="stance-title">1. Stance</h2>
            <p>
              Start from mood, not menus or macros. Recommendations should feel
              human, brief, and actionable. Prefer explainable picks (“why this
              fits”) over black-box scores.
            </p>
            <p>
              Mood Taster is not a therapist, a delivery service, or a calorie
              counter. The core flow stays mood → match → act.
            </p>
          </section>

          <section id="voice" aria-labelledby="voice-title">
            <h2 id="voice-title">2. Voice</h2>
            <p>
              One idea per sentence. Short support lines. Speak like someone who
              already knows what you want, not like a coach or a catalog.
            </p>
            <ul>
              <li>
                User-facing words: <strong>mood</strong>, <strong>taste</strong>,{" "}
                <strong>match</strong>, <strong>pick</strong>
              </li>
              <li>
                Avoid: “algorithm,” “optimization,” “wellness score”
              </li>
              <li>
                No em dashes anywhere. Use a period, comma, or colon.
                Parentheses for a true aside.
              </li>
              <li>
                En dashes are fine for numeric ranges only (18-35, 50-150)
              </li>
            </ul>
          </section>

          <section id="palette" aria-labelledby="palette-title">
            <h2 id="palette-title">3. Palette</h2>
            <p>
              Two tones and one accent. Every neutral is a mix of the two tones,
              never a new hue.
            </p>

            <ul className="swatch-grid" aria-label="Brand color tokens">
              <li>
                <span
                  className="swatch swatch-ink"
                  aria-hidden="true"
                />
                <span className="swatch-name">Ink</span>
                <span className="swatch-meta">
                  <code>--ink</code> · #14110f · Tone 1. Every surface.
                </span>
              </li>
              <li>
                <span
                  className="swatch swatch-paper"
                  aria-hidden="true"
                />
                <span className="swatch-name">Paper</span>
                <span className="swatch-meta">
                  <code>--paper</code> · #f2ebe0 · Tone 2. Every piece of
                  content.
                </span>
              </li>
              <li>
                <span
                  className="swatch swatch-accent"
                  aria-hidden="true"
                />
                <span className="swatch-name">Saffron</span>
                <span className="swatch-meta">
                  <code>--accent</code> · #e4a01a · Small marks only.
                </span>
              </li>
              <li>
                <span
                  className="swatch swatch-paper-muted"
                  aria-hidden="true"
                />
                <span className="swatch-name">Paper muted</span>
                <span className="swatch-meta">
                  <code>--paper-muted</code> · mix 72% paper / ink
                </span>
              </li>
              <li>
                <span
                  className="swatch swatch-paper-quiet"
                  aria-hidden="true"
                />
                <span className="swatch-name">Paper quiet</span>
                <span className="swatch-meta">
                  <code>--paper-quiet</code> · mix 45% paper / ink
                </span>
              </li>
              <li>
                <span
                  className="swatch swatch-ink-raised"
                  aria-hidden="true"
                />
                <span className="swatch-name">Ink raised</span>
                <span className="swatch-meta">
                  <code>--ink-raised</code> · mix 92% ink / paper
                </span>
              </li>
            </ul>

            <h3>Accent rules</h3>
            <ul>
              <li>
                Saffron is for small marks: eyebrows, step numbers, one emphasis
                per section
              </li>
              <li>
                It must never fill a surface, a button, or any large area.
                Roughly 1% of a viewport’s painted area is the ceiling
              </li>
              <li>
                Never introduce a fourth hue. No zest, no status greens, no
                semantic reds. Failure and success read through copy, weight,
                and placement
              </li>
            </ul>
          </section>

          <section id="never" aria-labelledby="never-title">
            <h2 id="never-title">4. Never / Instead</h2>

            <h3>Never</h3>
            <ul>
              <li>
                <strong>No borders</strong> as decoration. No hairline dividers,
                outlined cards, or stroked rings
              </li>
              <li>
                <strong>No rounded corners</strong>. Prefer{" "}
                <code>border-radius: 0</code>. Never above 2px
              </li>
              <li>
                <strong>No gradients</strong>. Solid fills only
              </li>
              <li>
                <strong>No box shadows</strong>. Depth is not a substitute for a
                border
              </li>
              <li>
                <strong>No card grids</strong> built out of boxes. Group with
                space and alignment
              </li>
            </ul>

            <h3>Instead</h3>
            <p>Reach for these, in order:</p>
            <ol>
              <li>
                <strong>Space.</strong> A section break is{" "}
                <code>--space-8</code>, not a 1px line
              </li>
              <li>
                <strong>Type.</strong> Size, weight, and family carry hierarchy
              </li>
              <li>
                <strong>Tone.</strong> Step a surface to{" "}
                <code>--ink-raised</code>, or invert to paper-on-ink, when a
                region genuinely needs to detach
              </li>
            </ol>

            <div className="brand-demos" aria-label="Visual examples">
              <div className="brand-demo">
                <p className="brand-demo-label">Do</p>
                <div className="brand-demo-do">
                  <p className="eyebrow">Taste by feeling</p>
                  <p className="brand-demo-title">One pick. Why it fits.</p>
                  <p className="brand-demo-copy">
                    Separate with space and a tone step, not a stroke.
                  </p>
                  <span className="brand-demo-cta">Start with your mood</span>
                </div>
              </div>
              <div className="brand-demo">
                <p className="brand-demo-label">Don’t</p>
                <div className="brand-demo-dont">
                  <p>
                    Outlined cards, rounded pills, hairline rules, tinted
                    badges, and fourth hues break the system. If it needs a
                    border to read, fix the spacing.
                  </p>
                </div>
              </div>
            </div>

            <p>
              Primary actions <strong>invert the tones</strong>: paper
              background, ink text. That is the only “filled” element in the
              system.
            </p>
          </section>

          <section id="type" aria-labelledby="type-title">
            <h2 id="type-title">5. Type</h2>
            <dl className="user-list">
              <div>
                <dt className="type-sample-display">Fraunces</dt>
                <dd>
                  Display. Brand name, section titles, lane names. Variable{" "}
                  <code>--font-display</code>.
                </dd>
              </div>
              <div>
                <dt className="type-sample-body">Sora</dt>
                <dd>
                  Body and UI. Support lines, lists, nav. Variable{" "}
                  <code>--font-body</code>.
                </dd>
              </div>
            </dl>
            <p>
              Hierarchy comes from size, weight, and family. Do not lean on
              underlines or rules to invent structure.
            </p>
          </section>

          <section id="spacing" aria-labelledby="spacing-title">
            <h2 id="spacing-title">6. Spacing</h2>
            <p>
              Use the ramp. Do not invent one-off values. Related items sit{" "}
              <code>--space-4</code> apart; unrelated groups sit{" "}
              <code>--space-6</code> or more apart. When something feels
              cramped, add space before adding a divider.
            </p>
            <ul className="space-ramp" aria-label="Spacing scale">
              <li>
                <span className="space-bar" style={{ width: "0.25rem" }} />
                <code>--space-1</code> 0.25rem
              </li>
              <li>
                <span className="space-bar" style={{ width: "0.5rem" }} />
                <code>--space-2</code> 0.5rem
              </li>
              <li>
                <span className="space-bar" style={{ width: "0.75rem" }} />
                <code>--space-3</code> 0.75rem
              </li>
              <li>
                <span className="space-bar" style={{ width: "1rem" }} />
                <code>--space-4</code> 1rem
              </li>
              <li>
                <span className="space-bar" style={{ width: "2rem" }} />
                <code>--space-5</code> 2rem
              </li>
              <li>
                <span className="space-bar" style={{ width: "3rem" }} />
                <code>--space-6</code> 3rem
              </li>
              <li>
                <span className="space-bar" style={{ width: "4rem" }} />
                <code>--space-7</code> 4rem
              </li>
              <li>
                <span className="space-bar space-bar-wide" />
                <code>--space-8</code> clamp(4rem, 12vh, 7rem)
              </li>
            </ul>
          </section>

          <section id="motion" aria-labelledby="motion-title">
            <h2 id="motion-title">7. Motion</h2>
            <p>
              Entrance <code>rise</code> only, and one shared{" "}
              <code>--ease</code>. No spinning, pulsing, or looping ambient
              animation. Honor <code>prefers-reduced-motion: reduce</code>.
            </p>
          </section>

          <section id="sponsored" aria-labelledby="sponsored-title">
            <h2 id="sponsored-title">8. Sponsored placements</h2>
            <p>
              Paid placements must be unmistakably labeled. The label is type,
              not a badge box.
            </p>
            <div className="brand-sponsored-sample">
              <p className="eyebrow">Sponsored match</p>
              <p className="brand-demo-title">Crispy chili noodles</p>
              <p className="brand-demo-copy">
                Hot, crunchy, and close. Fits the craving you just named.
              </p>
            </div>
            <ul>
              <li>
                Use an accent eyebrow, <strong>Sponsored match</strong>, in the
                same style as <code>.eyebrow</code>
              </li>
              <li>
                Never build a bordered pill, tinted chip, or shadowed card to
                carry it
              </li>
              <li>
                Never make the sponsored label quieter than the organic one it
                sits beside
              </li>
            </ul>
          </section>

          <section id="checklist" aria-labelledby="checklist-title">
            <h2 id="checklist-title">9. Ship checklist</h2>
            <ul className="brand-checklist">
              <li>No gradient, border, or shadow added</li>
              <li>
                Any new color is <code>--ink</code>, <code>--paper</code>,{" "}
                <code>--accent</code>, or a mix of the first two
              </li>
              <li>Accent used only as a small mark</li>
              <li>Corners stay sharp (<code>border-radius: 0</code>)</li>
              <li>Spacing values come from the ramp</li>
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
      <SiteFooter />
    </div>
  );
}
