import Image from "next/image";
import Link from "next/link";
import { Candy, ChefHat, CircleHelp, MapPin } from "lucide-react";
import { AnalyticsBeacon } from "@/components/AnalyticsBeacon";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ProfileNudge } from "@/components/ProfileNudge";
import { TrackedLink } from "@/components/TrackedLink";
import { ANALYTICS_EVENTS } from "@/lib/analytics";
import { FLOW_ICONS } from "@/lib/mood-icons";

const ABOUT_INTENTS = [
  {
    intent: "restaurant",
    label: "Go out",
    href: "/taste?intent=restaurant&from=home",
    Icon: MapPin,
    style: "primary" as const,
  },
  {
    intent: "recipe",
    label: "Make something",
    href: "/taste?intent=recipe&from=home",
    Icon: ChefHat,
    style: "primary" as const,
  },
  {
    intent: "snack",
    label: "Grab a snack",
    href: "/taste?intent=snack&from=home",
    Icon: Candy,
    style: "primary" as const,
  },
  {
    intent: "clue",
    label: "I have no clue",
    href: "/taste?intent=clue&from=home",
    Icon: CircleHelp,
    style: "secondary" as const,
  },
];

function IntentPicker({ id }: { id?: string }) {
  return (
    <div
      className="intent-picker"
      role="group"
      aria-label="How do you want to eat"
      id={id}
    >
      {ABOUT_INTENTS.map(({ intent, label, href, Icon, style }) => (
        <TrackedLink
          key={intent}
          className={
            style === "primary" ? "cta intent-cta" : "cta-secondary intent-cta"
          }
          href={href}
          event={ANALYTICS_EVENTS.intent}
          eventProps={{ intent, source: "home" }}
        >
          <Icon size={20} strokeWidth={1.5} aria-hidden />
          {label}
        </TrackedLink>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <AnalyticsBeacon event={ANALYTICS_EVENTS.home} />
      <SiteHeader current="home" />
      <main id="top">
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

        <section className="how" id="how" aria-labelledby="how-title">
          <h2 id="how-title">See. React. Taste.</h2>
          <p className="section-lede">Three steps. One job each.</p>
          <ol className="flow">
            <li>
              <span className="flow-icon" aria-hidden>
                <FLOW_ICONS.feel size={24} strokeWidth={1.5} />
              </span>
              <span className="step">01</span>
              <h3>Feel</h3>
              <p>
                Pick how you want to eat, then how you want food to feel.
              </p>
            </li>
            <li>
              <span className="flow-icon" aria-hidden>
                <FLOW_ICONS.match size={24} strokeWidth={1.5} />
              </span>
              <span className="step">02</span>
              <h3>Match</h3>
              <p>
                Get one dish and a short why. Go out finds nearby. Cook shows
                the recipe.
              </p>
            </li>
            <li>
              <span className="flow-icon" aria-hidden>
                <FLOW_ICONS.react size={24} strokeWidth={1.5} />
              </span>
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
          <IntentPicker />
          <ProfileNudge context="home" />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
