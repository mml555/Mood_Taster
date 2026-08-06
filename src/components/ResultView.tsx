"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  ChevronDown,
  Minus,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  applyRating,
  labelDimension,
  readDna,
  type DnaDelta,
} from "@/lib/dna";
import { persistDna } from "@/lib/dna-sync";
import { nextAfterReject, rank } from "@/lib/engine";
import {
  markRejected,
  markServed,
  readSession,
  writeSession,
} from "@/lib/session";
import type { DnaProfile, Food, Rating, SessionState } from "@/lib/taste-types";

type ResultViewProps = {
  food: Food;
};

export function ResultView({ food }: ResultViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rejectNote = searchParams.get("alt") === "1";

  // Neutral first paint: dish from server props only. Session UI mounts after.
  const [hasSession, setHasSession] = useState(false);
  const [explanation, setExplanation] = useState(food.description);
  const [attrs, setAttrs] = useState<string[]>(() =>
    [...food.flavorTags.map(capitalize), capitalize(food.heaviness)].slice(
      0,
      3,
    ),
  );
  const [sessionReady, setSessionReady] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [deltas, setDeltas] = useState<DnaDelta[] | null>(null);
  const [rated, setRated] = useState(false);
  const [emptyAlts, setEmptyAlts] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setImgFailed(false);
      setWhyOpen(false);
      setDeltas(null);
      setRated(false);
      setEmptyAlts(false);
      setExplanation(food.description);
      setAttrs(
        [...food.flavorTags.map(capitalize), capitalize(food.heaviness)].slice(
          0,
          3,
        ),
      );

      const session = readSession();
      const dna = readDna();

      if (!session) {
        setHasSession(false);
        setSessionReady(true);
        return;
      }

      if (!session.servedIds.includes(food.id)) {
        writeSession(markServed(session, food.id));
      }

      const active = readSession() ?? session;
      applySessionView(food, active, dna, setExplanation, setAttrs);
      setHasSession(true);
      setSessionReady(true);
    });
  }, [food]);

  const onReject = useCallback(() => {
    const current = readSession();
    if (!current) {
      router.push("/taste");
      return;
    }
    const next = nextAfterReject(current.answers, readDna(), current, food.id);
    if (!next) {
      setEmptyAlts(true);
      return;
    }
    writeSession(markServed(markRejected(current, food.id), next.food.id));
    router.replace(`/result/${next.food.id}?alt=1`);
  }, [food.id, router]);

  const onRate = useCallback(
    (rating: Rating) => {
      const { dna: next, deltas: changes } = applyRating(
        readDna(),
        food,
        rating,
      );
      void persistDna(next);
      setDeltas(changes.filter((d) => d.direction !== "flat"));
      setRated(true);
    },
    [food],
  );

  if (emptyAlts) {
    return (
      <section className="result">
        <p className="eyebrow">That&apos;s the list</p>
        <h1 className="result-title">No more matches for this craving</h1>
        <p className="result-desc">
          You worked through the strong candidates. Start a fresh session or
          tweak your Taste DNA.
        </p>
        <div className="result-actions">
          <Link className="cta" href="/taste">
            Start over
          </Link>
          <Link className="text-link" href="/dna">
            See Taste DNA
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="result">
      <p className="eyebrow">
        {rejectNote ? "Okay, different direction." : "We got it."}
      </p>

      <div className="result-media">
        {imgFailed ? (
          <div className="result-fallback" role="img" aria-label={food.imageAlt}>
            <span>{food.name}</span>
          </div>
        ) : (
          <Image
            key={food.image}
            src={food.image}
            alt={food.imageAlt}
            width={800}
            height={800}
            priority
            sizes="(max-width: 390px) 100vw, 640px"
            className="result-image"
            onError={() => setImgFailed(true)}
          />
        )}
      </div>

      <h1 className="result-title">{food.name}</h1>
      <p className="result-desc">{food.description}</p>

      {attrs.length > 0 ? (
        <ul className="result-attrs" aria-label="Matched attributes">
          {attrs.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      ) : null}

      {!sessionReady ? null : hasSession ? (
        <>
          <button
            type="button"
            className="why-toggle"
            aria-expanded={whyOpen}
            onClick={() => setWhyOpen((v) => !v)}
          >
            Why this?
            <ChevronDown
              size={20}
              strokeWidth={1.5}
              aria-hidden
              className={whyOpen ? "is-open" : undefined}
            />
          </button>
          {whyOpen ? <p className="result-why">{explanation}</p> : null}

          <div className="result-actions" role="group" aria-label="Feedback">
            <button
              type="button"
              className="feedback-btn"
              onClick={() => onRate("nailed")}
              disabled={rated}
            >
              <Check size={20} strokeWidth={1.5} aria-hidden />
              Nailed it
            </button>
            <button
              type="button"
              className="feedback-btn"
              onClick={() => onRate("kinda")}
              disabled={rated}
            >
              <Minus size={20} strokeWidth={1.5} aria-hidden />
              Kinda
            </button>
            <button
              type="button"
              className="feedback-btn"
              onClick={() => onRate("nope")}
              disabled={rated}
            >
              <X size={20} strokeWidth={1.5} aria-hidden />
              Nope
            </button>
          </div>

          <button type="button" className="reject-btn" onClick={onReject}>
            <RefreshCw size={20} strokeWidth={1.5} aria-hidden />
            Not feeling it
          </button>

          {deltas && deltas.length > 0 ? (
            <p className="dna-toast" role="status">
              Your Taste DNA changed.{" "}
              {deltas
                .map(
                  (d) =>
                    `${labelDimension(d.dimension)} ${d.direction === "up" ? "up" : "down"}`,
                )
                .join(", ")}
              .
            </p>
          ) : rated ? (
            <p className="dna-toast" role="status">
              Feedback saved.
            </p>
          ) : null}

          <p className="result-dna-link">
            <Link href="/dna">
              <Sparkles size={16} strokeWidth={1.5} aria-hidden />
              Your Taste DNA
            </Link>
          </p>
        </>
      ) : (
        <div className="result-actions">
          <p className="result-desc">
            Open this dish on its own. Start a session to get a match for how
            you want food to feel right now.
          </p>
          <Link className="cta" href="/taste">
            Start a session
          </Link>
        </div>
      )}
    </section>
  );
}

function applySessionView(
  food: Food,
  session: SessionState,
  dna: DnaProfile,
  setExplanation: (s: string) => void,
  setAttrs: (a: string[]) => void,
) {
  const rec = rank(session.answers, dna, session);
  const match =
    rec.primary.food.id === food.id
      ? rec.primary
      : rec.alternates.find((s) => s.food.id === food.id);

  if (match) {
    setExplanation(match.explanation);
    setAttrs(match.matchedAttributes);
    return;
  }

  setExplanation(food.description);
  setAttrs(food.flavorTags.map(capitalize).slice(0, 3));
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
