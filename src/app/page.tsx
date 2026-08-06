import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ProfileNudge } from "@/components/ProfileNudge";

export default function HomePage() {
  return (
    <>
      <SiteHeader current="home" />
      <main id="top">
        <section className="hero" aria-labelledby="brand">
          <p className="eyebrow">Taste by feeling</p>
          <h1 id="brand">Hungry?</h1>
          <p className="lede">
            How do you feel? Four quick taps. One dish. Swipe if it is not
            right.
          </p>
          <div className="cta-row">
            <Link className="cta" href="/taste">
              Show me
            </Link>
          </div>
        </section>

        <section className="how" id="how" aria-labelledby="how-title">
          <h2 id="how-title">See. React. Taste.</h2>
          <p className="section-lede">
            Three steps. One job each.
          </p>
          <ol className="flow">
            <li>
              <span className="step">01</span>
              <h3>Feel</h3>
              <p>
                Pick how you want food to feel. Hot, crunchy, light. Four
                taps.
              </p>
            </li>
            <li>
              <span className="step">02</span>
              <h3>Match</h3>
              <p>
                Get one dish and a short why. Not a long menu.
              </p>
            </li>
            <li>
              <span className="step">03</span>
              <h3>React</h3>
              <p>
                Like it, skip it, or try again. Your Taste DNA learns as you
                go.
              </p>
            </li>
          </ol>
        </section>

        <section className="about" id="about" aria-labelledby="about-title">
          <h2 id="about-title">Mood first</h2>
          <p>
            Not a therapist. Not delivery. Not a calorie counter. Just the
            dish that fits how you feel.
          </p>
          <div className="cta-row">
            <Link className="cta" href="/taste">
              Show me
            </Link>
          </div>
          <ProfileNudge context="home" />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
