"use client";

import { ChefHat, Clock } from "lucide-react";
import type { Recipe } from "@/lib/taste-types";

export function RecipeSection({
  recipe,
  cookTip,
}: {
  recipe: Recipe;
  cookTip: string | null;
}) {
  return (
    <div className="recipe" id="recipe">
      <p className="recipe-label">
        <ChefHat size={16} strokeWidth={1.5} aria-hidden />
        Recipe
      </p>
      <p className="recipe-meta">
        <span>
          <Clock size={16} strokeWidth={1.5} aria-hidden />
          {recipe.timeMinutes} min
        </span>
        <span>{recipe.servings} servings</span>
      </p>

      {cookTip ? <p className="recipe-tip">{cookTip}</p> : null}

      <h2 className="recipe-heading">Ingredients</h2>
      <ul className="recipe-ingredients">
        {recipe.ingredients.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h2 className="recipe-heading">Steps</h2>
      <ol className="recipe-steps">
        {recipe.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
  );
}
