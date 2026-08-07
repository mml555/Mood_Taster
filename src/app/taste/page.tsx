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
      <ProductBottomNav current="taste" />
    </>
  );
}
