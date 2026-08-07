"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import { persistDna } from "@/lib/dna-sync";
import { applyQuizPrefs, readDna } from "@/lib/dna";
import {
  fillAnswerDefaults,
  sensoryAnswerCount,
  shouldFinishQuizEarly,
} from "@/lib/adaptive-quiz";
import { ExploreBalanceControl } from "@/components/ExploreBalanceControl";
import { QuizLoading } from "@/components/QuizLoading";
import { readExploreBalance } from "@/lib/explore-balance";
import { readFavorites } from "@/lib/favorites";
import { loadFavoritesForUser } from "@/lib/favorites-sync";
import { loadHistoryForUser } from "@/lib/history-sync";
import { loadDietaryForUser } from "@/lib/dietary-sync";
import { NoDietaryMatchError, rank } from "@/lib/engine";
import { QUIZ_OPTION_ICONS } from "@/lib/mood-icons";
import {
  prefetchPlacesForFood,
  warmGeolocation,
} from "@/lib/places-prefetch";
import { emptySession, writeSession } from "@/lib/session";
import type { Answers, Intent } from "@/lib/taste-types";
import {
  ADVENTURE,
  COOK_EFFORTS,
  FLAVORS,
  HEAVINESS,
  HUNGERS,
  INTENTS,
  TEMPERATURES,
  TEXTURES,
  VIBES,
} from "@/lib/taste-types";

type StepDef = {
  key: keyof Answers;
  question: string;
  reaction?: string;
  options: { value: string; label: string; description?: string }[];
};

/** Cancels a deferred abandon when Strict Mode remounts the quiz. */
let pendingAbandonTimer: number | null = null;

const INTENT_STEP: StepDef = {
  key: "intent",
  question: "What kind of hungry are you?",
  options: [
    {
      value: "restaurant",
      label: "Go out",
      description: "Find something worth leaving the house for.",
    },
    {
      value: "recipe",
      label: "Make something",
      description: "Find something you can make.",
    },
    {
      value: "snack",
      label: "Grab a snack",
      description: "Find a quick bite.",
    },
  ],
};

const STEP_CATEGORY: Partial<Record<keyof Answers, string>> = {
  intent: "Path",
  flavor: "Flavor",
  texture: "Texture",
  heaviness: "Weight",
  adventure: "Adventure",
  cookEffort: "Effort",
  hunger: "Hunger",
  vibe: "Vibe",
  temperature: "Temp",
};

const CRAVING_STEPS: StepDef[] = [
  {
    key: "flavor",
    question: "What flavor?",
    options: [
      { value: "savory", label: "Savory" },
      { value: "spicy", label: "Spicy" },
      { value: "sweet", label: "Sweet" },
      { value: "fresh", label: "Fresh" },
    ],
  },
  {
    key: "texture",
    question: "What texture?",
    options: [
      { value: "crunchy", label: "Crunchy" },
      { value: "creamy", label: "Creamy" },
      { value: "juicy", label: "Juicy" },
      { value: "soft", label: "Soft" },
    ],
  },
  {
    key: "heaviness",
    question: "How heavy?",
    options: [
      { value: "light", label: "Light" },
      { value: "medium", label: "Medium" },
      { value: "filling", label: "Filling" },
      { value: "any", label: "Any" },
    ],
  },
  {
    key: "adventure",
    question: "How wild?",
    options: [
      { value: "safe", label: "Safe" },
      { value: "curious", label: "A little new" },
      { value: "surprise", label: "Surprise me" },
    ],
  },
];

const COOK_EFFORT_STEP: StepDef = {
  key: "cookEffort",
  question: "How much effort?",
  reaction: "Keep it real.",
  options: [
    { value: "barely", label: "Barely any" },
    { value: "fifteen", label: "About 15 min" },
    { value: "cook", label: "I can cook" },
  ],
};

