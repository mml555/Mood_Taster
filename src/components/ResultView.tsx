"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ChefHat, Clock, MapPin, Search, Sparkles } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
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
  Intent,
  Rating,
  Recipe,
  SessionState,
} from "@/lib/taste-types";

type ResultViewProps = {
  food: Food;
};

const SWIPE_THRESHOLD = 80;
const GEO_CACHE_KEY = "mood-taster-geo";
const GEO_CACHE_MS = 10 * 60 * 1000;

/** Always available, needs no key and no permission. The floor under Places. */
function mapsSearchUrl(food: Food): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${food.name} restaurant`,
  )}`;
}

function readCachedGeo(): { lat: number; lng: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(GEO_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      lat?: unknown;
      lng?: unknown;
      at?: unknown;
    };
    if (
      typeof parsed.lat !== "number" ||
      typeof parsed.lng !== "number" ||
      typeof parsed.at !== "number"
    ) {
      return null;
    }
    if (Date.now() - parsed.at > GEO_CACHE_MS) return null;
    return { lat: parsed.lat, lng: parsed.lng };
  } catch {
    return null;
  }
}

function writeCachedGeo(lat: number, lng: number): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      GEO_CACHE_KEY,
      JSON.stringify({ lat, lng, at: Date.now() }),
    );
  } catch {
    /* quota / private mode */
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
  const [lastRating, setLastRating] = useState<Rating | null>(null);
  const [emptyAlts, setEmptyAlts] = useState(false);

  const [riff, setRiff] = useState<string | null>(null);
  const [cookTip, setCookTip] = useState<string | null>(null);
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [placesState, setPlacesState] = useState<PlacesState>("locating");
  const [intent, setIntent] = useState<Intent | null>(null);

  const [whyPanelOpen, setWhyPanelOpen] = useState(false);
  const [rejectNoteText, setRejectNoteText] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustNote, setAdjustNote] = useState<string | null>(null);

  const [dragging, setDragging] = useState(false);
  const [exitDir, setExitDir] = useState<"left" | "right" | null>(null);
  const [swipeHint, setSwipeHint] = useState<"like" | "nope" | null>(null);

  // Identifies the current dish render, so a slow reply about a previous dish
  // cannot overwrite the copy for the one now on screen.
  const renderId = useRef(0);
  const pointerId = useRef<number | null>(null);
  const startX = useRef(0);
  const dragXRef = useRef(0);
  const busyRef = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    renderId.current += 1;
    const token = renderId.current;
    const abort = new AbortController();

    queueMicrotask(() => {
      setImgFailed(false);
      setWhyOpen(false);
      setDeltas(null);
      setLastRating(null);
      setEmptyAlts(false);
      setRiff(null);
      setCookTip(null);
      setWhyPanelOpen(false);
      setRejectNoteText("");
      setSwipeHint(null);
      setDragging(false);
      setExitDir(null);
      busyRef.current = false;
      dragXRef.current = 0;
      if (cardRef.current) cardRef.current.style.transform = "";
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
        setIntent(null);
        setSessionReady(true);
        return;
      }

      if (!session.servedIds.includes(food.id)) {
        writeSession(markServed(session, food.id));
      }

      const active = readSession() ?? session;
      applySessionView(food, active, dna, setExplanation, setAttrs);
      setIntent(active.answers.intent);
      setHasSession(true);
      setSessionReady(true);

      // Enhancement only. The explanation above is already correct and shown.
      void polish(food.id, active.answers, token, abort.signal);
    });

    /** Swaps in warmer copy once the model answers. Never blocks, never throws. */
    async function polish(
      foodId: string,
      answers: Answers,
      paintToken: number,
      signal: AbortSignal,
    ) {
      try {
        const res = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ foodId, answers }),
          signal,
        });
        if (!res.ok || paintToken !== renderId.current || signal.aborted) return;

        const data = (await res.json()) as {
          why: string | null;
          riff: string | null;
          cookTip?: string | null;
        };
        if (paintToken !== renderId.current || signal.aborted) return;

        if (data.why) setExplanation(data.why);
        if (data.riff) setRiff(data.riff);
        if (data.cookTip) setCookTip(data.cookTip);
      } catch {
        // Abort or network failure: deterministic copy stays on screen.
      }
    }

    return () => {
      abort.abort();
    };
  }, [food]);

  // Places only for Go out. Cook shows the recipe. Snack and no-clue stay dish-first.
  useEffect(() => {
    if (intent !== "restaurant") {
      setPlaces([]);
      setPlacesState("fallback");
      return;
    }

    const token = renderId.current;
    const abort = new AbortController();
    let cancelled = false;
    const fallbackTimer = window.setTimeout(() => {
      if (!cancelled) setPlacesState((s) => (s === "locating" ? "fallback" : s));
    }, 2500);

    queueMicrotask(() => {
      setPlaces([]);
      setPlacesState("locating");

      const cached = readCachedGeo();
      if (cached) {
        setPlacesState("loading");
        void load(cached.lat, cached.lng);
        // Refresh geo in the background for the next dish.
        refreshGeo();
        return;
      }

      if (typeof navigator === "undefined" || !navigator.geolocation) {
        setPlacesState("fallback");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return;
          writeCachedGeo(pos.coords.latitude, pos.coords.longitude);
          setPlacesState("loading");
          void load(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          if (!cancelled) setPlacesState("fallback");
        },
        { timeout: 5000, maximumAge: 300_000 },
      );
    });

    function refreshGeo() {
      if (typeof navigator === "undefined" || !navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          writeCachedGeo(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          /* keep cached coords */
        },
        { timeout: 8000, maximumAge: 60_000 },
      );
    }

    async function load(lat: number, lng: number) {
      try {
        const res = await fetch(
          `/api/places?foodId=${encodeURIComponent(food.id)}&lat=${lat}&lng=${lng}`,
          { signal: abort.signal },
        );
        if (cancelled || token !== renderId.current || abort.signal.aborted) {
          return;
        }

        const data = (await res.json()) as { places?: NearbyPlace[] };
        const found = data.places ?? [];

        if (found.length === 0) {
          setPlacesState("fallback");
          return;
        }
        setPlaces(found);
        setPlacesState("ready");
      } catch {
        if (!cancelled && !abort.signal.aborted) setPlacesState("fallback");
      }
    }

    return () => {
      cancelled = true;
      abort.abort();
      window.clearTimeout(fallbackTimer);
    };
  }, [food, intent]);

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
        busyRef.current = false;
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
    if (busyRef.current) return;
    const current = readSession();
    if (!current) {
      router.push("/taste");
      return;
    }
    busyRef.current = true;
    goToNext(current, current.answers);
  }, [goToNext, router]);

  /** Reject with a reason. The model moves the axes, the engine still ranks. */
  const onRejectWithNote = useCallback(async () => {
    if (busyRef.current) return;
    const current = readSession();
    if (!current) {
      router.push("/taste");
      return;
    }

    const note = rejectNoteText.trim();
    if (!note) {
      busyRef.current = true;
      goToNext(current, current.answers);
      return;
    }

    setAdjusting(true);
    busyRef.current = true;
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
      setLastRating(rating);
    },
    [food],
  );

  const rated = lastRating !== null;
  const showDone = lastRating === "nailed" || lastRating === "kinda";

  const animateExitThen = useCallback(
    (dir: "left" | "right", after: () => void) => {
      if (prefersReducedMotion()) {
        after();
        return;
      }
      setExitDir(dir);
      window.setTimeout(after, 320);
    },
    [],
  );

  const onLike = useCallback(() => {
    if (busyRef.current || rated) return;
    busyRef.current = true;
    onRate("nailed");
    busyRef.current = false;
  }, [onRate, rated]);

  const onNope = useCallback(() => {
    if (busyRef.current || rated) return;
    const current = readSession();
    if (!current) {
      router.push("/taste");
      return;
    }
    busyRef.current = true;
    onRate("nope");
    animateExitThen("left", () => {
      goToNext(current, current.answers);
    });
  }, [animateExitThen, goToNext, onRate, rated, router]);

  const onTryAgain = useCallback(() => {
    if (busyRef.current) return;
    const current = readSession();
    if (!current) {
      router.push("/taste");
      return;
    }
    busyRef.current = true;
    animateExitThen("left", () => {
      goToNext(current, current.answers);
    });
  }, [animateExitThen, goToNext, router]);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!hasSession || rated || busyRef.current || exitDir) return;
      if (e.button !== 0) return;
      pointerId.current = e.pointerId;
      startX.current = e.clientX;
      dragXRef.current = 0;
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [exitDir, hasSession, rated],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragging || pointerId.current !== e.pointerId) return;
      const next = e.clientX - startX.current;
      dragXRef.current = next;

      // Write the drag straight to the node. Routing every pointermove through
      // state re-renders the card, its image and the whole nearby list on each
      // frame, which is what makes the swipe stutter on a phone.
      const node = cardRef.current;
      if (node) {
        node.style.transform = `translateX(${next}px) rotate(${next / 28}deg)`;
      }

      // State still drives the like / nope badge, but only on a band change,
      // so a full swipe costs two renders instead of sixty.
      const hint =
        next > SWIPE_THRESHOLD / 2
          ? "like"
          : next < -SWIPE_THRESHOLD / 2
            ? "nope"
            : null;
      setSwipeHint((prev) => (prev === hint ? prev : hint));
    },
    [dragging],
  );

  const endDrag = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (pointerId.current !== e.pointerId) return;
      pointerId.current = null;
      setDragging(false);
      setSwipeHint(null);
      const x = dragXRef.current;
      dragXRef.current = 0;

      // Hand the transform back to CSS so the release springs home, and so the
      // exit rule (which is !important) is not fighting an inline value.
      if (cardRef.current) cardRef.current.style.transform = "";

      if (Math.abs(x) < SWIPE_THRESHOLD) return;

      if (x > 0) {
        onLike();
        return;
      }
      onNope();
    },
    [onLike, onNope],
  );

  const cardClass = [
    "result-card",
    dragging ? "is-dragging" : "",
    swipeHint === "like" ? "is-like" : "",
    swipeHint === "nope" ? "is-nope" : "",
    exitDir === "left" ? "is-exit-left" : "",
    exitDir === "right" ? "is-exit-right" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (emptyAlts) {
    return (
      <section className="result">
        <p className="eyebrow">That&apos;s the list</p>
        <h1 className="result-title">Nothing left</h1>
        <p className="result-desc">
          You saw the strong matches. Start over or check Taste DNA.
        </p>
        <div className="result-actions">
          <Link className="cta" href="/taste">
            Start over
          </Link>
          <Link className="text-link" href="/dna">
            <Sparkles size={16} strokeWidth={1.5} aria-hidden />
            See Taste DNA
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="result">
      <p className="eyebrow">
        {showDone
          ? "Your pick"
          : (adjustNote ??
            (rejectNote
              ? "Different one."
              : intent === "recipe"
                ? "Cook this"
                : intent === "restaurant"
                  ? "Go out"
                  : intent === "snack"
                    ? "Snack"
                    : "Your match"))}
      </p>

      <div
        ref={cardRef}
        className={cardClass}
        onPointerDown={hasSession ? onPointerDown : undefined}
        onPointerMove={hasSession ? onPointerMove : undefined}
        onPointerUp={hasSession ? endDrag : undefined}
        onPointerCancel={hasSession ? endDrag : undefined}
        role={hasSession ? "group" : undefined}
        aria-roledescription={hasSession ? "Swipeable recommendation" : undefined}
        aria-label={
          hasSession
            ? `${food.name}. Swipe right to like, left for not for me.`
            : undefined
        }
      >
        <span className="result-card-hint result-card-hint-like" aria-hidden>
          <span className="result-card-hint-mark">♡</span> Like
        </span>
        <span className="result-card-hint result-card-hint-nope" aria-hidden>
          <span className="result-card-hint-mark">×</span> Nope
        </span>

        <div className="result-media">
          {imgFailed ? (
            <div
              className="result-fallback"
              role="img"
              aria-label={food.imageAlt}
            >
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
              quality={75}
              sizes="(max-width: 720px) 92vw, 560px"
              className="result-image"
              onError={() => setImgFailed(true)}
              draggable={false}
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
      </div>

      {riff ? <p className="result-riff">{riff}</p> : null}

      {intent === "recipe" && food.recipe && hasSession && !showDone ? (
        <p className="result-act-link">
          <a href="#recipe">
            <ChefHat size={16} strokeWidth={1.5} aria-hidden />
            See recipe
          </a>
        </p>
      ) : null}

      {!sessionReady ? null : hasSession ? (
        <>
          {showDone ? (
            <div className="result-done" role="status" aria-live="polite">
              <p className="result-done-mark" aria-hidden>
                {lastRating === "nailed" ? "♡" : "✓"}
              </p>
              <h2 className="result-done-title">
                {lastRating === "nailed" ? "Locked in" : "Close enough"}
              </h2>
              <p className="result-done-copy">
                {deltas && deltas.length > 0
                  ? `Taste DNA updated. ${deltas
                      .map(
                        (d) =>
                          `${labelDimension(d.dimension)} ${d.direction === "up" ? "up" : "down"}`,
                      )
                      .join(", ")}.`
                  : "Got it. Your Taste DNA learned from this pick."}
              </p>
              <div className="result-done-actions">
                {intent === "recipe" ? (
                  food.recipe ? (
                    <a className="cta" href="#recipe">
                      <ChefHat size={20} strokeWidth={1.5} aria-hidden />
                      See recipe
                    </a>
                  ) : (
                    <Link className="cta" href="/taste">
                      Try again
                      <ArrowRight size={20} strokeWidth={1.5} aria-hidden />
                    </Link>
                  )
                ) : intent === "restaurant" ? (
                  <a
                    className="cta"
                    href={mapsSearchUrl(food)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin size={20} strokeWidth={1.5} aria-hidden />
                    Find nearby
                  </a>
                ) : (
                  <Link className="cta" href="/">
                    New craving
                    <ArrowRight size={20} strokeWidth={1.5} aria-hidden />
                  </Link>
                )}
                <Link className="cta-secondary" href="/">
                  Start over
                  <ArrowRight size={20} strokeWidth={1.5} aria-hidden />
                </Link>
              </div>
              <p className="result-done-dna">
                <Link href="/dna">
                  <Sparkles size={16} strokeWidth={1.5} aria-hidden />
                  Your Taste DNA
                </Link>
              </p>
            </div>
          ) : (
            <div className="reaction-dock">
              <div className="reaction-bar" role="group" aria-label="Reactions">
                <button
                  type="button"
                  className="reaction-btn reaction-btn-nope"
                  onClick={onNope}
                  disabled={rated || adjusting}
                  aria-label="Not for me"
                >
                  <span className="reaction-icon" aria-hidden>
                    ×
                  </span>
                  <span className="reaction-label">Nope</span>
                </button>
                <button
                  type="button"
                  className="reaction-btn"
                  onClick={onTryAgain}
                  disabled={adjusting}
                  aria-label="Try again"
                >
                  <span className="reaction-icon" aria-hidden>
                    ↻
                  </span>
                  <span className="reaction-label">Again</span>
                </button>
                <button
                  type="button"
                  className="reaction-btn reaction-btn-like"
                  onClick={onLike}
                  disabled={rated || adjusting}
                  aria-label="I like it"
                >
                  <span className="reaction-icon" aria-hidden>
                    ♡
                  </span>
                  <span className="reaction-label">Like</span>
                </button>
              </div>

              <div className="reaction-quiet">
                <button
                  type="button"
                  className="text-link"
                  onClick={() => onRate("kinda")}
                  disabled={rated || adjusting}
                >
                  Kinda
                </button>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => {
                    setWhyOpen((v) => !v);
                    setWhyPanelOpen(false);
                  }}
                  aria-expanded={whyOpen}
                  disabled={adjusting}
                >
                  Why this?
                </button>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => {
                    setWhyPanelOpen((v) => !v);
                    setWhyOpen(false);
                  }}
                  aria-expanded={whyPanelOpen}
                  disabled={adjusting}
                >
                  Off?
                </button>
              </div>
            </div>
          )}

          {!showDone && whyOpen ? (
            <p className="result-why" id="result-why">
              {explanation}
            </p>
          ) : null}

          {!showDone && whyPanelOpen ? (
            <div className="reject-panel">
              <label className="reject-label" htmlFor="reject-note">
                What&apos;s off?
              </label>
              <input
                id="reject-note"
                className="reject-input"
                type="text"
                autoComplete="off"
                enterKeyHint="go"
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
                  Skip
                </button>
              </div>
            </div>
          ) : null}

          {intent === "recipe" ? (
            food.recipe ? (
              <RecipeSection recipe={food.recipe} cookTip={cookTip} />
            ) : (
              <div className="recipe" id="recipe">
                <p className="recipe-label">
                  <ChefHat size={16} strokeWidth={1.5} aria-hidden />
                  Recipe
                </p>
                <p className="recipe-missing">
                  No recipe for this one. Try again for another pick.
                </p>
                {!showDone ? (
                  <button
                    type="button"
                    className="cta-secondary"
                    onClick={onTryAgain}
                    disabled={adjusting}
                  >
                    Try again
                  </button>
                ) : null}
              </div>
            )
          ) : intent === "restaurant" ? (
            <NearbySection food={food} places={places} state={placesState} />
          ) : null}

          {showDone ? <ProfileNudge context="result" /> : null}
        </>
      ) : (
        <div className="result-actions">
          <p className="result-desc">
            Start a session to match how you feel right now.
          </p>
          <Link className="cta" href="/">
            Hungry?
            <Search size={20} strokeWidth={1.5} aria-hidden />
          </Link>
        </div>
      )}
    </section>
  );
}

function RecipeSection({
  recipe,
  cookTip,
}: {
  recipe: Recipe;
  cookTip: string | null;
}) {
  return (
    <div className="recipe" id="recipe">
      <p className="recipe-label">
        <ChefHat size={16} strokeWidth={1.5} aria-hidden />
        Recipe
      </p>
      <p className="recipe-meta">
        <span>
          <Clock size={16} strokeWidth={1.5} aria-hidden />
          {recipe.timeMinutes} min
        </span>
        <span>{recipe.servings} servings</span>
      </p>

      {cookTip ? <p className="recipe-tip">{cookTip}</p> : null}

      <h2 className="recipe-heading">Ingredients</h2>
      <ul className="recipe-ingredients">
        {recipe.ingredients.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h2 className="recipe-heading">Steps</h2>
      <ol className="recipe-steps">
        {recipe.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
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
        <p className="nearby-label">
          <MapPin size={16} strokeWidth={1.5} aria-hidden />
          Nearby
        </p>
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
        <p className="nearby-label">
          <MapPin size={16} strokeWidth={1.5} aria-hidden />
          Nearby
        </p>
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
      <p className="nearby-label">
        <MapPin size={16} strokeWidth={1.5} aria-hidden />
        Nearby
      </p>
      <ul className="nearby-list">
        {places.map((p) => (
          <li key={`${p.name}-${p.address}`}>
            {p.mapsUri ? (
              <a
                className="nearby-place"
                href={p.mapsUri}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="nearby-place-icon" aria-hidden>
                  <MapPin size={20} strokeWidth={1.5} />
                </span>
                <span className="nearby-place-body">
                  <span className="nearby-head">
                    <span className="nearby-name">{p.name}</span>
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
                </span>
              </a>
            ) : (
              <span className="nearby-place is-static">
                <span className="nearby-place-icon" aria-hidden>
                  <MapPin size={20} strokeWidth={1.5} />
                </span>
                <span className="nearby-place-body">
                  <span className="nearby-head">
                    <span className="nearby-name">{p.name}</span>
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
                </span>
              </span>
            )}
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
