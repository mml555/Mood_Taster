"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { readDna } from "@/lib/dna";
import { rank } from "@/lib/engine";
import { emptySession, writeSession } from "@/lib/session";
import type { Answers } from "@/lib/taste-types";
import {
  ADVENTURE,
  FLAVORS,
  HEAVINESS,
  TEXTURES,
} from "@/lib/taste-types";

const STEPS = [
  {
    key: "flavor" as const,
    question: "What kind of flavor?",
    options: [
      { value: "savory", label: "Savory" },
      { value: "spicy", label: "Spicy" },
      { value: "sweet", label: "Sweet" },
      { value: "fresh", label: "Fresh" },
    ],
  },
  {
    key: "texture" as const,
    question: "What texture sounds right?",
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
      { value: "any", label: "I don't care" },
    ],
  },
  {
    key: "adventure" as const,
    question: "How adventurous?",
    options: [
      { value: "safe", label: "Safe favorite" },
      { value: "curious", label: "A little different" },
      { value: "surprise", label: "Surprise me" },
    ],
  },
];

type PartialAnswers = Partial<Answers>;

const DRAFT_KEY = "mood-taster-quiz-draft";
const DRAFT_EVENT = "mood-taster-quiz-draft";

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
  window.dispatchEvent(new Event(DRAFT_EVENT));
}

function clearDraft() {
  sessionStorage.removeItem(DRAFT_KEY);
  window.dispatchEvent(new Event(DRAFT_EVENT));
}

function subscribeDraft(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(DRAFT_EVENT, handler);
  return () => window.removeEventListener(DRAFT_EVENT, handler);
}

function parseStep(raw: string | null): number {
  const n = Number(raw ?? "1");
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(4, Math.floor(n));
}

function isComplete(answers: PartialAnswers): answers is Answers {
  return Boolean(
    answers.flavor &&
      answers.texture &&
      answers.heaviness &&
      answers.adventure &&
      FLAVORS.includes(answers.flavor) &&
      TEXTURES.includes(answers.texture) &&
      (HEAVINESS.includes(answers.heaviness as (typeof HEAVINESS)[number]) ||
        answers.heaviness === "any") &&
      ADVENTURE.includes(answers.adventure),
  );
}

export function TasteQuiz() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = parseStep(searchParams.get("step"));
  const answers = useSyncExternalStore(subscribeDraft, readDraft, () => ({}));

  const current = STEPS[step - 1];
  const stepLabel = String(step).padStart(2, "0");

  const goStep = useCallback(
    (next: number) => {
      router.push(`/taste?step=${next}`, { scroll: false });
    },
    [router],
  );

  const finish = useCallback(
    (finalAnswers: Answers) => {
      clearDraft();
      const session = emptySession(finalAnswers);
      const dna = readDna();
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
      const next = { ...readDraft(), [current.key]: value };
      writeDraft(next);

      if (step < 4) {
        goStep(step + 1);
        return;
      }

      if (isComplete(next)) {
        finish(next);
      }
    },
    [current, finish, goStep, step],
  );

  const selected = useMemo(() => {
    if (!current) return undefined;
    return answers[current.key];
  }, [answers, current]);

  if (!current) return null;

  return (
    <section className="quiz" aria-labelledby="quiz-question">
      <p className="step quiz-progress" aria-live="polite">
        {stepLabel} / 04
      </p>
      <h1 id="quiz-question" className="quiz-question">
        {current.question}
      </h1>

      <ul className="quiz-options" role="list">
        {current.options.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <li key={opt.value}>
              <button
                type="button"
                className={
                  isSelected ? "quiz-option is-selected" : "quiz-option"
                }
                onClick={() => onChoose(opt.value)}
              >
                {opt.label}
              </button>
            </li>
          );
        })}
      </ul>

      {step > 1 ? (
        <button
          type="button"
          className="quiz-back"
          onClick={() => goStep(step - 1)}
        >
          <ArrowLeft size={20} strokeWidth={1.5} aria-hidden />
          Back
        </button>
      ) : null}
    </section>
  );
}
