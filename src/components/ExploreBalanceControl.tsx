"use client";

import { useEffect, useState } from "react";
import {
  EXPLORE_BALANCES,
  labelExploreBalance,
  writeExploreBalance,
  type ExploreBalance,
} from "@/lib/explore-balance";
import {
  loadGamificationForUser,
  persistGamification,
  readGamificationLocal,
} from "@/lib/gamification-sync";

type ExploreBalanceControlProps = {
  /** Compact inline for quiz; default for DNA. */
  compact?: boolean;
};

/**
 * Comfort vs Explore dial (BACKLOG P2-8). Default balanced.
 * Softens or boosts novelty in rank(); never bypasses diet filters.
 */
export function ExploreBalanceControl({
  compact = false,
}: ExploreBalanceControlProps) {
  const [balance, setBalance] = useState<ExploreBalance>("balanced");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    queueMicrotask(async () => {
      const progress = await loadGamificationForUser();
      setBalance(progress.exploreBalance);
      setHydrated(true);
    });
  }, []);

  const onPick = (next: ExploreBalance) => {
    setBalance(next);
    writeExploreBalance(next);
    void persistGamification({
      ...readGamificationLocal(),
      exploreBalance: next,
    });
  };

  return (
    <fieldset
      className={
        compact ? "explore-balance explore-balance-compact" : "explore-balance"
      }
    >
      <legend className={compact ? "visually-hidden" : "dietary-section-title"}>
        Comfort or explore
      </legend>
      {!compact ? (
        <p className="dna-lede">
          Comfort sticks to known likes. Explore leans novel. Balanced is the
          default.
        </p>
      ) : (
        <p className="explore-balance-hint">Match style</p>
      )}
      <div className="explore-balance-row" role="group">
        {EXPLORE_BALANCES.map((option) => {
          const active = hydrated && balance === option;
          return (
            <button
              key={option}
              type="button"
              className={
                active ? "explore-balance-btn is-selected" : "explore-balance-btn"
              }
              aria-pressed={active}
              onClick={() => onPick(option)}
            >
              {labelExploreBalance(option)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
