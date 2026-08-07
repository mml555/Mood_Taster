"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ALLERGEN_OPTIONS,
  DIET_OPTIONS,
  EMPTY_DIETARY,
  type AllergenId,
  type DietId,
  type DietaryPrefs,
} from "@/lib/dietary";
import { loadDietaryForUser, persistDietary } from "@/lib/dietary-sync";

type DietaryPrefsEditorProps = {
  /** Compact copy for the DNA page. */
  compact?: boolean;
};

export function DietaryPrefsEditor({ compact = false }: DietaryPrefsEditorProps) {
  const [prefs, setPrefs] = useState<DietaryPrefs>(EMPTY_DIETARY);
  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    queueMicrotask(async () => {
      const loaded = await loadDietaryForUser();
      setPrefs(loaded);
      setHydrated(true);
    });
  }, []);

  const persist = useCallback((next: DietaryPrefs) => {
    setPrefs(next);
    void persistDietary(next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }, []);

  const toggleDiet = useCallback(
    (id: DietId) => {
      const diets = prefs.diets.includes(id)
        ? prefs.diets.filter((d) => d !== id)
        : [...prefs.diets, id];
      // Vegan implies vegetarian for UI clarity.
      let nextDiets = diets;
      if (id === "vegan" && !prefs.diets.includes("vegan")) {
        if (!nextDiets.includes("vegetarian")) {
          nextDiets = [...nextDiets, "vegetarian"];
        }
      }
      persist({ ...prefs, diets: nextDiets });
    },
    [persist, prefs],
  );

  const toggleAllergen = useCallback(
    (id: AllergenId) => {
      const allergens = prefs.allergens.includes(id)
        ? prefs.allergens.filter((a) => a !== id)
        : [...prefs.allergens, id];
      persist({ ...prefs, allergens });
    },
    [persist, prefs],
  );

  if (!hydrated) {
    return <p className="dna-lede">Loading diet settings…</p>;
  }

  return (
    <div className="dietary-prefs">
      {!compact ? (
        <p className="dietary-note">
          Hard limits for matches. Menu data is not medical advice. When a
          restaurant cannot guarantee allergens, treat this as a guide only.
        </p>
      ) : (
        <p className="dietary-note">
          Hard limits. Not medical advice for restaurant menus.
        </p>
      )}

      <h3 className="dietary-heading">Diet</h3>
      <ul className="feedback-chips" aria-label="Diet">
        {DIET_OPTIONS.map((opt) => {
          const selected = prefs.diets.includes(opt.id);
          return (
            <li key={opt.id}>
              <button
                type="button"
                className={
                  selected ? "feedback-chip is-selected" : "feedback-chip"
                }
                aria-pressed={selected}
                onClick={() => toggleDiet(opt.id)}
              >
                {opt.label}
              </button>
            </li>
          );
        })}
      </ul>

      <h3 className="dietary-heading">Avoid (allergy / safety)</h3>
      <ul className="feedback-chips" aria-label="Allergens to avoid">
        {ALLERGEN_OPTIONS.map((opt) => {
          const selected = prefs.allergens.includes(opt.id);
          return (
            <li key={opt.id}>
              <button
                type="button"
                className={
                  selected ? "feedback-chip is-selected" : "feedback-chip"
                }
                aria-pressed={selected}
                onClick={() => toggleAllergen(opt.id)}
              >
                {opt.label}
              </button>
            </li>
          );
        })}
      </ul>

      {saved ? (
        <p className="dietary-saved" role="status">
          Saved.
        </p>
      ) : null}
    </div>
  );
}
