"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChefHat,
  Heart,
  MapPin,
  RotateCcw,
  Utensils,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  applyRating,
  foodDimensions,
  formatDnaChangeLine,
  HIT_TAGS,
  MISS_TAGS,
  parseHitTags,
  parseMissTags,
  readDna,
} from "@/lib/dna";
import { persistDna } from "@/lib/dna-sync";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import { ProfileNudge } from "@/components/ProfileNudge";
import type { PlacesState } from "@/components/result/NearbySection";
import { readDietary } from "@/lib/dietary";
import { nextAfterReject, rank } from "@/lib/engine";
import { readExploreBalance } from "@/lib/explore-balance";
import { readFavorites } from "@/lib/favorites";
import { persistGamification } from "@/lib/gamification-sync";
import { writeDoneMeta } from "@/lib/done-meta";
import {
  recordRecommendationRating,
  recordRecommendationShown,
} from "@/lib/history-sync";
import { confirmPassportExperience, readPassport } from "@/lib/passport";
import { recordMeaningfulAction } from "@/lib/streak";
import { awardRatingXp, overallTasteLabel, readXp, writeXp } from "@/lib/xp";
import { capitalize } from "@/lib/explain";
import { loadCopyForFood, type PolishedCopy } from "@/lib/copy-prefetch";
import { parsePlacesResponse } from "@/lib/api-schemas";
import {
  readCachedGeo,
  readPrefetchedPlaces,
  writeCachedGeo,
  writePrefetchedPlaces,
} from "@/lib/places-prefetch";
import {
  markRejected,
  markServed,
  readSession,
  writeSession,
} from "@/lib/session";
import type {
  Answers,
  DnaProfile,
  Food,
  Intent,
  NearbyPlace,
  Rating,
  SessionState,
} from "@/lib/taste-types";

function NearbySectionSkeleton() {
  return (
    <div className="nearby nearby-skeleton" aria-hidden>
      <div className="skeleton-block" style={{ width: "80px", height: "20px", marginBottom: "12px" }} />
      <div className="skeleton-block" style={{ width: "100%", height: "72px", marginBottom: "12px" }} />
      <div className="skeleton-block" style={{ width: "100%", height: "72px" }} />
    </div>
  );
}

const NearbySection = dynamic(
  () =>
    import("@/components/result/NearbySection").then((m) => m.NearbySection),
  { ssr: false, loading: () => <NearbySectionSkeleton /> },
);

/**
 * How long after a dish paints the model may still rewrite its description.
 * Roughly how long it takes to reach that line from the title and image. Past
 * it the deterministic copy stands, and the model contributes only additive
 * lines. Tuned for feel, not for a measurement.
 */
const SWAP_DEADLINE_MS = 2000;