/** Go Out depth: appetite + table vibe before sensory axes. Both skippable. */
const GO_OUT_STEPS: StepDef[] = [
  {
    key: "hunger",
    question: "How hungry?",
    reaction: "Sets the size.",
    options: [
      { value: "peckish", label: "Peckish" },
      { value: "hungry", label: "Hungry" },
      { value: "starving", label: "Starving" },
      { value: "any", label: "Any" },
    ],
  },
  {
    key: "vibe",
    question: "What vibe?",
    reaction: "Sets the mood.",
    options: [
      { value: "cozy", label: "Cozy" },
      { value: "bright", label: "Bright" },
      { value: "bold", label: "Bold" },
      { value: "any", label: "Any" },
    ],
  },
];

/** Signature no-clue mode: broad pairs that map into Answers. */
const CLUE_STEPS: StepDef[] = [
  {
    key: "temperature",
    question: "Hot or cold?",
    reaction: "Start broad.",
    options: [
      { value: "hot", label: "Hot" },
      { value: "cold", label: "Cold" },
    ],
  },
  {
    key: "heaviness",
    question: "Light or filling?",
    reaction: "That changes things.",
    options: [
      { value: "light", label: "Light" },
      { value: "filling", label: "Filling" },
    ],
  },
  {
    key: "texture",
    question: "Crunchy or soft?",
    reaction: "We're close.",
    options: [
      { value: "crunchy", label: "Crunchy" },
      { value: "soft", label: "Soft" },
    ],
  },
  {
    key: "flavor",
    question: "Sweet or savory?",
    reaction: "Almost there.",
    options: [
      { value: "sweet", label: "Sweet" },
      { value: "savory", label: "Savory" },
    ],
  },
  {
    key: "adventure",
    question: "Safe or adventurous?",
    reaction: "Got it.",
    options: [
      { value: "safe", label: "Safe" },
      { value: "surprise", label: "Adventurous" },
    ],
  },
];

type PartialAnswers = Partial<Answers>;

const DRAFT_KEY = "mood-taster-quiz-draft";

function readDraft(): PartialAnswers {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PartialAnswers;
  } catch {
    return {};
  }
}

function writeDraft(answers: PartialAnswers) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(answers));
}

function clearDraft() {
  sessionStorage.removeItem(DRAFT_KEY);
}

function parseIntent(raw: string | null): Intent | null {
  if (!raw) return null;
  return (INTENTS as readonly string[]).includes(raw) ? (raw as Intent) : null;
}

function parseStep(raw: string | null, total: number): number {
  const n = Number(raw ?? "1");
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(total, Math.floor(n));
}

function isComplete(answers: PartialAnswers): answers is Answers {
  const effortOk =
    answers.cookEffort === "any" ||
    (answers.cookEffort != null &&
      COOK_EFFORTS.includes(
        answers.cookEffort as (typeof COOK_EFFORTS)[number],
      ));
  const hungerOk =
    answers.hunger === "any" ||
    (answers.hunger != null &&
      HUNGERS.includes(answers.hunger as (typeof HUNGERS)[number]));
  const vibeOk =
    answers.vibe === "any" ||
    (answers.vibe != null &&
      VIBES.includes(answers.vibe as (typeof VIBES)[number]));

  return Boolean(
    answers.intent &&
      answers.flavor &&
      answers.texture &&
      answers.heaviness &&
      answers.adventure &&
      answers.temperature &&
      effortOk &&
      hungerOk &&
      vibeOk &&
      INTENTS.includes(answers.intent) &&
      FLAVORS.includes(answers.flavor) &&
      TEXTURES.includes(answers.texture) &&
      (HEAVINESS.includes(answers.heaviness as (typeof HEAVINESS)[number]) ||
        answers.heaviness === "any") &&
      ADVENTURE.includes(answers.adventure) &&
      TEMPERATURES.includes(answers.temperature),
  );
}

function tasteHref(
  intent: Intent | null,
  step: number,
  fromHome = false,
): string {
  const params = new URLSearchParams();
  if (intent) params.set("intent", intent);
  if (fromHome && intent) params.set("from", "home");
  params.set("step", String(step));
  return `/taste?${params.toString()}`;
}

function stepsForIntent(intent: Intent | null): StepDef[] {
  if (!intent) return [INTENT_STEP, ...CRAVING_STEPS];
  if (intent === "clue") return CLUE_STEPS;
  if (intent === "recipe") return [COOK_EFFORT_STEP, ...CRAVING_STEPS];
  if (intent === "restaurant") return [...GO_OUT_STEPS, ...CRAVING_STEPS];
  return CRAVING_STEPS;
}

