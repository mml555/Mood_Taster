import type { NearbyPlace, PlaceLabel } from "@/lib/taste-types";

/**
 * Pure helpers for Places enrichment and Best / Closest / Wildcard selection.
 * Kept out of the route so location/geocode changes stay isolated.
 */

export type PlaceCandidate = {
  name: string;
  address: string;
  rating: number | null;
  mapsUri: string | null;
  miles: number | null;
  price: string | null;
  openNow: boolean | null;
};

const PRICE_LABELS: Record<string, string> = {
  PRICE_LEVEL_FREE: "Free",
  PRICE_LEVEL_INEXPENSIVE: "$",
  PRICE_LEVEL_MODERATE: "$$",
  PRICE_LEVEL_EXPENSIVE: "$$$",
  PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
};

export const PLACE_LABEL_COPY: Record<PlaceLabel, string> = {
  best: "Best match",
  closest: "Closest",
  wildcard: "Wildcard",
};

export function priceFromLevel(level: string | undefined): string | null {
  if (!level) return null;
  return PRICE_LABELS[level] ?? null;
}

export function openNowFromHours(
  hours: { openNow?: boolean } | undefined,
): boolean | null {
  if (!hours || typeof hours.openNow !== "boolean") return null;
  return hours.openNow;
}

function bestIndex(places: PlaceCandidate[]): number {
  let best = 0;
  for (let i = 1; i < places.length; i++) {
    const aRating = places[best].rating ?? -1;
    const bRating = places[i].rating ?? -1;
    // Higher rating wins. Equal ratings keep earlier API order (relevance).
    if (bRating > aRating) best = i;
  }
  return best;
}

function closestIndex(
  places: PlaceCandidate[],
  exclude: ReadonlySet<number>,
): number | null {
  let pick: number | null = null;
  let bestMiles = Infinity;
  for (let i = 0; i < places.length; i++) {
    if (exclude.has(i)) continue;
    const miles = places[i].miles;
    if (miles === null) continue;
    if (miles < bestMiles) {
      bestMiles = miles;
      pick = i;
    }
  }
  return pick;
}

/** Prefer open + well-rated leftovers as the interesting alternative. */
function wildcardIndex(
  places: PlaceCandidate[],
  exclude: ReadonlySet<number>,
): number | null {
  let pick: number | null = null;
  let bestScore = -Infinity;
  for (let i = 0; i < places.length; i++) {
    if (exclude.has(i)) continue;
    const p = places[i];
    const score =
      (p.rating ?? 0) +
      (p.openNow === true ? 0.5 : 0) +
      (p.miles === null ? 0 : Math.max(0, 2 - p.miles) * 0.05);
    if (score > bestScore) {
      bestScore = score;
      pick = i;
    }
  }
  return pick;
}

function withLabel(place: PlaceCandidate, label: PlaceLabel): NearbyPlace {
  return { ...place, label };
}

/**
 * Label up to 3 distinct places: Best match, Closest, Wildcard.
 * Degrades when fewer candidates (or missing distance) are available.
 */
export function selectLabeledPlaces(
  candidates: PlaceCandidate[],
): NearbyPlace[] {
  const places = candidates.filter((p) => p.name.length > 0);
  if (places.length === 0) return [];

  if (places.length === 1) {
    return [withLabel(places[0], "best")];
  }

  const used = new Set<number>();
  const out: NearbyPlace[] = [];

  const best = bestIndex(places);
  used.add(best);
  out.push(withLabel(places[best], "best"));

  const closest = closestIndex(places, used);
  if (closest !== null) {
    used.add(closest);
    out.push(withLabel(places[closest], "closest"));
  }

  const wildcard = wildcardIndex(places, used);
  if (wildcard !== null) {
    out.push(withLabel(places[wildcard], "wildcard"));
  } else if (out.length === 1) {
    // Two candidates but no distance for Closest: still surface the other one.
    const other = places.findIndex((_, i) => !used.has(i));
    if (other !== -1) {
      out.push(withLabel(places[other], "wildcard"));
    }
  }

  return out.slice(0, 3);
}
