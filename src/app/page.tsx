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
            Tell us how you feel. We’ll match it to something worth tasting —
            without diets, doomscroll menus, or guesswork.
          </p>
          <div className="cta-row">
            <a className="cta" href="#how">
              Start with your mood
            </a>
          </div>
          <div className="hero-plane" aria-hidden="true">
            <div className="ring ring-a" />
            <div className="ring ring-b" />
            <div className="bloom" />
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
              <p>Pick a feeling or say it in a few words.</p>
            </li>
            <li>
              <span className="step">02</span>
              <h3>Match</h3>
              <p>Get a short list with why each pick fits.</p>
            </li>
            <li>
              <span className="step">03</span>
              <h3>Act</h3>
              <p>Cook it, go there, or save it for later.</p>
            </li>
          </ol>
        </section>

        <section className="about" id="about" aria-labelledby="about-title">
          <h2 id="about-title">Built for the craving, not the calorie</h2>
          <p>
            Mood Taster is a tasting companion. It starts with how you feel and
            ends with something you can actually do — a recipe, a place, or a
            flavor direction. Not a wellness score. Not sponsored clutter.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
