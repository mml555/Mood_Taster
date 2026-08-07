import { Suspense } from "react";
import { TasteQuiz } from "@/components/TasteQuiz";

export const metadata = {
  title: "Quiz",
};

export default function TastePage() {
  return (
    <Suspense
      fallback={
        <section className="quiz">
          <div className="quiz-progress">
            <span className="quiz-progress-count">Loading</span>
            <ol className="quiz-segments" aria-hidden>
              <li className="quiz-segment is-current" />
              <li className="quiz-segment" />
              <li className="quiz-segment" />
              <li className="quiz-segment" />
              <li className="quiz-segment" />
            </ol>
          </div>
          <h1 className="quiz-question">Loading…</h1>
        </section>
      }
    >
      <TasteQuiz />
    </Suspense>
  );
}
