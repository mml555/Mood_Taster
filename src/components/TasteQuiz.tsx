"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { loadDnaForUser, persistDna } from "@/lib/dna-sync";
import { applyQuizPrefs, readDna } from "@/lib/dna";
import { readFavorites } from "@/lib/favorites";
import { loadFavoritesForUser } from "@/lib/favorites-sync";
import { readDietary } from "@/lib/dietary";
import { loadDietaryForUser } from "@/lib/dietary-sync";
import { NoDietaryMatchError, rank } from "@/lib/engine";
import { QUIZ_OPTION_ICONS, QUIZ_STEP_ICONS } from "@/lib/mood-icons";
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
  INTENTS,
  TEMPERATURES,
  TEXTURES,
} from "@/lib/taste-types";

type StepDef = {
  key: keyof Answers;
  question: string;
  reaction?: string;
  options: { value: string; label: string }[];
};

const INTENT_STEP: StepDef = {
  key: "intent",
  question: "How do you want to eat?",
  options: [
    { value: "restaurant", label: "Go out" },
    { value: "recipe", label: "Make something" },
    { value: "snack", label: "Grab a snack" },
    { value: "clue", label: "I have no clue" },
  ],
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

  return Boolean(
    answers.intent &&
      answers.flavor &&
      answers.texture &&
      answers.heaviness &&
      answers.adventure &&
      answers.temperature &&
      effortOk &&
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
      const session = emptySession(finalAnswers);
      const dna = readDna();
      const dietary = readDietary();

      if (finalAnswers.intent === "restaurant") {
        warmGeolocation();
      }

      const go = (foodId: string) => {
        writeSession({
          ...session,
          servedIds: [foodId],
        });
        if (finalAnswers.intent === "restaurant") {
          prefetchPlacesForFood(foodId);
        }
        router.push(`/result/${foodId}`);
        void loadDnaForUser();
        void loadHistoryForUser();
      };

      void (async () => {
        const favs = await loadFavoritesForUser();
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
              rejectedIds: session.rejectedIds,
              servedIds: session.servedIds,
            }),
          });
          if (res.status === 422) {
            setDietError(true);
            return;
          }
          if (res.ok) {
            const data = (await res.json()) as { foodId?: string };
            if (typeof data.foodId === "string" && data.foodId) {
              go(data.foodId);
              return;
            }
          }
        } catch {
          /* local fallback below */
        }
        try {
          const rec = rank(finalAnswers, dna, session, dietary, favoriteIds);
          go(rec.primary.food.id);
        } catch (err) {
          if (err instanceof NoDietaryMatchError) {
            setDietError(true);
            return;
          }
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
        };
        setAnswers(seeded);
        writeDraft(seeded);
        if (intent === "restaurant") warmGeolocation();
        goStep(1, intent);
        return;
      }

      if (current.key !== "temperature" && !next.temperature) {
        next.temperature = seededIntent === "clue" ? undefined : "any";
      }
      if (current.key !== "cookEffort" && !next.cookEffort) {
        next.cookEffort = seededIntent === "recipe" ? undefined : "any";
      }

      setAnswers(next);
      writeDraft(next);

      if (step < totalSteps) {
        goStep(step + 1);
        return;
      }

      const complete: PartialAnswers = {
        ...next,
        temperature: next.temperature ?? "any",
        cookEffort: next.cookEffort ?? "any",
      };
      if (isComplete(complete)) {
        finish(complete);
      }
    },
    [answers, current, finish, goStep, seededIntent, step, totalSteps],
  );

  if (!current) return null;

  const selected = hydrated ? answers[current.key] : undefined;
  const StepIcon = QUIZ_STEP_ICONS[current.key];
  const tileClass =
    current.options.length <= 2
      ? "quiz-options quiz-options-stack"
      : "quiz-options quiz-options-grid";

  const showBack = step > 1 || Boolean(seededIntent);
  const onBack = () => {
    if (step > 1) {
      goStep(step - 1);
      return;
    }
    if (seededIntent) {
      router.push("/taste");
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

  return (
    <section className="quiz" aria-labelledby="quiz-question">
      <div className="quiz-progress" aria-live="polite">
        <span className="visually-hidden">
          Step {stepLabel} of {totalLabel}
        </span>
        <ol className="quiz-dots" aria-hidden>
          {steps.map((s, i) => {
            const n = i + 1;
            const state =
              n < step ? "is-done" : n === step ? "is-current" : "";
            return (
              <li
                key={`${s.key}-${i}`}
                className={state ? `quiz-dot ${state}` : "quiz-dot"}
              />
            );
          })}
        </ol>
      </div>

      <div className="quiz-question-block">
        <span className="quiz-question-icon" aria-hidden>
          <StepIcon size={20} strokeWidth={1.5} />
        </span>
        <h1 id="quiz-question" className="quiz-question">
          {current.question}
        </h1>
        {current.reaction ? (
          <p className="quiz-reaction">{current.reaction}</p>
        ) : null}
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
                    <Icon size={22} strokeWidth={1.5} />
                  </span>
                ) : null}
                <span className="quiz-option-label">{opt.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {showBack ? (
        step === 1 && seededIntent ? (
          <Link className="quiz-back" href={fromHome ? "/" : "/taste"}>
            <ArrowLeft size={20} strokeWidth={1.5} aria-hidden />
            Back
          </Link>
        ) : (
          <button type="button" className="quiz-back" onClick={onBack}>
            <ArrowLeft size={20} strokeWidth={1.5} aria-hidden />
            Back
          </button>
        )
      ) : null}
    </section>
  );
}
