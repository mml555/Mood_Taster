import { Suspense } from "react";
import { SiteFooter } from "@/components/SiteFooter";
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
              <p className="step">01 / 04</p>
              <h1 className="quiz-question">Loading…</h1>
            </section>
          }
        >
          <TasteQuiz />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
