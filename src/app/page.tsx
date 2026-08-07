import Link from "next/link";
import Image from "next/image";
import { Candy, ChefHat, CircleHelp, MapPin } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ProfileNudge } from "@/components/ProfileNudge";
import { FLOW_ICONS } from "@/lib/mood-icons";

const PEEK_DISHES = [
  {
    id: "crispy-hot-honey-chicken-sandwich",
    name: "Hot honey chicken",
    image: "/food/crispy-hot-honey-chicken-sandwich.jpg",
    alt: "Crispy fried chicken sandwich with honey drizzle",
  },
  {
    id: "mango-with-tajin",
    name: "Mango with Tajin",
    image: "/food/mango-with-tajin.jpg",
    alt: "Fresh mango slices dusted with Tajin",
  },
  {
    id: "birria-tacos",
    name: "Birria tacos",
    image: "/food/birria-tacos.jpg",
    alt: "Crispy birria tacos with consomme",
  },
  {
    id: "avocado-toast",
    name: "Avocado toast",
    image: "/food/avocado-toast.jpg",
    alt: "Avocado toast on rustic bread",
  },
] as const;

const INTENTS = [
  {
    intent: "restaurant",
    label: "Go out",
    href: "/taste?intent=restaurant&from=home",
    Icon: MapPin,
    primary: true,
  },
  {
    intent: "recipe",
    label: "Make something",
    href: "/taste?intent=recipe&from=home",
    Icon: ChefHat,
    primary: true,
  },
  {
    intent: "snack",
    label: "Grab a snack",
    href: "/taste?intent=snack&from=home",
    Icon: Candy,
    primary: true,
  },
  {
    intent: "clue",
    label: "I have no clue",
    href: "/taste?intent=clue&from=home",
    Icon: CircleHelp,
    primary: false,
  },
] as const;

function IntentPicker({ id }: { id?: string }) {
  return (
    <div
      className="intent-picker"
      role="group"
      aria-label="How do you want to eat"
      id={id}
    >
      {INTENTS.map(({ intent, label, href, Icon, primary }) => (
        <Link
          key={intent}
          className={primary ? "cta intent-cta" : "cta-secondary intent-cta"}
          href={href}
        >
          <Icon size={20} strokeWidth={1.5} aria-hidden />
          {label}
        </Link>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <SiteHeader current="home" />
      <main id="top">
        <section className="hero" aria-labelledby="brand">
          <p className="eyebrow">Taste by feeling</p>
          <h1 id="brand">Hungry?</h1>
          <p className="lede">
            Let&apos;s figure out what you actually want.
          </p>
          <IntentPicker />

          <ul className="hero-peek" aria-label="Dishes you might get">
            {PEEK_DISHES.map((dish) => (
              <li key={dish.id}>
                <Image
                  src={dish.image}
                  alt={dish.alt}
                  width={240}
                  height={240}
                  sizes="(max-width: 720px) 28vw, 140px"
                  className="hero-peek-image"
                />
                <span className="hero-peek-name">{dish.name}</span>
              </li>
            ))}
          </ul>
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
