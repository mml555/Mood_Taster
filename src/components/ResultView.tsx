"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ChefHat, Heart, MapPin, Search, Sparkles } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
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
  type DnaDelta,
} from "@/lib/dna";
import { persistDna } from "@/lib/dna-sync";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import { ProfileNudge } from "@/components/ProfileNudge";
import type { PlacesState } from "@/components/result/NearbySection";
import { readDietary } from "@/lib/dietary";
import { nextAfterReject, rank } from "@/lib/engine";
import { readExploreBalance } from "@/lib/explore-balance";
import {
  isFavorite,
  readFavorites,
  toggleFavorite,
} from "@/lib/favorites";
import { persistFavorites } from "@/lib/favorites-sync";
import { persistGamification } from "@/lib/gamification-sync";
import {
  recordRecommendationRating,
  recordRecommendationShown,
} from "@/lib/history-sync";
import { confirmPassportExperience, readPassport } from "@/lib/passport";
import { recordMeaningfulAction } from "@/lib/streak";
import { awardRatingXp, overallTasteLabel, readXp, writeXp } from "@/lib/xp";
import { capitalize } from "@/lib/explain";
import { parsePlacesResponse } from "@/lib/api-schemas";
import {
  mapsSearchUrl,
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

const RecipeSection = dynamic(
  () =>
    import("@/components/result/RecipeSection").then((m) => m.RecipeSection),
  { ssr: false },
);

const NearbySection = dynamic(
  () =>
    import("@/components/result/NearbySection").then((m) => m.NearbySection),
  { ssr: false },
);

type ResultViewProps = {
  food: Food;
};

const SWIPE_THRESHOLD = 80;

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
  const [deltas, setDeltas] = useState<DnaDelta[] | null>(null);
  const [lastRating, setLastRating] = useState<Rating | null>(null);
  const [levelLabel, setLevelLabel] = useState<string | null>(null);
  const [pendingRating, setPendingRating] = useState<Rating | null>(null);
  const [feedbackTags, setFeedbackTags] = useState<string[]>([]);
  const [emptyAlts, setEmptyAlts] = useState(false);

  const [riff, setRiff] = useState<string | null>(null);
  const [cookTip, setCookTip] = useState<string | null>(null);
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [placesState, setPlacesState] = useState<PlacesState>("locating");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [intent, setIntent] = useState<Intent | null>(readIntentSync);

  const [whyPanelOpen, setWhyPanelOpen] = useState(false);
  const [rejectNoteText, setRejectNoteText] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustNote, setAdjustNote] = useState<string | null>(null);

  const [dragging, setDragging] = useState(false);
  const [exitDir, setExitDir] = useState<"left" | "right" | null>(null);
  const [swipeHint, setSwipeHint] = useState<"like" | "nope" | null>(null);
  const [saved, setSaved] = useState(false);

  // Identifies the current dish render, so a slow reply about a previous dish
  // cannot overwrite the copy for the one now on screen.
  const renderId = useRef(0);
  const pointerId = useRef<number | null>(null);
  const startX = useRef(0);
  const dragXRef = useRef(0);
  const busyRef = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);
  /** User opted into city/ZIP; ignore late browser geolocation results. */
  const placesManualRef = useRef(false);

  useEffect(() => {
    renderId.current += 1;
    const token = renderId.current;
    const abort = new AbortController();

    queueMicrotask(() => {
      setImgFailed(false);
      setWhyOpen(false);
      setDeltas(null);
      setLevelLabel(null);
      setLastRating(null);
      setEmptyAlts(false);
      setRiff(null);
      setCookTip(null);
      setWhyPanelOpen(false);
      setRejectNoteText("");
      setSwipeHint(null);
      setDragging(false);
      setExitDir(null);
      setSaved(isFavorite(food.id));
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

  const onToggleSave = useCallback(() => {
    const next = toggleFavorite(food.id);
    setSaved(isFavorite(food.id, next));
    void persistFavorites(next);
  }, [food.id]);

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
      setWhyOpen(false);
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
      setDeltas(changes.filter((d) => d.direction !== "flat"));
      setLastRating(rating);
      setPendingRating(null);
      setFeedbackTags([]);
      setLevelLabel(overallTasteLabel(xpResult.state));

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

  const rated = lastRating !== null || pendingRating !== null;
  const showDone = lastRating === "nailed" || lastRating === "kinda";
  const showFeedback = pendingRating !== null && lastRating === null;

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

  const onNope = useCallback(() => {
    beginFeedback("nope");
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
          : showFeedback
            ? pendingRating === "nailed"
              ? "What hit?"
              : "What was off?"
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
                  ? formatDnaChangeLine(deltas)
                  : "Got it. Your Taste DNA learned from this pick."}
              </p>
              {levelLabel ? (
                <p className="result-done-level">{levelLabel}</p>
              ) : null}
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
              {intent === "recipe" ? (
                <p className="result-done-save">
                  <button
                    type="button"
                    className="text-link"
                    onClick={onToggleSave}
                    aria-pressed={saved}
                  >
                    <Heart
                      size={16}
                      strokeWidth={1.5}
                      aria-hidden
                      fill={saved ? "currentColor" : "none"}
                    />
                    {saved ? "Saved" : "Save"}
                  </button>
                </p>
              ) : null}
              <p className="result-done-dna">
                <Link href="/dna">
                  <Sparkles size={16} strokeWidth={1.5} aria-hidden />
                  Your Taste DNA
                </Link>
              </p>
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
                  disabled={adjusting || rated}
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
                  onClick={() => beginFeedback("kinda")}
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

          {!showDone && !showFeedback && whyOpen ? (
            <p className="result-why" id="result-why">
              {explanation}
            </p>
          ) : null}

          {!showDone && !showFeedback && whyPanelOpen ? (
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
              <RecipeSection
                foodId={food.id}
                foodName={food.name}
                recipe={food.recipe}
                cookTip={cookTip}
              />
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
            <NearbySection
              food={food}
              places={places}
              state={placesState}
              onSearchLocation={(q) => void onSearchLocation(q)}
              locationError={locationError}
            />
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

