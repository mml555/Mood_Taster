import type { Food } from "@/lib/taste-types";

export const GEO_CACHE_KEY = "mood-taster-geo";
export const GEO_CACHE_MS = 10 * 60 * 1000;
export const PLACES_CACHE_KEY = "mood-taster-places";
export const PLACES_CACHE_MS = 60 * 1000;

/** Always available, needs no key and no permission. The floor under Places. */
export function mapsSearchUrl(food: Pick<Food, "name">): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${food.name} restaurant`,
  )}`;
}

export function readCachedGeo(): { lat: number; lng: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(GEO_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      lat?: unknown;
      lng?: unknown;
      at?: unknown;
    };
    if (
      typeof parsed.lat !== "number" ||
      typeof parsed.lng !== "number" ||
      typeof parsed.at !== "number"
    ) {
      return null;
    }
    if (Date.now() - parsed.at > GEO_CACHE_MS) return null;
    return { lat: parsed.lat, lng: parsed.lng };
  } catch {
    return null;
  }
}

export function writeCachedGeo(lat: number, lng: number): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      GEO_CACHE_KEY,
      JSON.stringify({ lat, lng, at: Date.now() }),
    );
  } catch {
    /* quota / private mode */
  }
}

/** Round coords so nearby fetches share a cache key across tiny GPS drift. */
export function placesCacheKey(
  foodId: string,
  lat: number,
  lng: number,
): string {
  return `${foodId}:${lat.toFixed(2)}:${lng.toFixed(2)}`;
}

export function readCachedPlaces(
  foodId: string,
  lat: number,
  lng: number,
): import("@/lib/taste-types").NearbyPlace[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PLACES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      key?: unknown;
      at?: unknown;
      places?: unknown;
    };
    if (
      parsed.key !== placesCacheKey(foodId, lat, lng) ||
      typeof parsed.at !== "number" ||
      !Array.isArray(parsed.places)
    ) {
      return null;
    }
    if (Date.now() - parsed.at > PLACES_CACHE_MS) return null;
    return parsed.places as import("@/lib/taste-types").NearbyPlace[];
  } catch {
    return null;
  }
}

export function writeCachedPlaces(
  foodId: string,
  lat: number,
  lng: number,
  places: import("@/lib/taste-types").NearbyPlace[],
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      PLACES_CACHE_KEY,
      JSON.stringify({
        key: placesCacheKey(foodId, lat, lng),
        at: Date.now(),
        places,
      }),
    );
  } catch {
    /* quota / private mode */
  }
}
