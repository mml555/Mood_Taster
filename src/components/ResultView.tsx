"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  ChevronDown,
  MapPin,
  Minus,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyRating,
  labelDimension,
  readDna,
  type DnaDelta,
} from "@/lib/dna";
import { persistDna } from "@/lib/dna-sync";
import { ProfileNudge } from "@/components/ProfileNudge";
import { nextAfterReject, rank } from "@/lib/engine";
import {
  markRejected,
  markServed,
  readSession,
  writeSession,
} from "@/lib/session";
import type { NearbyPlace } from "@/app/api/places/route";
import type {
  Answers,
  DnaProfile,
  Food,
  Rating,
  SessionState,
} from "@/lib/taste-types";

type ResultViewProps = {
  food: Food;
};

/** Always available, needs no key and no permission. The floor under Places. */
function mapsSearchUrl(food: Food): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${food.name} restaurant`,
  )}`;
}

type PlacesState = "locating" | "loading" | "ready" | "fallback";

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

  const [riff, setRiff] = useState<string | null>(null);
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [placesState, setPlacesState] = useState<PlacesState>("locating");

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNoteText, setRejectNoteText] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustNote, setAdjustNote] = useState<string | null>(null);

  // Identifies the current dish render, so a slow reply about a previous dish
  // cannot overwrite the copy for the one now on screen.
  const renderId = useRef(0);

  useEffect(() => {
    renderId.current += 1;
    const token = renderId.current;

    queueMicrotask(() => {
      setImgFailed(false);
      setWhyOpen(false);
      setDeltas(null);
      setRated(false);
      setEmptyAlts(false);
      setRiff(null);
      setRejectOpen(false);
      setRejectNoteText("");
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

      // Enhancement only. The explanation above is already correct and shown.
      void polish(food.id, active.answers, token);
    });

    /** Swaps in warmer copy once the model answers. Never blocks, never throws. */
    async function polish(foodId: string, answers: Answers, token: number) {
      try {
        const res = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ foodId, answers }),
        });
        if (!res.ok || token !== renderId.current) return;

        const data = (await res.json()) as {
          why: string | null;
          riff: string | null;
        };
        if (token !== renderId.current) return;

        if (data.why) setExplanation(data.why);
        if (data.riff) setRiff(data.riff);
      } catch {
        // The deterministic line stays on screen. Nothing to recover.
      }
    }
  }, [food]);

  // Places is about the dish, not the craving, so it loads independently of
  // session state.
  useEffect(() => {
    const token = renderId.current;
    let cancelled = false;

    queueMicrotask(() => {
      setPlaces([]);
      setPlacesState("locating");

      if (typeof navigator === "undefined" || !navigator.geolocation) {
        setPlacesState("fallback");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return;
          setPlacesState("loading");
          void load(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          if (!cancelled) setPlacesState("fallback");
        },
        { timeout: 8000, maximumAge: 300_000 },
      );
    });

    async function load(lat: number, lng: number) {
      try {
        const res = await fetch(
          `/api/places?foodId=${encodeURIComponent(food.id)}&lat=${lat}&lng=${lng}`,
        );
        if (cancelled || token !== renderId.current) return;

        const data = (await res.json()) as { places?: NearbyPlace[] };
        const found = data.places ?? [];

        if (found.length === 0) {
          setPlacesState("fallback");
          return;
        }
        setPlaces(found);
        setPlacesState("ready");
      } catch {
        if (!cancelled) setPlacesState("fallback");
      }
    }

    return () => {
      cancelled = true;
    };
  }, [food]);

  // Surface the model's summary of what it changed, once, on the next dish.
  useEffect(() => {
    queueMicrotask(() => {
      const stored = sessionStorage.getItem("mt:adjust-note");
      if (stored) {
        setAdjustNote(stored);
        sessionStorage.removeItem("mt:adjust-note");
      } else {
        setAdjustNote(null);
      }
    });
  }, [food]);

  const goToNext = useCallback(
    (session: SessionState, answers: Answers) => {
      const next = nextAfterReject(answers, readDna(), session, food.id);
      if (!next) {
        setEmptyAlts(true);
        return;
      }
      writeSession({
        ...markServed(markRejected(session, food.id), next.food.id),
        answers,
      });
      router.replace(`/result/${next.food.id}?alt=1`);
    },
    [food.id, router],
  );

  const onReject = useCallback(() => {
    const current = readSession();
    if (!current) {
      router.push("/taste");
      return;
    }
    goToNext(current, current.answers);
  }, [goToNext, router]);

  /** Reject with a reason. The model moves the axes, the engine still ranks. */
  const onRejectWithNote = useCallback(async () => {
    const current = readSession();
    if (!current) {
      router.push("/taste");
      return;
    }

    const note = rejectNoteText.trim();
    if (!note) {
      goToNext(current, current.answers);
      return;
    }

    setAdjusting(true);
    try {
      const res = await fetch("/api/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: current.answers, note }),
      });
      const data = res.ok
        ? ((await res.json()) as {
            answers: Answers | null;
            note: string | null;
          })
        : { answers: null, note: null };

      // A null adjustment is the normal unconfigured path, not an error.
      if (data.note) {
        sessionStorage.setItem("mt:adjust-note", data.note);
      }
      goToNext(current, data.answers ?? current.answers);
    } catch {
      goToNext(current, current.answers);
    } finally {
      setAdjusting(false);
    }
  }, [goToNext, rejectNoteText, router]);

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
        {adjustNote ??
          (rejectNote ? "Okay, different direction." : "We got it.")}
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

      {riff ? <p className="result-riff">{riff}</p> : null}

      <NearbySection food={food} places={places} state={placesState} />

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

          {rejectOpen ? (
            <div className="reject-panel">
              <label className="reject-label" htmlFor="reject-note">
                What&apos;s off about it?
              </label>
              <input
                id="reject-note"
                className="reject-input"
                type="text"
                autoComplete="off"
                maxLength={120}
                placeholder="too heavy, something colder"
                value={rejectNoteText}
                onChange={(e) => setRejectNoteText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !adjusting) {
                    void onRejectWithNote();
                  }
                }}
              />
              <div className="reject-actions">
                <button
                  type="button"
                  className="cta"
                  onClick={() => void onRejectWithNote()}
                  disabled={adjusting}
                >
                  {adjusting ? "Rethinking" : "Try again"}
                </button>
                <button
                  type="button"
                  className="text-link"
                  onClick={onReject}
                  disabled={adjusting}
                >
                  Just show me another
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="reject-btn"
              onClick={() => setRejectOpen(true)}
            >
              <RefreshCw size={20} strokeWidth={1.5} aria-hidden />
              Not feeling it
            </button>
          )}

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

          {rated ? <ProfileNudge context="result" /> : null}

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

