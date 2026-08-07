"use client";

import Link from "next/link";
import { RotateCcw, Search, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  DNA_DIMENSIONS,
  createNeutralDna,
  discoveryPercent,
  labelDimension,
  strongestDimensions,
} from "@/lib/dna";
import { loadDnaForUser, resetDnaEverywhere } from "@/lib/dna-sync";
import { DietaryPrefsEditor } from "@/components/DietaryPrefsEditor";
import { ProfileNudge } from "@/components/ProfileNudge";
import { DNA_DIMENSION_ICONS } from "@/lib/mood-icons";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { DnaDimension, DnaProfile } from "@/lib/taste-types";

const FLAVOR_DIMS: DnaDimension[] = ["savory", "spicy", "sweet", "fresh"];
const TEXTURE_DIMS: DnaDimension[] = ["crunchy", "creamy", "juicy", "soft"];

export function DnaDashboard() {
  const [dna, setDna] = useState<DnaProfile | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    queueMicrotask(async () => {
      const loaded = await loadDnaForUser();
      setDna(loaded);

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
  const evidenced = DNA_DIMENSIONS.filter((d) => dna[d].samples > 0);
  const flavors = strongestDimensions(dna, FLAVOR_DIMS);
  const textures = strongestDimensions(dna, TEXTURE_DIMS);

  const lede = signedIn
    ? "Saved to your profile. Rate more dishes to sharpen matches."
    : isSupabaseConfigured()
      ? "Built from ratings on this device. A free profile keeps it with you."
      : "Built from ratings on this device. No account needed.";

  if (evidenced.length === 0) {
    return (
      <section className="dna">
        <p className="eyebrow">
          <Sparkles size={16} strokeWidth={1.5} aria-hidden /> Your Taste
        </p>
        <h1 className="dna-title">Nothing yet</h1>
        <p className="dna-lede">
          Rate a dish. Your Taste DNA grows from that.
        </p>
        <div className="result-actions">
          <Link className="cta" href="/taste">
            Show me
            <Search size={20} strokeWidth={1.5} aria-hidden />
          </Link>
        </div>
        <ProfileNudge context="dna" />
      </section>
    );
  }

  return (
    <section className="dna">
      <p className="eyebrow">
        <Sparkles size={16} strokeWidth={1.5} aria-hidden /> Your Taste
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
      </p>
      <p className="dna-lede">{lede}</p>

      {flavors.length > 0 ? (
        <div className="dna-block">
          <h2 className="dna-heading">Strongest flavors</h2>
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
                  {Math.round(entry.score * 100)} · {entry.samples} samples
                </span>
              </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {textures.length > 0 ? (
        <div className="dna-block">
          <h2 className="dna-heading">Strongest textures</h2>
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
                  {Math.round(entry.score * 100)} · {entry.samples} samples
                </span>
              </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className="dna-block">
        <h2 className="dna-heading">All evidence</h2>
        <ul className="dna-list">
          {evidenced.map((dimension) => {
            const entry = dna[dimension];
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
                  {Math.round(entry.score * 100)} · conf{" "}
                  {Math.round(entry.confidence * 100)}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <ProfileNudge context="dna" />

      <section className="account-dietary" aria-labelledby="diet-title">
        <h2 id="diet-title" className="dietary-section-title">
          Diet and allergies
        </h2>
        <DietaryPrefsEditor compact />
      </section>

      <div className="result-actions">
        <Link className="cta" href="/taste">
          Try again
          <Search size={20} strokeWidth={1.5} aria-hidden />
        </Link>
        <button type="button" className="reject-btn" onClick={onReset}>
          <RotateCcw size={20} strokeWidth={1.5} aria-hidden />
          Reset
        </button>
      </div>
    </section>
  );
}