type ResultViewProps = {
  food: Food;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Seed intent on first paint so places can start without waiting on effects. */
function readIntentSync(): Intent | null {
  if (typeof window === "undefined") return null;
  return readSession()?.answers.intent ?? null;
}

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
  const [lastRating, setLastRating] = useState<Rating | null>(null);
  const [pendingRating, setPendingRating] = useState<Rating | null>(null);
  const [feedbackTags, setFeedbackTags] = useState<string[]>([]);
  const [emptyAlts, setEmptyAlts] = useState(false);

  const [riff, setRiff] = useState<string | null>(null);
  /** Model copy landed after this dish painted, so dissolve it in rather than cut. */
  const [swappedWhy, setSwappedWhy] = useState(false);
  const [lateRiff, setLateRiff] = useState(false);
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [placesState, setPlacesState] = useState<PlacesState>("locating");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [intent, setIntent] = useState<Intent | null>(readIntentSync);

  const [whyPanelOpen, setWhyPanelOpen] = useState(false);
  const [rejectNoteText, setRejectNoteText] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustNote, setAdjustNote] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  const [exitDir, setExitDir] = useState<"left" | "right" | null>(null);

  // Identifies the current dish render, so a slow reply about a previous dish
  // cannot overwrite the copy for the one now on screen.
  const renderId = useRef(0);
  const busyRef = useRef(false);
  /** User opted into city/ZIP; ignore late browser geolocation results. */
  const placesManualRef = useRef(false);

  useEffect(() => {
    renderId.current += 1;
    const token = renderId.current;

    queueMicrotask(() => {
      setImgFailed(false);
      setLastRating(null);
      setEmptyAlts(false);
      setRiff(null);
      setSwappedWhy(false);
      setLateRiff(false);
      setWhyPanelOpen(false);
      setRejectNoteText("");
      setExitDir(null);
      busyRef.current = false;
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

      const isAlternate = rejectNote;
      track(ANALYTICS_EVENTS.recommendation, {
        food_id: food.id,
        intent: active.answers.intent,
        alternate: isAlternate,
      });
      if (isAlternate) {
        track(ANALYTICS_EVENTS.alternate, {
          food_id: food.id,
          intent: active.answers.intent,
        });
      }

      const prefetched = readPrefetchedPlaces(food.id);
      void recordRecommendationShown({
        foodId: food.id,
        intent: active.answers.intent,
        answers: active.answers,
        place: prefetched?.[0] ?? null,
      });

      // Enhancement only. The explanation above is already correct and shown.
      polish(food.id, active.answers, token);
    });

    /**
     * Swaps in warmer copy. The quiz starts this fetch during the interstitial,
     * so in the normal flow it is already cached here and lands in this same
     * paint with nothing visibly changing.
     *
     * Three arrival windows, because rewriting a line the user is mid-sentence
     * through is worse than never rewriting it:
     *   cached        applied in the first paint, no transition needed
     *   under 2s      the line dissolves into the new one
     *   after 2s      the why line is left alone and only the riff applies,
     *                 which is additive rather than a rewrite
     *
     * Never awaited by the caller, never throws, never aborts: the request is
     * shared with any prefetch still in flight, so cancelling it on unmount
     * would throw away work another mount is waiting on. A stale reply is
     * dropped by the paint token instead.
     */
    function polish(foodId: string, answers: Answers, paintToken: number) {
      const paintedAt = Date.now();

      const paint = (copy: PolishedCopy | null, late: boolean) => {
        if (!copy || paintToken !== renderId.current) return;
        // Past the deadline the reader owns that line. Taking it back reads as
        // a glitch, not as an improvement.
        const rewritable = Date.now() - paintedAt < SWAP_DEADLINE_MS;
        if (copy.why && rewritable) {
          setExplanation(copy.why);
          if (late) setSwappedWhy(true);
        }
        if (copy.riff) {
          setRiff(copy.riff);
          if (late) setLateRiff(true);
        }
      };

      const { cached, pending } = loadCopyForFood(foodId, answers);
      if (cached) {
        paint(cached, false);
        return;
      }
      void pending.then((copy) => paint(copy, true));
    }

    // rejectNote only ever changes alongside food: rejecting routes to a new
    // food id carrying ?alt=1. Listed so the tracked alternate flag can never
    // go stale against the food it describes.
  }, [food, rejectNote]);

  // Places only for Go out. Cook shows the recipe. Snack and no-clue stay dish-first.
  useEffect(() => {
    if (intent !== "restaurant") {
      return;
    }

    const token = renderId.current;
    const abort = new AbortController();
    let cancelled = false;
    const fallbackTimer = window.setTimeout(() => {
      if (!cancelled) setPlacesState((s) => (s === "locating" ? "fallback" : s));
    }, 2500);

    queueMicrotask(() => {
      placesManualRef.current = false;
      setPlaces([]);
      setPlacesState("locating");
      setLocationError(null);

      const prefetched = readPrefetchedPlaces(food.id);
      if (prefetched && prefetched.length > 0) {
        setPlaces(prefetched);
        setPlacesState("ready");
        return;
      }

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
          if (cancelled || placesManualRef.current) return;
          writeCachedGeo(pos.coords.latitude, pos.coords.longitude);
          setPlacesState("loading");
          void load(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          if (!cancelled && !placesManualRef.current) {
            setPlacesState("fallback");
          }
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
        if (
          cancelled ||
          placesManualRef.current ||
          token !== renderId.current ||
          abort.signal.aborted
        ) {
          return;
        }

        const data = parsePlacesResponse(await res.json());
        const found = data.places;

        if (found.length === 0) {
          setPlacesState("fallback");
          return;
        }
        writePrefetchedPlaces(food.id, found);
        setPlaces(found);
        setPlacesState("ready");
      } catch {
        if (
          !cancelled &&
          !placesManualRef.current &&
          !abort.signal.aborted
        ) {
          setPlacesState("fallback");
        }
      }
    }

    return () => {
      cancelled = true;
      abort.abort();
      window.clearTimeout(fallbackTimer);
    };
  }, [food, intent]);

  const onSearchLocation = useCallback(
    async (query: string) => {
      placesManualRef.current = true;

      if (!query) {
        setPlaces([]);
        setPlacesState("fallback");
        setLocationError(null);
        return;
      }

      setLocationError(null);
      setPlacesState("loading");

      try {
        const res = await fetch(
          `/api/places?foodId=${encodeURIComponent(food.id)}&q=${encodeURIComponent(query)}`,
        );
        const data = parsePlacesResponse(await res.json());

        if (data.geoError) {
          setPlaces([]);
          setPlacesState("fallback");
          setLocationError("Could not find that place. Try another city or ZIP.");
          return;
        }

        const found = data.places;
        if (
          typeof data.lat === "number" &&
          typeof data.lng === "number"
        ) {
          writeCachedGeo(data.lat, data.lng);
        }

        if (found.length === 0) {
          setPlaces([]);
          setPlacesState("fallback");
          setLocationError("No spots found there. Try a nearby city.");
          return;
        }

        writePrefetchedPlaces(food.id, found);
        setPlaces(found);
        setPlacesState("ready");
      } catch {
        setPlaces([]);
        setPlacesState("fallback");
        setLocationError("Search failed. Check your connection and try again.");
      }
    },
    [food.id],
  );

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
      const next = nextAfterReject(
        answers,
        readDna(),
        session,
        food.id,
        readDietary(),
        readFavorites().foodIds,
        readExploreBalance(),
      );
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

  const beginFeedback = useCallback(
    (rating: Rating) => {
      if (busyRef.current || lastRating !== null || pendingRating !== null) {
        return;
      }
      setPendingRating(rating);
      setFeedbackTags([]);
      setWhyPanelOpen(false);
    },
    [lastRating, pendingRating],
  );

  const commitFeedback = useCallback(
    (tags: string[]) => {
      const rating = pendingRating;
      if (!rating) return;

      const detail =
        rating === "nailed"
          ? { hit: parseHitTags(tags) }
          : { miss: parseMissTags(tags) };

      const { dna: next, deltas: changes } = applyRating(
        readDna(),
        food,
        rating,
        detail,
      );
      void persistDna(next);

      const dims = foodDimensions(food);
      const xpResult = awardRatingXp(readXp(), dims, rating);
      writeXp(xpResult.state);
      recordMeaningfulAction();

      if (rating === "nailed" || rating === "kinda") {
        confirmPassportExperience(readPassport(), {
          foodId: food.id,
          foodName: food.name,
          matchScore: rating === "nailed" ? 1 : 0.6,
        });
      }
      void persistGamification();

      const current = readSession();
      track(ANALYTICS_EVENTS.feedback, {
        food_id: food.id,
        rating,
        tag_count: tags.length,
        successful: rating === "nailed",
        intent: current?.answers.intent,
      });
      track(ANALYTICS_EVENTS.dnaUpdate, {
        reason: "feedback",
        rating,
        intent: current?.answers.intent,
      });
      void recordRecommendationRating(
        food.id,
        rating,
        current
          ? {
              intent: current.answers.intent,
              answers: current.answers,
              place: places[0] ?? null,
            }
          : undefined,
      );
      setLastRating(rating);
      setPendingRating(null);
      setFeedbackTags([]);

      if (rating === "nailed" || rating === "kinda") {
        const meaningful = changes.filter((d) => d.direction !== "flat");
        writeDoneMeta({
          foodId: food.id,
          levelLabel: overallTasteLabel(xpResult.state),
          deltasLine:
            meaningful.length > 0
              ? formatDnaChangeLine(meaningful)
              : undefined,
        });
        setLeaving(true);
        router.push(`/result/${food.id}/done`);
        return;
      }

      if (rating === "nope") {
        if (!current) {
          router.push("/taste");
          return;
        }
        busyRef.current = true;
        animateExitThen("left", () => {
          goToNext(current, current.answers);
        });
      }
    },
    [animateExitThen, food, goToNext, pendingRating, places, router],
  );

  const rated = lastRating !== null || pendingRating !== null || leaving;
  const showFeedback =
    !leaving && pendingRating !== null && lastRating === null;

  const toggleFeedbackTag = useCallback((id: string) => {
    setFeedbackTags((prev) => {
      if (id === "everything") {
        return prev.includes("everything") ? [] : ["everything"];
      }
      const withoutEverything = prev.filter((t) => t !== "everything");
      return withoutEverything.includes(id)
        ? withoutEverything.filter((t) => t !== id)
        : [...withoutEverything, id];
    });
  }, []);

  const onLike = useCallback(() => {
    beginFeedback("nailed");
  }, [beginFeedback]);

  const onTryAgain = useCallback(() => {
    if (busyRef.current || pendingRating) return;
    const current = readSession();
    if (!current) {
      router.push("/taste");
      return;
    }
    busyRef.current = true;
    animateExitThen("left", () => {
      goToNext(current, current.answers);
    });
  }, [animateExitThen, goToNext, pendingRating, router]);

  const cardClass = [
    "result-card",
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
          That&apos;s all the good matches. Start over or check your Taste
          DNA.
        </p>
        <div className="result-actions">
          <Link className="cta" href="/taste">
            <ArrowRight size={20} strokeWidth={1.5} aria-hidden />
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
      <div className="result-grid">
        <div className="result-main-col">
          <p className="eyebrow result-eyebrow">
            {leaving
              ? "Your pick"
              : showFeedback
                ? pendingRating === "nailed"
                  ? "What hit?"
                  : "What was off?"
                : (adjustNote ??
                  (rejectNote
                    ? "Different one."
                    : "Your mood tastes like"))}
          </p>

      <div className={cardClass}>
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

            <div className="result-card-body">
              <h1 className="result-title">{food.name}</h1>

              {intent === "recipe" && food.recipe ? (
                <p className="result-venue">
                  <ChefHat size={18} strokeWidth={1.5} aria-hidden />
                  Home recipe
                </p>
              ) : intent === "restaurant" ? (
                <p className="result-venue">
                  <MapPin size={18} strokeWidth={1.5} aria-hidden />
                  Nearby spot
                </p>
              ) : intent === "snack" ? (
                <p className="result-venue">
                  Quick bite
                </p>
              ) : null}

              <p
                className={
                  swappedWhy ? "result-desc is-polished" : "result-desc"
                }
                key={swappedWhy ? "polished" : "base"}
              >
                {explanation}
              </p>

              {attrs.length > 0 ? (
                <ul className="result-attrs" aria-label="Matched attributes">
                  {attrs.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              ) : null}

              {intent === "recipe" && food.recipe ? (
                <div className="result-meta">
                  <div>
                    <span className="result-meta-label">Prep time</span>
                    <span className="result-meta-value">
                      {food.recipe.timeMinutes} min
                    </span>
                  </div>
                  <div className="result-meta-end">
                    <span className="result-meta-label">Servings</span>
                    <span className="result-meta-value">
                      {food.recipe.servings}
                    </span>
                  </div>
                </div>
              ) : intent === "snack" ? (
                <div className="result-meta">
                  <div>
                    <span className="result-meta-label">Time</span>
                    <span className="result-meta-value">Ready now</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {riff ? (
            <p className={lateRiff ? "result-riff is-polished" : "result-riff"}>
              {riff}
            </p>
          ) : null}

          {!sessionReady ? null : hasSession ? (
            <>
              {leaving ? (
                <div className="result-leaving" role="status" aria-live="polite">
                  <p className="result-done-copy">One moment…</p>
                </div>
              ) : showFeedback && pendingRating ? (
                <div className="feedback-panel" role="group" aria-label="Feedback">
                  <p className="feedback-lead">
                    {pendingRating === "nailed"
                      ? "What hit? Tap any that fit."
                      : "What was off? Tap any that fit."}
                  </p>
                  <ul className="feedback-chips">
                    {(pendingRating === "nailed" ? HIT_TAGS : MISS_TAGS).map(
                      (tag) => {
                        const selected = feedbackTags.includes(tag.id);
                        return (
                          <li key={tag.id}>
                            <button
                              type="button"
                              className={
                                selected
                                  ? "feedback-chip is-selected"
                                  : "feedback-chip"
                              }
                              aria-pressed={selected}
                              onClick={() => toggleFeedbackTag(tag.id)}
                            >
                              {tag.label}
                            </button>
                          </li>
                        );
                      },
                    )}
                  </ul>
                  <div className="feedback-actions">
                    <button
                      type="button"
                      className="cta"
                      onClick={() => commitFeedback(feedbackTags)}
                    >
                      <Check size={18} strokeWidth={1.5} aria-hidden />
                      Save
                    </button>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => commitFeedback([])}
                    >
                      Skip
                    </button>
                  </div>
                </div>
              ) : (
            <div className="reaction-dock">
              <div className="reaction-bar" role="group" aria-label="Reactions">
                <button
                  type="button"
                  className="reaction-btn reaction-btn-nope"
                  onClick={onTryAgain}
                  disabled={adjusting || rated}
                  aria-label="Not for me"
                >
                  <span className="reaction-icon" aria-hidden>
                    <X size={28} strokeWidth={2} />
                  </span>
                </button>
                <button
                  type="button"
                  className="reaction-btn reaction-btn-like"
                  onClick={onLike}
                  disabled={rated || adjusting}
                  aria-label={
                    intent === "restaurant"
                      ? "Let's go"
                      : intent === "recipe"
                        ? "Make this"
                        : intent === "snack"
                          ? "That's the one"
                          : "I like it"
                  }
                >
                  <span className="reaction-icon" aria-hidden>
                    <Heart size={26} strokeWidth={2} fill="currentColor" />
                  </span>
                  <span className="reaction-label">
                    {intent === "restaurant"
                      ? "Let's go"
                      : intent === "recipe"
                        ? "Make this"
                        : intent === "snack"
                          ? "That's the one"
                          : "I like it"}
                  </span>
                </button>
              </div>

              <div className="reaction-quiet">
                <button
                  type="button"
                  className="text-link"
                  onClick={() => beginFeedback("kinda")}
                  disabled={rated || adjusting}
                >
                  Kinda
                </button>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => beginFeedback("nope")}
                  disabled={rated || adjusting}
                >
                  Not for me
                </button>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => {
                    setWhyOpen((v) => !v);
                    setWhyPanelOpen(false);
                  }}
                  aria-expanded={whyOpen}
                  disabled={adjusting || rated}
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
                  disabled={adjusting || rated}
                >
                  Off?
                </button>
              </div>
            </div>
              )}

              {!leaving && !showFeedback && whyOpen ? (
                <p className="result-why" id="result-why">
                  {explanation}
                </p>
              ) : null}

              {!leaving && !showFeedback && whyPanelOpen ? (
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
                      <RotateCcw size={18} strokeWidth={1.5} aria-hidden />
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
            </>
          ) : (
            <div className="result-actions">
              <p className="result-desc">
                Take the quiz to find something that fits how you feel.
              </p>
              <Link className="cta" href="/">
                <Utensils size={20} strokeWidth={1.5} aria-hidden />
                Hungry?
              </Link>
            </div>
          )}
        </div>

        <div className="result-side-col">
          {intent === "recipe" ? (
            food.recipe ? (
              <p className="result-act-link">
                <Link href={`/result/${food.id}/recipe`}>
                  <ChefHat size={16} strokeWidth={1.5} aria-hidden />
                  View recipe
                </Link>
              </p>
            ) : (
              <div className="recipe" id="recipe">
                <p className="recipe-label">
                  <ChefHat size={16} strokeWidth={1.5} aria-hidden />
                  Recipe
                </p>
                <p className="recipe-missing">
                  No recipe for this one. Try again for another pick.
                </p>
                {!leaving ? (
                  <button
                    type="button"
                    className="cta-secondary"
                    onClick={onTryAgain}
                    disabled={adjusting}
                  >
                    <RotateCcw size={18} strokeWidth={1.5} aria-hidden />
                    Try again
                  </button>
                ) : null}
              </div>
            )
          ) : intent === "restaurant" ? (
            <NearbySection
              food={food}
              places={places}
              state={placesState}
              onSearchLocation={(q) => void onSearchLocation(q)}
              locationError={locationError}
            />
          ) : null}

          {leaving ? null : <ProfileNudge context="result" />}
        </div>
      </div>
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
  const rec = rank(
    session.answers,
    dna,
    session,
    readDietary(),
    readFavorites().foodIds,
    readExploreBalance(),
  );
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

