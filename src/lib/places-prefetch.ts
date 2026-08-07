import type { NearbyPlace } from "@/lib/taste-types";

const GEO_CACHE_KEY = "mood-taster-geo";
const GEO_CACHE_MS = 10 * 60 * 1000;
const PLACES_PREFETCH_PREFIX = "mood-taster-places:";
const PLACES_PREFETCH_MS = 5 * 60 * 1000;

type GeoCache = { lat: number; lng: number; at: number };
type PlacesCache = { places: NearbyPlace[]; at: number };

function readGeo(): { lat: number; lng: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(GEO_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GeoCache;
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

function writeGeo(lat: number, lng: number): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      GEO_CACHE_KEY,
      JSON.stringify({ lat, lng, at: Date.now() } satisfies GeoCache),
    );
  } catch {
    /* ignore */
  }
}

/** Warm geolocation during the quiz so Eat out results skip the cold wait. */
export function warmGeolocation(): void {
  if (typeof window === "undefined" || !navigator.geolocation) return;
  if (readGeo()) return;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      writeGeo(pos.coords.latitude, pos.coords.longitude);
    },
    () => {
      /* permission denied is fine; result falls back to maps */
    },
    { timeout: 5000, maximumAge: 300_000 },
  );
}

export function readPrefetchedPlaces(foodId: string): NearbyPlace[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PLACES_PREFETCH_PREFIX + foodId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlacesCache;
    if (!Array.isArray(parsed.places) || typeof parsed.at !== "number") {
      return null;
    }
    if (Date.now() - parsed.at > PLACES_PREFETCH_MS) return null;
    return parsed.places;
  } catch {
    return null;
  }
}

function writePrefetchedPlaces(foodId: string, places: NearbyPlace[]): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      PLACES_PREFETCH_PREFIX + foodId,
      JSON.stringify({ places, at: Date.now() } satisfies PlacesCache),
    );
  } catch {
    /* ignore */
  }
}

/**
 * Fire-and-forget places fetch for the matched dish. ResultView reads the
 * cache first so Nearby can paint without waiting on geo + Places again.
 */
export function prefetchPlacesForFood(foodId: string): void {
  if (typeof window === "undefined") return;
  if (readPrefetchedPlaces(foodId)) return;

  const run = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `/api/places?foodId=${encodeURIComponent(foodId)}&lat=${lat}&lng=${lng}`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as { places?: NearbyPlace[] };
      const places = data.places ?? [];
      if (places.length > 0) writePrefetchedPlaces(foodId, places);
    } catch {
      /* best-effort */
    }
  };

  const cached = readGeo();
  if (cached) {
    void run(cached.lat, cached.lng);
    return;
  }

  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      writeGeo(pos.coords.latitude, pos.coords.longitude);
      void run(pos.coords.latitude, pos.coords.longitude);
    },
    () => {
      /* no geo */
    },
    { timeout: 5000, maximumAge: 300_000 },
  );
}

export { readGeo as readCachedGeo, writeGeo as writeCachedGeo };
