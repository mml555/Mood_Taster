import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AnalyticsBeacon } from "@/components/AnalyticsBeacon";
import { ProfileNudge } from "@/components/ProfileNudge";
import { ANALYTICS_EVENTS } from "@/lib/analytics";

export default function HomePage() {
  return (
    <>
      <AnalyticsBeacon event={ANALYTICS_EVENTS.home} />
      <div id="top">
        <section className="hero" aria-labelledby="hero-brand brand">
          <span className="hero-decor hero-decor-1" aria-hidden>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM11 19.93C7.06 19.43 4 16.05 4 12C4 7.95 7.06 4.57 11 4.07V19.93ZM13 4.07C16.94 4.57 20 7.95 20 12C20 16.05 16.94 19.43 13 19.93V4.07Z" />
            </svg>
          </span>
          <span className="hero-decor hero-decor-indigo hero-decor-2" aria-hidden>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </span>
          <span className="hero-decor hero-decor-3" aria-hidden>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="8" />
            </svg>
          </span>

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
              <ArrowRight size={22} strokeWidth={2.5} aria-hidden />
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
              <span>Like it or skip it.</span>
            </li>
          </ol>
          <p className="how-stance">
            Not a therapist. Not delivery. Not a calorie counter. Just the dish
            that fits how you feel.
          </p>
          <ProfileNudge context="home" />
        </section>
      </div>
    </>
  );
}
