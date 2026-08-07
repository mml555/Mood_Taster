import { notFound } from "next/navigation";
import { CompletionView } from "@/components/CompletionView";
import { getFoodById } from "@/lib/catalog";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const food = getFoodById(id);
  return {
    title: food ? `Decision · ${food.name}` : "Decision made",
    robots: { index: false, follow: false },
  };
}

export default async function CompletionPage({ params }: PageProps) {
  const { id } = await params;
  const food = getFoodById(id);
  if (!food) notFound();

  return <CompletionView food={food} />;
}
