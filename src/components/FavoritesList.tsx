"use client";

import Link from "next/link";
import { Bookmark, ChefHat, Utensils, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getRankFoodById } from "@/lib/catalog-data";
import {
  toggleFavorite,
  type FavoritesState,
} from "@/lib/favorites";
import {
  loadFavoritesForUser,
  persistFavorites,
} from "@/lib/favorites-sync";
import { ICON_MD, ICON_SM, ICON_STROKE } from "@/lib/ui-icons";

type FavItem = {
  id: string;
  name: string;
  hasRecipe: boolean;
};

function resolveItems(state: FavoritesState): FavItem[] {
  const items: FavItem[] = [];
  for (const id of state.foodIds) {
    const food = getRankFoodById(id);
    if (!food) continue;
    items.push({
      id: food.id,
      name: food.name,
      hasRecipe: food.hasRecipe,
    });
  }
  return items;
}

export function FavoritesList() {
  const [items, setItems] = useState<FavItem[] | null>(null);

  useEffect(() => {
    queueMicrotask(async () => {
      const loaded = await loadFavoritesForUser();
      setItems(resolveItems(loaded));
    });
  }, []);

  const onUnsave = useCallback((foodId: string) => {
    const next = toggleFavorite(foodId);
    setItems(resolveItems(next));
    void persistFavorites(next);
  }, []);

  if (items === null) {
    return (
      <section className="favorites" aria-busy="true" aria-label="Loading Saved">
        <p className="eyebrow">Saved</p>
        <div className="skeleton-block" style={{ width: "120px", height: "32px", marginBottom: "16px" }} />
        <div className="skeleton-card" style={{ height: "80px" }} />
        <div className="skeleton-card" style={{ height: "80px" }} />
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="favorites">
        <p className="eyebrow">
          <Bookmark size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden /> Saved
        </p>
        <h1 className="dna-title">Nothing saved yet</h1>
        <p className="dna-lede">
          Save a dish from a recipe. Come back when you want it again.
        </p>
        <div className="result-actions">
          <Link className="cta" href="/taste?intent=recipe">
            <Utensils size={ICON_MD} strokeWidth={ICON_STROKE} aria-hidden />
            Show me
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="favorites">
      <p className="eyebrow">
        <Bookmark size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden /> Saved
      </p>
      <h1 className="dna-title">Favorites</h1>
      <p className="dna-lede">
        Soft boost in matches. Never locks you into one dish.
      </p>
      <ul className="favorites-list favorites-list-grid">
        {items.map((item) => (
          <li key={item.id} className="favorites-item">
            <div className="favorites-item-main">
              <Link className="favorites-item-link" href={`/result/${item.id}`}>
                {item.name}
              </Link>
              {item.hasRecipe ? (
                <p className="favorites-item-meta">
                  <ChefHat size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden />
                  Recipe
                </p>
              ) : null}
            </div>
            <button
              type="button"
              className="cta-secondary favorites-unsave"
              onClick={() => onUnsave(item.id)}
              aria-label={`Remove ${item.name}`}
            >
              <X size={ICON_SM} strokeWidth={ICON_STROKE} aria-hidden />
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div className="result-actions">
        <Link className="cta" href="/taste">
          <Utensils size={ICON_MD} strokeWidth={ICON_STROKE} aria-hidden />
          New craving
        </Link>
      </div>
    </section>
  );
}
