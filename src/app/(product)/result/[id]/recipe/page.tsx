import { notFound } from "next/navigation";
import { RecipeExperience } from "@/components/result/RecipeExperience";
import { getFoodById } from "@/lib/catalog";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const food = getFoodById(id);
  return {
    title: food ? `${food.name} recipe` : "Recipe",
    robots: { index: false, follow: false },
  };
}

export default async function RecipePage({ params }: PageProps) {
  const { id } = await params;
  const food = getFoodById(id);
  if (!food?.recipe) notFound();

  return <RecipeExperience food={food} recipe={food.recipe} />;
}
