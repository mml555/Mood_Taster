"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  ChefHat,
  MapPin,
  Share2,
} from "lucide-react";
import { ProfileNudge } from "@/components/ProfileNudge";
import { clearDoneMeta, readDoneMeta } from "@/lib/done-meta";
import { mapsSearchUrl } from "@/lib/places-prefetch";
import { readSession } from "@/lib/session";
import type { Food, Intent } from "@/lib/taste-types";

function intentSubtitle(intent: Intent | null, food: Food): string {
  if (intent === "recipe") return food.recipe ? "Home recipe" : "Cook path";
  if (intent === "restaurant") return "Nearby pick";
  if (intent === "snack") return "Quick bite";
  return "Your match";
}

function primaryCta(
  intent: Intent | null,
  food: Food,
): { href: string; label: string; external?: boolean; Icon: typeof MapPin } {
  if (intent === "recipe" && food.recipe) {
    return {
      href: `/result/${food.id}/recipe`,
      label: "View Recipe",
      Icon: ChefHat,
    };
  }
  if (intent === "restaurant") {
    return {
      href: mapsSearchUrl(food),
      label: "Open Directions",
      external: true,
      Icon: MapPin,
    };
  }
  return {
    href: "/taste",
    label: intent === "snack" ? "Enjoy" : "New craving",
    Icon: ArrowRight,
  };
}

export function CompletionView({ food }: { food: Food }) {
  // One piece of state, not three. These values are read together in a single
  // pass and only ever change together, so splitting them meant three setState
  // calls and three renders for what is one update.
  const [session, setSession] = useState<{
    intent: Intent | null;
    levelLabel: string | null;
    deltasLine: string | null;
  }>({ intent: null, levelLabel: null, deltasLine: null });

  const [shareNote, setShareNote] = useState<string | null>(null);

  useEffect(() => {
    // Reads localStorage, which does not exist during the server render, so
    // this cannot move into a lazy useState initializer without breaking
    // hydration. clearDoneMeta() is a genuine side effect on that store, which
    // also rules out useSyncExternalStore (snapshots have to stay pure). An
    // effect is the correct home for it; the rule's cascading-render concern is
    // answered by the single setState above.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession({
      intent: readSession()?.answers.intent ?? null,
      levelLabel: readDoneMeta(food.id)?.levelLabel ?? null,
      deltasLine: readDoneMeta(food.id)?.deltasLine ?? null,
    });
    clearDoneMeta();
  }, [food.id]);

  const { intent, levelLabel, deltasLine } = session;

  const cta = primaryCta(intent, food);
  const subtitle = intentSubtitle(intent, food);

  const onShare = async () => {
    const text = `My mood tastes like ${food.name}.`;
    const url = typeof window !== "undefined" ? window.location.origin : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: "Mood Taster", text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`.trim());
      setShareNote("Copied");
      window.setTimeout(() => setShareNote(null), 2000);
    } catch {
      /* user cancelled share */
    }
  };

  return (
    <section className="completion" aria-labelledby="completion-title">
      <div className="completion-body">
        <p className="completion-mark" aria-hidden>
          <Check size={36} strokeWidth={2} />
        </p>
        <h1 id="completion-title" className="completion-title">
          Decision made.
        </h1>
        <p className="completion-copy">Your only job now is to eat.</p>

        <div className="completion-pick">
          <Image
            src={food.image}
            alt=""
            width={72}
            height={72}
            className="completion-thumb"
          />
          <div className="completion-pick-copy">
            <p className="completion-pick-name">{food.name}</p>
            <p className="completion-pick-meta">{subtitle}</p>
            {levelLabel ? (
              <p className="completion-level">{levelLabel}</p>
            ) : deltasLine ? (
              <p className="completion-level">{deltasLine}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="completion-actions">
        {cta.external ? (
          <a
            className="cta"
            href={cta.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            <cta.Icon size={20} strokeWidth={1.5} aria-hidden />
            {cta.label}
          </a>
        ) : (
          <Link className="cta" href={cta.href}>
            <cta.Icon size={20} strokeWidth={1.5} aria-hidden />
            {cta.label}
          </Link>
        )}
        <div className="completion-secondary">
          <Link className="cta-secondary" href="/taste">
            Taste another mood
          </Link>
          <button type="button" className="cta-secondary" onClick={onShare}>
            <Share2 size={18} strokeWidth={1.5} aria-hidden />
            {shareNote ?? "Share"}
          </button>
        </div>
        <p className="completion-dna">
          <Link href="/dna">Your Taste DNA</Link>
        </p>
      </div>

      <ProfileNudge context="result" />
    </section>
  );
}