function NearbySection({
  food,
  places,
  state,
}: {
  food: Food;
  places: NearbyPlace[];
  state: PlacesState;
}) {
  if (state === "locating" || state === "loading") {
    return (
      <div className="nearby">
        <p className="nearby-label">Where to get it</p>
        <p className="nearby-status" role="status">
          {state === "locating" ? "Finding you" : "Looking nearby"}
        </p>
      </div>
    );
  }

  // One slot, two outcomes. The fallback link is why a denied location or a
  // quota error never leaves a dead region on the page.
  if (state !== "ready" || places.length === 0) {
    return (
      <div className="nearby">
        <p className="nearby-label">Where to get it</p>
        <a
          className="nearby-link"
          href={mapsSearchUrl(food)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MapPin size={20} strokeWidth={1.5} aria-hidden />
          Search maps for {food.name}
        </a>
      </div>
    );
  }

  return (
    <div className="nearby">
      <p className="nearby-label">Where to get it</p>
      <ul className="nearby-list">
        {places.map((p) => (
          <li key={`${p.name}-${p.address}`}>
            <span className="nearby-head">
              {p.mapsUri ? (
                <a href={p.mapsUri} target="_blank" rel="noopener noreferrer">
                  {p.name}
                </a>
              ) : (
                <span className="nearby-name">{p.name}</span>
              )}
              <span className="nearby-meta">
                {[
                  p.miles !== null ? `${p.miles.toFixed(1)} mi` : null,
                  p.rating !== null ? p.rating.toFixed(1) : null,
                ]
                  .filter(Boolean)
                  .join(" / ")}
              </span>
            </span>
            <span className="nearby-address">{p.address}</span>
          </li>
        ))}
      </ul>
    </div>
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
