"use client";

import Link from "next/link";
import {
  Beef,
  Cookie,
  Flame,
  Heart,
  Pizza,
  Sparkles,
  Star,
  Utensils,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  DNA_DIMENSIONS,
  dnaHasEvidence,
  labelDimension,
  strongestDimensions,
} from "@/lib/dna";
import { loadDnaForUser } from "@/lib/dna-sync";
import { DietaryPrefsEditor } from "@/components/DietaryPrefsEditor";
import { ExploreBalanceControl } from "@/components/ExploreBalanceControl";
import { ProfileNudge } from "@/components/ProfileNudge";
import { DNA_DIMENSION_ICONS } from "@/lib/mood-icons";
import { loadGamificationForUser } from "@/lib/gamification-sync";
import { readHistory } from "@/lib/history";
import { loadHistoryForUser } from "@/lib/history-sync";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { overallTasteLabel, type XpState } from "@/lib/xp";
import { formatStreak, type StreakState } from "@/lib/streak";
import type { DnaDimension, DnaProfile } from "@/lib/taste-types";

const CRAVING_DIMS: DnaDimension[] = [
  "savory",
  "spicy",
  "sweet",
  "crunchy",
  "creamy",
  "fresh",
];

const CRAVING_ICONS: Partial<
  Record<DnaDimension, typeof Flame>
> = {
  savory: Beef,
  spicy: Flame,
  sweet: Cookie,
  crunchy: Cookie,
  creamy: Cookie,
  fresh: Sparkles,
};

export function DnaDashboard() {
  const [dna, setDna] = useState<DnaProfile | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [xp, setXp] = useState<XpState | null>(null);
  const [streak, setStreak] = useState<StreakState | null>(null);
  const [moodsTasted, setMoodsTasted] = useState(0);

  useEffect(() => {
    queueMicrotask(async () => {
      const [loaded, progress] = await Promise.all([
        loadDnaForUser(),
        loadGamificationForUser(),
        loadHistoryForUser(),
      ]);
      setDna(loaded);
      setXp(progress.xp);
      setStreak(progress.streak);
      setMoodsTasted(readHistory().entries.length);

      if (!isSupabaseConfigured()) {
        setSignedIn(false);
        return;
      }
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setSignedIn(Boolean(user));
      } catch {
        setSignedIn(false);
      }
    });
  }, []);

  if (!dna) {
    return (
      <section className="stats-dash" aria-busy="true" aria-label="Loading stats">
        <div className="skeleton-block" style={{ width: "200px", height: "32px" }} />
        <div className="stats-grid">
          <div className="skeleton-card" style={{ height: "120px" }} />
          <div className="skeleton-card" style={{ height: "120px" }} />
        </div>
      </section>
    );
  }

  const hasEvidence = dnaHasEvidence(dna);
  const streakDays = streak?.count ?? 0;
  const top = strongestDimensions(dna, CRAVING_DIMS, 3, "effective");
  const maxScore = Math.max(...top.map((t) => t.entry.score), 0.01);

  if (!hasEvidence && moodsTasted === 0) {
    return (
      <section className="stats-dash">
        <div className="stats-head">
          <h1 className="stats-title">Your Stats</h1>
          <p className="stats-lede">
            Take the quiz or rate a dish. Stats grow from that.
          </p>
        </div>
        <div className="result-actions">
          <Link className="cta" href="/taste">
            <Utensils size={20} strokeWidth={1.5} aria-hidden />
            Show me
          </Link>
          <Link className="cta-secondary" href="/favorites">
            <Heart size={18} strokeWidth={1.5} aria-hidden />
            Favorites
          </Link>
        </div>
        <ProfileNudge context="dna" />
      </section>
    );
  }

  return (
    <section className="stats-dash">
      <span className="stats-decor" style={{ top: "2.5rem", right: "1rem" }} aria-hidden>
        <Star size={64} className="fill-current" />
      </span>
      <span
        className="stats-decor"
        style={{ bottom: "10rem", left: "-1.5rem", color: "var(--ink)", opacity: 0.1 }}
        aria-hidden
      >
        <Pizza size={80} />
      </span>

      <div className="stats-head">
        <h1 className="stats-title">Your Stats</h1>
        <p className="stats-lede">
          {xp ? overallTasteLabel(xp) : "Keep exploring new flavors!"}
          {signedIn ? " Saved to your profile." : ""}
        </p>
      </div>

      <div className="stats-grid">
        <div className="stats-card">
          <Flame size={28} style={{ color: "var(--accent)" }} aria-hidden />
          <span className="stats-card-value">{streakDays}</span>
          <span className="stats-card-label">
            {streak && streak.count > 0 ? formatStreak(streak) : "Week Streak"}
          </span>
        </div>
        <div className="stats-card stats-card-ink">
          <Utensils size={28} style={{ color: "var(--accent)" }} aria-hidden />
          <span className="stats-card-value">{moodsTasted || DNA_DIMENSIONS.filter((d) => dna.experience[d].samples > 0).length}</span>
          <span className="stats-card-label">Moods Tasted</span>
        </div>
      </div>

      <div className="stats-cravings">
        <h2>Top Cravings</h2>
        {top.length === 0 ? (
          <p className="stats-lede">Rate a few dishes to see your top cravings.</p>
        ) : (
          top.map(({ dimension, entry }) => {
            const Icon = CRAVING_ICONS[dimension] ?? DNA_DIMENSION_ICONS[dimension] ?? Sparkles;
            const pct = Math.round((entry.score / maxScore) * 100);
            return (
              <div key={dimension} className="stats-craving-row">
                <span className="stats-craving-icon" aria-hidden>
                  <Icon size={20} strokeWidth={1.5} />
                </span>
                <div className="stats-craving-meta">
                  <div className="stats-craving-top">
                    <span>{labelDimension(dimension)}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="stats-bar" aria-hidden>
                    <div
                      className="stats-bar-fill"
                      style={{ width: `${Math.max(8, pct)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="stats-secondary">
        <ExploreBalanceControl />
        <section className="account-dietary" aria-labelledby="diet-title">
          <h2 id="diet-title" className="dietary-section-title">
            Diet and allergies
          </h2>
          <DietaryPrefsEditor compact />
        </section>
        <p className="result-dna-link">
          <Link href="/account">See Taste DNA on Profile</Link>
          {" · "}
          <Link href="/history">History</Link>
          {" · "}
          <Link href="/explore">Explore</Link>
        </p>
        <ProfileNudge context="dna" />
      </div>
    </section>
  );
}
