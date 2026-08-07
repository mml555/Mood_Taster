import { Suspense } from "react";
import { notFound } from "next/navigation";
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
    // A result belongs to one person's session. Kept out of the index so a
    // shared or crawled link never becomes a search listing, matching the
    // /result/ disallow in robots.ts.
    robots: { index: false, follow: false },
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
    </>
  );
}
