"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { loadDnaForUser } from "@/lib/dna-sync";
import { rank } from "@/lib/engine";
import { QUIZ_OPTION_ICONS, QUIZ_STEP_ICONS } from "@/lib/mood-icons";
import { emptySession, writeSession } from "@/lib/session";
import type { Answers, Intent } from "@/lib/taste-types";
import {
  ADVENTURE,
  FLAVORS,
  HEAVINESS,
  INTENTS,
  TEXTURES,
} from "@/lib/taste-types";

const INTENT_STEP = {
  key: "intent" as const,
  question: "How do you want to eat?",
  options: [
    { value: "restaurant", label: "Go out" },
    { value: "recipe", label: "Make something" },
    { value: "snack", label: "Grab a snack" },
    { value: "clue", label: "I have no clue" },
  ],
};

const CRAVING_STEPS = [
  {
    key: "flavor" as const,
    question: "What flavor?",
    options: [
      { value: "savory", label: "Savory" },
      { value: "spicy", label: "Spicy" },
      { value: "sweet", label: "Sweet" },
      { value: "fresh", label: "Fresh" },
    ],
  },
  {
    key: "texture" as const,
    question: "What texture?",
    options: [
      { value: "crunchy", label: "Crunchy" },
      { value: "creamy", label: "Creamy" },
      { value: "juicy", label: "Juicy" },
      { value: "soft", label: "Soft" },
    ],
  },
  {
    key: "heaviness" as const,
    question: "How heavy?",
    options: [
      { value: "light", label: "Light" },
      { value: "medium", label: "Medium" },
      { value: "filling", label: "Filling" },
      { value: "any", label: "Any" },
    ],
  },
  {
    key: "adventure" as const,
    question: "How wild?",
    options: [
      { value: "safe", label: "Safe" },
      { value: "curious", label: "A little new" },
      { value: "surprise", label: "Surprise me" },
    ],
  },
] as const;

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
  return Boolean(
    answers.intent &&
      answers.flavor &&
      answers.texture &&
      answers.heaviness &&
      answers.adventure &&
      INTENTS.includes(answers.intent) &&
      FLAVORS.includes(answers.flavor) &&
      TEXTURES.includes(answers.texture) &&
      (HEAVINESS.includes(answers.heaviness as (typeof HEAVINESS)[number]) ||
        answers.heaviness === "any") &&
      ADVENTURE.includes(answers.adventure),
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

export function TasteQuiz() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const seededIntent = parseIntent(searchParams.get("intent"));
  const fromHome = searchParams.get("from") === "home";
  const steps = useMemo(
    () => (seededIntent ? [...CRAVING_STEPS] : [INTENT_STEP, ...CRAVING_STEPS]),
    [seededIntent],
  );
  const totalSteps = steps.length;
  const step = parseStep(searchParams.get("step"), totalSteps);
  const [answers, setAnswers] = useState<PartialAnswers>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const draft = readDraft();
      if (seededIntent) {
        const next = { ...draft, intent: seededIntent };
        setAnswers(next);
        writeDraft(next);
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
    async (finalAnswers: Answers) => {
      clearDraft();
      const session = emptySession(finalAnswers);
      const dna = await loadDnaForUser();
      const rec = rank(finalAnswers, dna, session);
      writeSession({
        ...session,
        servedIds: [rec.primary.food.id],
      });
      router.push(`/result/${rec.primary.food.id}`);
    },
    [router],
  );

  const onChoose = useCallback(
    (value: string) => {
      if (!current) return;
      const next = { ...answers, [current.key]: value };
      setAnswers(next);
      writeDraft(next);

      if (current.key === "intent") {
        const intent = value as Intent;
        goStep(1, intent);
        return;
      }

      if (step < totalSteps) {
        goStep(step + 1);
        return;
      }

      if (isComplete(next)) {
        void finish(next);
      }
    },
    [answers, current, finish, goStep, step, totalSteps],
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
                key={s.key}
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
