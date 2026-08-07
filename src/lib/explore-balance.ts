/**
 * Comfort vs Explore control (BACKLOG P2-8 / PRD §58).
 * Adjusts novelty weight in rank(); never bypasses dietary hard filters.
 */

export const EXPLORE_BALANCE_KEY = "mood-taster-explore-balance";

export const EXPLORE_BALANCES = ["comfort", "balanced", "explore"] as const;
export type ExploreBalance = (typeof EXPLORE_BALANCES)[number];

export const DEFAULT_EXPLORE_BALANCE: ExploreBalance = "balanced";

/** Novelty term weight in the rank blend (quiz stays dominant). */
export const NOVELTY_WEIGHT: Record<ExploreBalance, number> = {
  comfort: 0.02,
  balanced: 0.05,
  explore: 0.14,
};

const BALANCE_SET = new Set<string>(EXPLORE_BALANCES);

export function isExploreBalance(raw: unknown): raw is ExploreBalance {
  return typeof raw === "string" && BALANCE_SET.has(raw);
}

export function parseExploreBalance(raw: unknown): ExploreBalance {
  return isExploreBalance(raw) ? raw : DEFAULT_EXPLORE_BALANCE;
}

export function readExploreBalance(): ExploreBalance {
  if (typeof window === "undefined") return DEFAULT_EXPLORE_BALANCE;
  try {
    return parseExploreBalance(localStorage.getItem(EXPLORE_BALANCE_KEY));
  } catch {
    return DEFAULT_EXPLORE_BALANCE;
  }
}

export function writeExploreBalance(balance: ExploreBalance): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(EXPLORE_BALANCE_KEY, balance);
}

export function clearExploreBalance(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(EXPLORE_BALANCE_KEY);
}

export function labelExploreBalance(balance: ExploreBalance): string {
  switch (balance) {
    case "comfort":
      return "Comfort";
    case "explore":
      return "Explore";
    default:
      return "Balanced";
  }
}
