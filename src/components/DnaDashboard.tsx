"use client";

import Link from "next/link";
import { RotateCcw, Sparkles } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";
import {
  DNA_DIMENSIONS,
  createNeutralDna,
  discoveryPercent,
  labelDimension,
  readDna,
  resetDna,
  strongestDimensions,
} from "@/lib/dna";
import type { DnaDimension, DnaProfile } from "@/lib/taste-types";

const FLAVOR_DIMS: DnaDimension[] = ["savory", "spicy", "sweet", "fresh"];
const TEXTURE_DIMS: DnaDimension[] = ["crunchy", "creamy", "juicy", "soft"];

const DNA_EVENT = "mood-taster-dna-changed";

function subscribeDna(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener(DNA_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(DNA_EVENT, handler);
  };
}

function getDnaSnapshot(): DnaProfile {
  return readDna();
}

function getServerDnaSnapshot(): DnaProfile {
  return createNeutralDna();
}

function notifyDnaChanged() {
  window.dispatchEvent(new Event(DNA_EVENT));
}

export function DnaDashboard() {
  const dna = useSyncExternalStore(
    subscribeDna,
    getDnaSnapshot,
    getServerDnaSnapshot,
  );

  const onReset = useCallback(() => {
    resetDna();
    notifyDnaChanged();
  }, []);

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
          ratings, locally on this device.
        </p>
        <Link className="cta" href="/taste">
          Start a session
        </Link>
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
      <p className="dna-lede">
        Built from ratings on this device. No account. Reset anytime for a clean
        demo run.
      </p>

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
