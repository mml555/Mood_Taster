"use client";

import Link from "next/link";
import { Heart, RotateCcw, Sparkles, Utensils, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  DNA_DIMENSIONS,
  createNeutralDna,
  discoveryPercent,
  dnaHasEvidence,
  labelDimension,
  strongestDimensions,
  underexploredDimensions,
} from "@/lib/dna";
import { loadDnaForUser, resetDnaEverywhere } from "@/lib/dna-sync";
import { DietaryPrefsEditor } from "@/components/DietaryPrefsEditor";
import { ExploreBalanceControl } from "@/components/ExploreBalanceControl";
import { ProfileNudge } from "@/components/ProfileNudge";
import { DNA_DIMENSION_ICONS } from "@/lib/mood-icons";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { loadGamificationForUser } from "@/lib/gamification-sync";
import {
  dimensionLevelLabel,
  overallTasteLabel,
  type XpState,
} from "@/lib/xp";
import { formatStreak, type StreakState } from "@/lib/streak";
import type { DnaDimension, DnaProfile } from "@/lib/taste-types";

const FLAVOR_DIMS: DnaDimension[] = ["savory", "spicy", "sweet", "fresh"];
const TEXTURE_DIMS: DnaDimension[] = ["crunchy", "creamy", "juicy", "soft"];

