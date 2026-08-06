"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { loadDnaForUser } from "@/lib/dna-sync";
import { rank } from "@/lib/engine";
import { QUIZ_OPTION_ICONS, QUIZ_STEP_ICONS } from "@/lib/mood-icons";
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
  const [answers, setAnswers] = useState<PartialAnswers>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setAnswers(readDraft());
      setHydrated(true);
    });
  }, []);

  const current = STEPS[step - 1];
  const stepLabel = String(step).padStart(2, "0");

  const goStep = useCallback(
    (next: number) => {
      router.push(`/taste?step=${next}`, { scroll: false });
    },
    [router],
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

      if (step < 4) {
        goStep(step + 1);
        return;
      }

      if (isComplete(next)) {
        finish(next);
      }
    },
    [answers, current, finish, goStep, step],
  );

  if (!current) return null;

  const selected = hydrated ? answers[current.key] : undefined;
  const StepIcon = QUIZ_STEP_ICONS[current.key];

  return (
    <section className="quiz" aria-labelledby="quiz-question">
      <p className="step quiz-progress" aria-live="polite">
        {stepLabel} / 04
      </p>
      <div className="quiz-question-block">
        <span className="quiz-question-icon" aria-hidden>
          <StepIcon size={28} strokeWidth={1.5} />
        </span>
        <h1 id="quiz-question" className="quiz-question">
          {current.question}
        </h1>
      </div>

      <ul className="quiz-options" role="list">
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
                <span className="quiz-option-label">{opt.label}</span>
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
