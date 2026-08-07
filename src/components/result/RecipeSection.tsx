"use client";

import { Check, ChefHat, Clock, Copy, Heart, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import {
  FAVORITES_KEY,
  formatRecipeText,
  isFavorite,
  readFavorites,
  toggleFavorite,
} from "@/lib/favorites";
import { persistFavorites } from "@/lib/favorites-sync";
import type { Recipe } from "@/lib/taste-types";

function difficultyLabel(minutes: number): string {
  if (minutes <= 15) return "Easy";
  if (minutes <= 35) return "Doable";
  return "Project";
}

export function RecipeSection({
  foodId,
  foodName,
  recipe,
  cookTip,
}: {
  foodId: string;
  foodName: string;
  recipe: Recipe;
  cookTip: string | null;
}) {
  const [saved, setSaved] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">(
    "idle",
  );

  useEffect(() => {
    queueMicrotask(() => {
      setSaved(isFavorite(foodId));
    });
    track(ANALYTICS_EVENTS.recipeOpen, {
      food_id: foodId,
      time_minutes: recipe.timeMinutes,
      servings: recipe.servings,
    });
  }, [foodId, recipe.servings, recipe.timeMinutes]);

  const onCopy = useCallback(async () => {
    const text = formatRecipeText(foodName, recipe);
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }, [foodName, recipe]);

  const onToggleSave = useCallback(() => {
    const next = toggleFavorite(foodId);
    setSaved(isFavorite(foodId, next));
    void persistFavorites(next);
  }, [foodId]);

  useEffect(() => {
    if (copyStatus === "idle") return;
    const t = window.setTimeout(() => setCopyStatus("idle"), 2000);
    return () => window.clearTimeout(t);
  }, [copyStatus]);

  // Keep localStorage as source of truth if another tab toggles.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== FAVORITES_KEY) return;
      setSaved(isFavorite(foodId, readFavorites()));
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [foodId]);

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
        <span>{difficultyLabel(recipe.timeMinutes)}</span>
        <span>{recipe.servings} servings</span>
      </p>

      <div className="recipe-actions">
        <button
          type="button"
          className="cta-secondary"
          onClick={() => void onCopy()}
        >
          {copyStatus === "copied" ? (
            <Check size={18} strokeWidth={1.5} aria-hidden />
          ) : (
            <Copy size={18} strokeWidth={1.5} aria-hidden />
          )}
          {copyStatus === "copied" ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          className={saved ? "cta-secondary is-saved" : "cta-secondary"}
          onClick={onToggleSave}
          aria-pressed={saved}
        >
          {saved ? (
            <Heart size={18} strokeWidth={1.5} aria-hidden />
          ) : (
            <Plus size={18} strokeWidth={1.5} aria-hidden />
          )}
          {saved ? "Saved" : "Save"}
        </button>
      </div>
      {copyStatus === "failed" ? (
        <p className="recipe-action-status" role="status">
          Could not copy
        </p>
      ) : copyStatus === "copied" ? (
        <p className="recipe-action-status" role="status">
          Copied
        </p>
      ) : null}

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
