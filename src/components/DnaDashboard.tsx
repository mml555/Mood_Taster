"use client";

import Link from "next/link";
import { RotateCcw, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  DNA_DIMENSIONS,
  createNeutralDna,
  discoveryPercent,
  labelDimension,
  strongestDimensions,
} from "@/lib/dna";
import { loadDnaForUser, resetDnaEverywhere } from "@/lib/dna-sync";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { DnaDimension, DnaProfile } from "@/lib/taste-types";

const FLAVOR_DIMS: DnaDimension[] = ["savory", "spicy", "sweet", "fresh"];
const TEXTURE_DIMS: DnaDimension[] = ["crunchy", "creamy", "juicy", "soft"];

export function DnaDashboard() {
  const [dna, setDna] = useState<DnaProfile | null>(null);
  const [cloudHint, setCloudHint] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(async () => {
      const loaded = await loadDnaForUser();
      setDna(loaded);
      if (isSupabaseConfigured()) {
        setCloudHint(
          "Signed-in profiles sync Taste DNA to your account. Guests stay on this device only.",
        );
      } else {
        setCloudHint("Built from ratings on this device. No account required.");
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

  if (evidenced.length === 0) {
    return (
      <section className="dna">
        <p className="eyebrow">
          <Sparkles size={16} strokeWidth={1.5} aria-hidden /> Your Taste
        </p>
        <h1 className="dna-title">Nothing learned yet</h1>
        <p className="dna-lede">
          Finish a session and rate a dish. Your Taste DNA builds from those
          ratings
          {isSupabaseConfigured()
            ? ", and syncs to your account when you are signed in"
            : ", locally on this device"}
          .
        </p>
        <div className="result-actions">
          <Link className="cta" href="/taste">
            Start a session
          </Link>
          {isSupabaseConfigured() ? (
            <Link className="text-link" href="/signup">
              Create an account
            </Link>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="dna">
      <p className="eyebrow">
        <Sparkles size={16} strokeWidth={1.5} aria-hidden /> Your Taste
      </p>
      <h1 className="dna-title">Taste DNA</h1>
      <p className="dna-discovery">
        <span className="dna-discovery-value">{discovery}%</span> discovered
      </p>
      <p className="dna-lede">{cloudHint}</p>

      {flavors.length > 0 ? (
        <div className="dna-block">
          <h2 className="dna-heading">Strongest flavors</h2>
          <ul className="dna-list">
            {flavors.map(({ dimension, entry }) => (
              <li key={dimension}>
                <span>{labelDimension(dimension)}</span>
                <span className="dna-meta">
                  {Math.round(entry.score * 100)} · {entry.samples} samples
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {textures.length > 0 ? (
        <div className="dna-block">
          <h2 className="dna-heading">Strongest textures</h2>
          <ul className="dna-list">
            {textures.map(({ dimension, entry }) => (
              <li key={dimension}>
                <span>{labelDimension(dimension)}</span>
                <span className="dna-meta">
                  {Math.round(entry.score * 100)} · {entry.samples} samples
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="dna-block">
        <h2 className="dna-heading">All evidence</h2>
        <ul className="dna-list">
          {evidenced.map((dimension) => {
            const entry = dna[dimension];
            return (
              <li key={dimension}>
                <span>{labelDimension(dimension)}</span>
                <span className="dna-meta">
                  {Math.round(entry.score * 100)} · conf{" "}
                  {Math.round(entry.confidence * 100)}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="result-actions">
        <Link className="cta" href="/taste">
          Another session
        </Link>
        <button type="button" className="reject-btn" onClick={onReset}>
          <RotateCcw size={20} strokeWidth={1.5} aria-hidden />
          Reset profile
        </button>
      </div>
    </section>
  );
}
