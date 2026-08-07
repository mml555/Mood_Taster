import Image from "next/image";
import Link from "next/link";
import { AnalyticsBeacon } from "@/components/AnalyticsBeacon";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ProductBottomNav } from "@/components/ProductBottomNav";
import { ProfileNudge } from "@/components/ProfileNudge";
import { ANALYTICS_EVENTS } from "@/lib/analytics";

export default function HomePage() {
  return (
    <>
      <AnalyticsBeacon event={ANALYTICS_EVENTS.home} />
      <SiteHeader current="home" />
      <main id="top" className="product-main-with-nav">
        <section className="hero" aria-labelledby="hero-brand brand">
          <div className="hero-body">
            <div className="hero-logo">
              <Image
                className="hero-mark"
                src="/brand/mark-purple.png"
                alt=""
                width={64}
                height={64}
                priority
              />
              <p className="hero-brand" id="hero-brand">
                mood taster
              </p>
            </div>

            <h1 id="brand">
              Hungry? Let&apos;s figure out what you actually want.
            </h1>
            <p className="lede">
              Answer a few quick questions. Get one clear answer.
            </p>
          </div>

          <div className="hero-start">
            <Link className="cta hero-start-primary" href="/taste?from=home">
              Taste my mood
            </Link>
            <p className="hero-start-hint">Takes less than 30 seconds.</p>
          </div>
        </section>

        <section className="how how-quiet" id="how" aria-labelledby="how-title">
          <h2 id="how-title">How it works</h2>
          <ol className="flow-quiet">
            <li>
              <strong>Feel</strong>
              <span>Pick a path and a craving.</span>
            </li>
            <li>
              <strong>Match</strong>
              <span>Get one dish and a short why.</span>
            </li>
            <li>
              <strong>React</strong>
              <span>Like it, skip it, or try again.</span>
            </li>
          </ol>
          <p className="how-stance">
            Not a therapist. Not delivery. Not a calorie counter. Just the dish
            that fits how you feel.
          </p>
          <ProfileNudge context="home" />
        </section>
      </main>
      <ProductBottomNav current="taste" />
      <SiteFooter />
    </>
  );
}