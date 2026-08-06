import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function HomePage() {
  return (
    <>
      <SiteHeader current="home" />
      <main id="top">
        <section className="hero" aria-labelledby="brand">
          <p className="eyebrow">Taste by feeling</p>
          <h1 id="brand">Mood Taster</h1>
          <p className="lede">
            Figure out what you actually want to eat in under 30 seconds. A few
            quick questions about how you feel, then one specific pick. Not
            another endless menu.
          </p>
          <div className="cta-row">
            <a className="cta" href="#how">
              Start with your mood
            </a>
          </div>
        </section>

        <section className="how" id="how" aria-labelledby="how-title">
          <h2 id="how-title">Mood → match → act</h2>
          <p className="section-lede">
            Three steps. One job each. No filter maze.
          </p>
          <ol className="flow">
            <li>
              <span className="step">01</span>
              <h3>Mood</h3>
              <p>
                Say how you want food to feel: hot, crunchy, spicy, light. Five
                questions or fewer.
              </p>
            </li>
            <li>
              <span className="step">02</span>
              <h3>Match</h3>
              <p>
                Get one specific dish, plus a short reason it fits what you just
                told us.
              </p>
            </li>
            <li>
              <span className="step">03</span>
              <h3>Act</h3>
              <p>
                Go out, make it, or grab it. Not feeling it? Take one different
                pick without starting over.
              </p>
            </li>
          </ol>
        </section>

        <section className="lanes" id="lanes" aria-labelledby="lanes-title">
          <h2 id="lanes-title">Pick the kind of night it is</h2>
          <p className="section-lede">
            You choose the lane first, so the answer is something you can
            actually do right now.
          </p>
          <dl className="lane-list">
            <div>
              <dt>Go out</dt>
              <dd>A dish worth leaving the house for, and where to get it.</dd>
            </div>
            <div>
              <dt>Make something</dt>
              <dd>One thing to cook tonight, matched to your energy level.</dd>
            </div>
            <div>
              <dt>Grab a snack</dt>
              <dd>Small, fast, and specific. For the in-between hunger.</dd>
            </div>
          </dl>
        </section>

        <section className="about" id="about" aria-labelledby="about-title">
          <h2 id="about-title">Built for the craving, not the calorie</h2>
          <p>
            Mood Taster is a tasting companion. It starts with how you feel and
            ends with something you can actually do: a dish, a place, or a
            flavor direction. Not a wellness score. Not sponsored clutter. No
            accounts, streaks, or feeds to maintain.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