export function DnaDashboard() {
  const [dna, setDna] = useState<DnaProfile | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [xp, setXp] = useState<XpState | null>(null);
  const [streak, setStreak] = useState<StreakState | null>(null);

  useEffect(() => {
    queueMicrotask(async () => {
      const [loaded, progress] = await Promise.all([
        loadDnaForUser(),
        loadGamificationForUser(),
      ]);
      setDna(loaded);
      setXp(progress.xp);
      setStreak(progress.streak);

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

  const onReset = useCallback(() => {
    void resetDnaEverywhere().then(() => {
      setDna(createNeutralDna());
    });
  }, []);

  if (!dna) {
    return (
      <section className="dna">
        <p className="eyebrow">Your Taste</p>
        <h1 className="dna-title">Loading…</h1>
      </section>
    );
  }

  const discovery = discoveryPercent(dna);
  const hasEvidence = dnaHasEvidence(dna);
  const develop = underexploredDimensions(dna, 3);
  const flavors = strongestDimensions(dna, FLAVOR_DIMS, 3, "experience");
  const textures = strongestDimensions(dna, TEXTURE_DIMS, 3, "experience");
  const evidenced = DNA_DIMENSIONS.filter(
    (d) => dna.prefs[d].samples > 0 || dna.experience[d].samples > 0,
  );

  const lede = signedIn
    ? "Saved to your profile. Rate more dishes for better picks."
    : isSupabaseConfigured()
      ? "Built from ratings on this device. Save it to keep it."
      : "Built from ratings on this device. No account needed.";

  if (!hasEvidence) {
    return (
      <section className="dna">
        <p className="eyebrow">
          <Sparkles size={16} strokeWidth={1.5} aria-hidden /> Your Stats
        </p>
        <h1 className="dna-title">Nothing yet</h1>
        <p className="dna-lede">
          Take the quiz or rate a dish. Your Taste DNA grows from that.
        </p>
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
        <section className="account-dietary" aria-labelledby="diet-title">
          <h2 id="diet-title" className="dietary-section-title">
            Diet and allergies
          </h2>
          <DietaryPrefsEditor compact />
        </section>
      </section>
    );
  }

  const leadDevelop = develop[0];

  return (
    <section className="dna">
      <p className="eyebrow">
        <Sparkles size={16} strokeWidth={1.5} aria-hidden /> Your Stats
      </p>
      <h1 className="dna-title">Taste DNA</h1>
      <div className="dna-meter" aria-label={`${discovery}% discovered`}>
        <div
          className={
            discovery > 0 ? "dna-meter-fill has-tip" : "dna-meter-fill"
          }
          style={{ width: `${discovery}%` }}
        />
      </div>
      <p className="dna-discovery">
        <span className="dna-discovery-value">{discovery}%</span> discovered
        {xp ? (
          <>
            {" "}
            · <span className="dna-level">{overallTasteLabel(xp)}</span>
          </>
        ) : null}
      </p>
      {streak && streak.count > 0 ? (
        <p className="dna-streak">{formatStreak(streak)}</p>
      ) : null}
      <p className="dna-lede">{lede}</p>

      {leadDevelop ? (
        <aside className="dna-develop callout" aria-labelledby="develop-title">
          <p className="callout-label" id="develop-title">
            Develop your taste
          </p>
          <p>
            You like{" "}
            <strong>{labelDimension(leadDevelop.dimension)}</strong>. Try it
            next.
          </p>
          {develop.length > 1 ? (
            <ul className="dna-develop-list">
              {develop.slice(1).map(({ dimension }) => (
                <li key={dimension}>{labelDimension(dimension)}</li>
              ))}
            </ul>
          ) : null}
          <div className="result-actions">
            <Link className="cta-highlight" href="/explore">
              Start a Taste Quest
            </Link>
            <Link className="cta-secondary" href="/taste">
              <Utensils size={20} strokeWidth={1.5} aria-hidden />
              Show me
            </Link>
          </div>
        </aside>
      ) : null}

      {xp && DNA_DIMENSIONS.some((d) => xp.byDimension[d] > 0) ? (
        <div className="dna-block">
          <h2 className="dna-heading">Flavor XP</h2>
          <ul className="dna-list">
            {DNA_DIMENSIONS.filter((d) => xp.byDimension[d] > 0)
              .sort((a, b) => xp.byDimension[b] - xp.byDimension[a])
              .slice(0, 5)
              .map((dimension) => (
                <li key={dimension}>
                  <span className="dna-dim">
                    {labelDimension(dimension)}
                  </span>
                  <span className="dna-meta">
                    {dimensionLevelLabel(xp.byDimension[dimension])} ·{" "}
                    {xp.byDimension[dimension]} XP
                  </span>
                </li>
              ))}
          </ul>
        </div>
      ) : null}

      <section className="account-dietary" aria-labelledby="balance-title">
        <ExploreBalanceControl />
      </section>

      {flavors.length > 0 ? (
        <div className="dna-block">
          <h2 className="dna-heading">Lived flavors</h2>
          <ul className="dna-list">
            {flavors.map(({ dimension, entry }) => {
              const Icon = DNA_DIMENSION_ICONS[dimension];
              return (
                <li key={dimension}>
                  <span className="dna-dim">
                    {Icon ? (
                      <span className="dna-dim-icon" aria-hidden>
                        <Icon size={20} strokeWidth={1.5} />
                      </span>
                    ) : null}
                    {labelDimension(dimension)}
                  </span>
                  <span className="dna-meta">
                    {Math.round(entry.score * 100)} · {entry.samples} tries
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {textures.length > 0 ? (
        <div className="dna-block">
          <h2 className="dna-heading">Lived textures</h2>
          <ul className="dna-list">
            {textures.map(({ dimension, entry }) => {
              const Icon = DNA_DIMENSION_ICONS[dimension];
              return (
                <li key={dimension}>
                  <span className="dna-dim">
                    {Icon ? (
                      <span className="dna-dim-icon" aria-hidden>
                        <Icon size={20} strokeWidth={1.5} />
                      </span>
                    ) : null}
                    {labelDimension(dimension)}
                  </span>
                  <span className="dna-meta">
                    {Math.round(entry.score * 100)} · {entry.samples} tries
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className="dna-block">
        <h2 className="dna-heading">Preference vs experience</h2>
        <ul className="dna-list">
          {evidenced.map((dimension) => {
            const pref = dna.prefs[dimension];
            const exp = dna.experience[dimension];
            const Icon = DNA_DIMENSION_ICONS[dimension];
            return (
              <li key={dimension}>
                <span className="dna-dim">
                  {Icon ? (
                    <span className="dna-dim-icon" aria-hidden>
                      <Icon size={20} strokeWidth={1.5} />
                    </span>
                  ) : null}
                  {labelDimension(dimension)}
                </span>
                <span className="dna-meta">
                  like{" "}
                  {pref.samples > 0 ? Math.round(pref.score * 100) : "-"} ·
                  lived{" "}
                  {exp.samples > 0 ? Math.round(exp.score * 100) : "-"} ·{" "}
                  {exp.samples} tries
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <ProfileNudge context="dna" />

      <div className="result-actions">
        <Link className="cta-secondary" href="/favorites">
          <Heart size={18} strokeWidth={1.5} aria-hidden />
          Favorites
        </Link>
      </div>

      <section className="account-dietary" aria-labelledby="diet-title">
        <h2 id="diet-title" className="dietary-section-title">
          Diet and allergies
        </h2>
        <DietaryPrefsEditor compact />
      </section>

      <div className="result-actions">
        <Link className="cta" href="/taste">
          <RotateCcw size={18} strokeWidth={1.5} aria-hidden />
          Try again
        </Link>
        <button type="button" className="reject-btn" onClick={onReset}>
          <X size={16} strokeWidth={1.5} aria-hidden />
          Reset
        </button>
      </div>
    </section>
  );
}
