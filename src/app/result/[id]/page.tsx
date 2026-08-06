import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ResultView } from "@/components/ResultView";
import { getFoodById } from "@/lib/catalog";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const food = getFoodById(id);
  return {
    title: food?.name ?? "Not found",
  };
}

export default async function ResultPage({ params }: PageProps) {
  const { id } = await params;
  const food = getFoodById(id);
  if (!food) notFound();

  return (
    <>
      <SiteHeader current="result" />
      <main className="product-main">
        <Suspense
          fallback={
            <section className="result">
              <p className="eyebrow">Finding it</p>
              <h1 className="result-title">One moment…</h1>
            </section>
          }
        >
          <ResultView key={food.id} food={food} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
