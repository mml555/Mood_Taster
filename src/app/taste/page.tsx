import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { TasteQuiz } from "@/components/TasteQuiz";

export const metadata = {
  title: "Quiz",
};

export default function TastePage() {
  return (
    <>
      <SiteHeader current="taste" />
      <main className="product-main">
        <Suspense
          fallback={
            <section className="quiz">
              <div className="quiz-progress">
                <ol className="quiz-dots" aria-hidden>
                  <li className="quiz-dot is-current" />
                  <li className="quiz-dot" />
                  <li className="quiz-dot" />
                  <li className="quiz-dot" />
                  <li className="quiz-dot" />
                </ol>
              </div>
              <h1 className="quiz-question">Loading…</h1>
            </section>
          }
        >
          <TasteQuiz />
        </Suspense>
      </main>
    </>
  );
}