export function TasteQuiz() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const seededIntent = parseIntent(searchParams.get("intent"));
  const fromHome = searchParams.get("from") === "home";
  const steps = useMemo(() => stepsForIntent(seededIntent), [seededIntent]);
  const totalSteps = steps.length;
  const step = parseStep(searchParams.get("step"), totalSteps);
  const [answers, setAnswers] = useState<PartialAnswers>({});
  const [hydrated, setHydrated] = useState(false);
  const [dietError, setDietError] = useState(false);
  const [matching, setMatching] = useState(false);
  const finishedRef = useRef(false);
  const abandonMetaRef = useRef({
    step,
    intent: seededIntent as Intent | null,
    question: null as string | null,
  });

  useEffect(() => {
    queueMicrotask(() => {
      const draft = readDraft();
      if (seededIntent) {
        const next: PartialAnswers = {
          ...draft,
          intent: seededIntent,
          // Standard quiz ignores temperature; clue sets it via steps.
          temperature:
            seededIntent === "clue"
              ? draft.temperature
              : (draft.temperature ?? "any"),
          cookEffort:
            seededIntent === "recipe"
              ? draft.cookEffort
              : (draft.cookEffort ?? "any"),
          hunger:
            seededIntent === "restaurant"
              ? draft.hunger
              : (draft.hunger ?? "any"),
          vibe:
            seededIntent === "restaurant"
              ? draft.vibe
              : (draft.vibe ?? "any"),
        };
        setAnswers(next);
        writeDraft(next);
        if (seededIntent === "restaurant") warmGeolocation();
      } else {
        setAnswers(draft);
      }
      setHydrated(true);
    });
  }, [seededIntent]);

  const current = steps[step - 1];
  const stepLabel = String(step).padStart(2, "0");
  const totalLabel = String(totalSteps).padStart(2, "0");

  // The abandon beacon below is mounted once and reads this at unmount, so it
  // needs the latest render's values without re-registering its listener.
  // Written in its own effect, declared first so the values are current before
  // any later effect or cleanup reads them.
  useEffect(() => {
    abandonMetaRef.current = {
      step,
      intent: (answers.intent as Intent | undefined) ?? seededIntent,
      question: current?.key ?? null,
    };
  });

  useEffect(() => {
    if (pendingAbandonTimer != null) {
      window.clearTimeout(pendingAbandonTimer);
      pendingAbandonTimer = null;
    }

    const flushAbandon = () => {
      if (finishedRef.current) return;
      const meta = abandonMetaRef.current;
      track(ANALYTICS_EVENTS.abandon, {
        step: meta.step,
        intent: meta.intent ?? undefined,
        question: meta.question ?? undefined,
      });
    };

    window.addEventListener("pagehide", flushAbandon);
    return () => {
      window.removeEventListener("pagehide", flushAbandon);
      // Delay so React Strict Mode remount can cancel a false abandon.
      pendingAbandonTimer = window.setTimeout(() => {
        pendingAbandonTimer = null;
        flushAbandon();
      }, 80);
    };
  }, []);

  const goStep = useCallback(
    (next: number, intent: Intent | null = seededIntent) => {
      router.push(tasteHref(intent, next, fromHome && Boolean(intent)), {
        scroll: false,
      });
    },
    [router, seededIntent, fromHome],
  );

  const finish = useCallback(
    (finalAnswers: Answers) => {
      clearDraft();
      setDietError(false);
      setMatching(true);
      const matchStartedAt = Date.now();
      const session = emptySession(finalAnswers);
      const { dna } = applyQuizPrefs(readDna(), finalAnswers);
      void persistDna(dna);
      track(ANALYTICS_EVENTS.dnaUpdate, {
        reason: "quiz",
        intent: finalAnswers.intent,
      });

      if (finalAnswers.intent === "restaurant") {
        warmGeolocation();
      }

      const go = async (foodId: string) => {
        // Keep the interstitial on screen long enough to read one beat.
        const wait = Math.max(0, 900 - (Date.now() - matchStartedAt));
        if (wait > 0) {
          await new Promise((resolve) => window.setTimeout(resolve, wait));
        }
        finishedRef.current = true;
        writeSession({
          ...session,
          servedIds: [foodId],
        });
        if (finalAnswers.intent === "restaurant") {
          prefetchPlacesForFood(foodId);
        }
        router.push(`/result/${foodId}`);
      };

      void (async () => {
        // Pull cloud history before the result page records a new pick.
        // Doing it after navigate can overwrite the just-written local entry.
        const [favs, dietary] = await Promise.all([
          loadFavoritesForUser(),
          loadDietaryForUser(),
          loadHistoryForUser(),
        ]);
        const favoriteIds = favs.foodIds.length
          ? favs.foodIds
          : readFavorites().foodIds;

        try {
          const res = await fetch("/api/match", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              answers: finalAnswers,
              dna,
              dietary,
              favoriteIds,
              exploreBalance: readExploreBalance(),
              rejectedIds: session.rejectedIds,
              servedIds: session.servedIds,
            }),
          });
          if (res.status === 422) {
            setMatching(false);
            setDietError(true);
            return;
          }
          if (res.ok) {
            const data = (await res.json()) as { foodId?: string };
            if (typeof data.foodId === "string" && data.foodId) {
              await go(data.foodId);
              return;
            }
          }
        } catch {
          /* local fallback below */
        }
        try {
          const rec = rank(
            finalAnswers,
            dna,
            session,
            dietary,
            favoriteIds,
            readExploreBalance(),
          );
          await go(rec.primary.food.id);
        } catch (err) {
          if (err instanceof NoDietaryMatchError) {
            setMatching(false);
            setDietError(true);
            return;
          }
          setMatching(false);
          throw err;
        }
      })();
    },
    [router],
  );

  const onChoose = useCallback(
    (value: string) => {
      if (!current) return;
      const next: PartialAnswers = { ...answers, [current.key]: value };

      if (current.key === "intent") {
        const intent = value as Intent;
        const seeded: PartialAnswers = {
          ...next,
          cookEffort: intent === "recipe" ? undefined : "any",
          temperature: intent === "clue" ? undefined : "any",
          hunger: intent === "restaurant" ? undefined : "any",
          vibe: intent === "restaurant" ? undefined : "any",
        };
        setAnswers(seeded);
        writeDraft(seeded);
        track(ANALYTICS_EVENTS.intent, { intent, source: "quiz" });
        if (intent === "restaurant") warmGeolocation();
        goStep(1, intent);
        return;
      }

      track(ANALYTICS_EVENTS.question, {
        question: current.key,
        value,
        step,
        intent:
          (next.intent as Intent | undefined) ?? seededIntent ?? undefined,
      });

      if (current.key !== "temperature" && !next.temperature) {
        next.temperature = seededIntent === "clue" ? undefined : "any";
      }
      if (current.key !== "cookEffort" && !next.cookEffort) {
        next.cookEffort = seededIntent === "recipe" ? undefined : "any";
      }
      if (current.key !== "hunger" && !next.hunger) {
        next.hunger = seededIntent === "restaurant" ? undefined : "any";
      }
      if (current.key !== "vibe" && !next.vibe) {
        next.vibe = seededIntent === "restaurant" ? undefined : "any";
      }

      setAnswers(next);
      writeDraft(next);

      const intent =
        (next.intent as Intent | undefined) ?? seededIntent ?? null;
      const sensoryCount = sensoryAnswerCount(next);
      if (
        intent &&
        shouldFinishQuizEarly(next, sensoryCount, intent)
      ) {
        const complete = fillAnswerDefaults(next, intent);
        if (complete && isComplete(complete)) {
          finish(complete);
          return;
        }
      }

      if (step < totalSteps) {
        goStep(step + 1);
        return;
      }

      const complete: PartialAnswers = {
        ...next,
        temperature: next.temperature ?? "any",
        cookEffort: next.cookEffort ?? "any",
        hunger: next.hunger ?? "any",
        vibe: next.vibe ?? "any",
      };
      if (isComplete(complete)) {
        finish(complete);
      }
    },
    [answers, current, finish, goStep, seededIntent, step, totalSteps],
  );

  if (!current) return null;

  const selected = hydrated ? answers[current.key] : undefined;
  // Reference layout: full-width list cards. Stack always reads clearer than a
  // 2-up tile grid for tap targets and short descriptions.
  const tileClass = "quiz-options quiz-options-stack";

  const showBack = step > 1 || Boolean(seededIntent) || fromHome;
  const onBack = () => {
    if (step > 1) {
      goStep(step - 1);
      return;
    }
    if (seededIntent) {
      router.push(fromHome ? "/" : "/taste");
      return;
    }
    if (fromHome) {
      router.push("/");
    }
  };

  if (dietError) {
    return (
      <section className="quiz" aria-labelledby="quiz-question">
        <h1 id="quiz-question" className="quiz-question">
          Nothing matches
        </h1>
        <p className="quiz-reaction">
          Your diet settings left no foods in this catalog. Loosen a limit, then
          try again.
        </p>
        <div className="result-actions">
          <Link className="cta" href="/dna">
            Edit diet
          </Link>
          <button
            type="button"
            className="cta-secondary"
            onClick={() => setDietError(false)}
          >
            Back to quiz
          </button>
        </div>
      </section>
    );
  }

  if (matching) {
    return <QuizLoading />;
  }

  return (
    <section className="quiz" aria-labelledby="quiz-question">
      <div className="quiz-top">
        {showBack ? (
          step === 1 && (seededIntent || fromHome) ? (
            <Link
              className="quiz-back"
              href={fromHome ? "/" : "/taste"}
              aria-label="Back"
            >
              <ArrowLeft size={20} strokeWidth={1.5} aria-hidden />
              <span className="quiz-back-label">Back</span>
            </Link>
          ) : (
            <button
              type="button"
              className="quiz-back"
              onClick={onBack}
              aria-label="Back"
            >
              <ArrowLeft size={20} strokeWidth={1.5} aria-hidden />
              <span className="quiz-back-label">Back</span>
            </button>
          )
        ) : (
          <span className="quiz-top-spacer" aria-hidden />
        )}

        <div className="quiz-progress" aria-live="polite">
          <span className="quiz-progress-count">
            {stepLabel} of {totalLabel}
          </span>
          <ol className="quiz-segments" aria-hidden>
            {steps.map((s, i) => {
              const n = i + 1;
              const state =
                n < step ? "is-done" : n === step ? "is-current" : "";
              return (
                <li
                  key={`${s.key}-${i}`}
                  className={state ? `quiz-segment ${state}` : "quiz-segment"}
                />
              );
            })}
          </ol>
        </div>

        <span className="quiz-top-spacer" aria-hidden />
      </div>

      <div className="quiz-question-block">
        <div className="quiz-question-copy">
          {STEP_CATEGORY[current.key] ? (
            <p className="quiz-category">{STEP_CATEGORY[current.key]}</p>
          ) : null}
          <h1 id="quiz-question" className="quiz-question">
            {current.question}
          </h1>
          {current.reaction ? (
            <p className="quiz-reaction">{current.reaction}</p>
          ) : null}
        </div>
      </div>

      <ul className={tileClass} role="list">
        {current.options.map((opt) => {
          const isSelected = selected === opt.value;
          const Icon = QUIZ_OPTION_ICONS[opt.value];
          return (
            <li key={opt.value}>
              <button
                type="button"
                className={
                  isSelected ? "quiz-option is-selected" : "quiz-option"
                }
                onClick={() => onChoose(opt.value)}
              >
                {Icon ? (
                  <span className="quiz-option-icon" aria-hidden>
                    <Icon size={24} strokeWidth={1.5} />
                  </span>
                ) : null}
                <span className="quiz-option-text">
                  <span className="quiz-option-label">{opt.label}</span>
                  {opt.description ? (
                    <span className="quiz-option-desc">{opt.description}</span>
                  ) : null}
                </span>
                {isSelected ? (
                  <span className="quiz-option-check" aria-hidden>
                    ✓
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>

      {step === 1 && current.key !== "intent" ? (
        <ExploreBalanceControl compact />
      ) : null}
    </section>
  );
}
