import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ProductBottomNav } from "@/components/ProductBottomNav";
import { TasteQuiz } from "@/components/TasteQuiz";

export const metadata = {
  title: "Quiz",
};

export default function TastePage() {
  return (
    <>
      <SiteHeader current="taste" />
      <main className="product-main product-main-with-nav">
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
      </main>
      <ProductBottomNav current="taste" />
    </>
  );
}
