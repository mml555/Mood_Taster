"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getStamp,
  passportProgress,
  type PassportStamp,
  type PassportState,
} from "@/lib/passport";
import { CUISINES, type Cuisine } from "@/lib/cuisines";
import { loadGamificationForUser } from "@/lib/gamification-sync";

function formatMonthYear(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

function StampDetail({ stamp }: { stamp: PassportStamp }) {
  return (
    <div className="passport-detail">
      <p>
        {stamp.experiences}{" "}
        {stamp.experiences === 1 ? "experience" : "experiences"}
      </p>
      <p>Average match {Math.round(stamp.avgMatch * 100)}%</p>
      {stamp.favoriteDishName ? (
        <p>Favorite: {stamp.favoriteDishName}</p>
      ) : null}
      <p>First explored: {formatMonthYear(stamp.firstExploredAt)}</p>
    </div>
  );
}

export function PassportView() {
  const [passport, setPassport] = useState<PassportState | null>(null);
  const [selected, setSelected] = useState<Cuisine | null>(null);

  useEffect(() => {
    queueMicrotask(async () => {
      const progress = await loadGamificationForUser();
      setPassport(progress.passport);
    });
  }, []);

  if (!passport) {
    return (
      <section className="explore">
        <p className="eyebrow">Passport</p>
        <h1 className="dna-title">Loading…</h1>
      </section>
    );
  }

  const progress = passportProgress(passport);
  const detail = selected ? getStamp(passport, selected) : null;

  return (
    <section className="explore">
      <p className="eyebrow">Food Passport</p>
      <h1 className="dna-title">Passport</h1>
      <p className="dna-discovery">
        <span className="dna-discovery-value">{progress.explored}</span> /{" "}
        {progress.total} cuisines
      </p>
      <p className="dna-lede">
        Confirm a match to stamp a cuisine. Rate dishes you try.
      </p>

      <ul className="passport-grid" role="list">
        {CUISINES.map((cuisine) => {
          const stamp = getStamp(passport, cuisine);
          const stamped = Boolean(stamp);
          return (
            <li key={cuisine}>
              <button
                type="button"
                className={
                  stamped
                    ? "passport-chip is-stamped"
                    : "passport-chip"
                }
                onClick={() => setSelected(cuisine)}
                aria-pressed={selected === cuisine}
              >
                {cuisine}
              </button>
            </li>
          );
        })}
      </ul>

      {selected ? (
        <aside className="explore-block callout" aria-live="polite">
          <p className="callout-label">{selected}</p>
          {detail ? (
            <StampDetail stamp={detail} />
          ) : (
            <p>Not stamped yet. Try this cuisine and rate it.</p>
          )}
        </aside>
      ) : null}

      <div className="result-actions">
        <Link className="cta-secondary" href="/explore">
          Back to Explore
        </Link>
        <Link className="cta" href="/taste">
          Find a dish
        </Link>
      </div>
    </section>
  );
}
