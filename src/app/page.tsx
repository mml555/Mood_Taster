import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function HomePage() {
  return (
    <>
      <SiteHeader current="home" />
      <main id="top">
        <section className="hero" aria-labelledby="brand">
          <p className="eyebrow">Taste by feeling</p>
          <h1 id="brand">Hungry?</h1>
          <p className="lede">
            Let&apos;s figure out what you actually want. Four quick taps about
            flavor, texture, weight, and how far you want to wander. One
            specific dish. Not another endless menu.
          </p>
          <div className="cta-row">
            <Link className="cta" href="/taste">
              Start
            </Link>
          </div>
        </section>

        <section className="how" id="how" aria-labelledby="how-title">
          <h2 id="how-title">Craving → match → taste</h2>
          <p className="section-lede">
            Three steps. One job each. No filter maze.
          </p>
          <ol className="flow">
            <li>
              <span className="step">01</span>
              <h3>Craving</h3>
              <p>
                Say how you want food to feel: hot, crunchy, spicy, light. Four
                questions. Under twenty seconds.
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
              <h3>Taste</h3>
              <p>
                Rate it. Not feeling it? Take one different pick without
                starting over. Your Taste DNA learns for next time.
              </p>
            </li>
          </ol>
        </section>

        <section className="about" id="about" aria-labelledby="about-title">
          <h2 id="about-title">Built for the craving, not the calorie</h2>
          <p>
            Mood Taster is not a therapist, delivery service, or calorie
            counter. It starts from how you want food to feel, then names one
            dish you can actually go get or make.
          </p>
          <div className="cta-row">
            <Link className="cta" href="/taste">
              Find a dish
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
