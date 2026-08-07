import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { CATALOG } from "@/lib/catalog";
import { geocodePlaceQuery } from "@/lib/geocode";
import { requestJson } from "@/lib/http-json";
import {
  openNowFromHours,
  priceFromLevel,
  selectLabeledPlaces,
  type PlaceCandidate,
} from "@/lib/places-rank";
import { parseCoordinate, parsePlaceQuery } from "@/lib/validate";

/**
 * Nearby places serving the recommended dish, via Google Places searchText.
 *
 * The key is server side only. The client sends coordinates, never the key.
 * Accepts lat/lng or a manual `q` / `location` (city / ZIP). Manual queries
 * are geocoded first, then biased the same way as browser geolocation.
 *
 * Every failure returns 200 with an empty list. The result screen renders a
 * maps deep link (and a city/ZIP form) in the same slot when this comes back
 * empty, so a denied permission, a missing key, or a quota error all degrade
 * to a working link rather than a dead region on the page.
 */

const PLACES_ENDPOINT = "https://places.googleapis.com/v1/places:searchText";

/**
 * The key carries an HTTP referrer restriction, so it is scoped to the
 * production site. Google enforces that against the `Referer` header, and a
 * server side fetch sends none, which is why an unset referrer returns
 * 403 API_KEY_HTTP_REFERRER_BLOCKED even with a valid key.
 *
 * We control this request, so we state the referrer explicitly. It names our
 * own site and satisfies the restriction the key was configured with. Local
 * development will still be blocked unless PLACES_REFERRER matches an allowed
 * pattern, which is the restriction working as intended.
 */
function placesReferrer(): string {
  const explicit = process.env.PLACES_REFERRER;
  if (explicit) return explicit;

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return vercel ? `https://${vercel}/` : "https://mood-taster.vercel.app/";
}

/** Enough to tell two keys apart in a log without printing either of them. */
function keyFingerprint(key: string): string {
  return createHash("sha256").update(key).digest("hex").slice(0, 8);
}

// Keeping the mask tight matters: Places bills by the fields requested.
const FIELD_MASK = [
  "places.displayName",
  "places.formattedAddress",
  "places.rating",
  "places.googleMapsUri",
  "places.location",
  "places.priceLevel",
  "places.currentOpeningHours.openNow",
].join(",");

const SEARCH_RADIUS_METRES = 8000;
/** Fetch a wider pool, then label up to 3 (Best / Closest / Wildcard). */
const SEARCH_POOL_SIZE = 10;

const EMPTY = { places: [] };

type PlacesResponse = {
  places?: Array<{
    displayName?: { text?: string };
    formattedAddress?: string;
    rating?: number;
    googleMapsUri?: string;
    location?: { latitude?: number; longitude?: number };
    priceLevel?: string;
    currentOpeningHours?: { openNow?: boolean };
  }>;
};

function milesBetween(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const R = 3958.8;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * lat/lng straight from the browser, or a geocoded city / ZIP. Returns null
 * when the caller gave us nothing usable to search around.
 */
async function resolveLocation(
  params: URLSearchParams,
  apiKey: string,
): Promise<{ lat: number; lng: number } | { geoError: true } | null> {
  const lat = parseCoordinate(params.get("lat"), 90);
  const lng = parseCoordinate(params.get("lng"), 180);
  if (lat !== null && lng !== null) return { lat, lng };

  const placeQuery =
    parsePlaceQuery(params.get("q")) ?? parsePlaceQuery(params.get("location"));
  if (!placeQuery) return null;

  const geo = await geocodePlaceQuery(placeQuery, apiKey);
  return geo ?? { geoError: true };
}

export async function GET(request: Request) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const { searchParams } = new URL(request.url);

  const food = CATALOG.find((f) => f.id === searchParams.get("foodId"));
  if (!food) {
    return NextResponse.json({ error: "Unknown food id" }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json(EMPTY);
  }

  const location = await resolveLocation(searchParams, apiKey);
  if (!location) return NextResponse.json(EMPTY);
  if ("geoError" in location) {
    return NextResponse.json({ ...EMPTY, geoError: true });
  }

  const { lat, lng } = location;

  try {
    const { status, data } = await requestJson<PlacesResponse>(
      PLACES_ENDPOINT,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": FIELD_MASK,
          Referer: placesReferrer(),
        },
        body: JSON.stringify({
          textQuery: `${food.name} restaurant`,
          locationBias: {
            circle: {
              center: { latitude: lat, longitude: lng },
              radius: SEARCH_RADIUS_METRES,
            },
          },
          maxResultCount: SEARCH_POOL_SIZE,
        }),
      },
    );

    if (status !== 200 || !data) {
      console.warn(
        "[places] responded %d using key fingerprint %s (length %d)",
        status,
        keyFingerprint(apiKey),
        apiKey.length,
      );
      return NextResponse.json(EMPTY);
    }

    const candidates: PlaceCandidate[] = (data.places ?? []).map((p) => {
      const pLat = p.location?.latitude;
      const pLng = p.location?.longitude;
      return {
        name: p.displayName?.text ?? "",
        address: p.formattedAddress ?? "",
        rating: typeof p.rating === "number" ? p.rating : null,
        mapsUri: p.googleMapsUri ?? null,
        miles:
          typeof pLat === "number" && typeof pLng === "number"
            ? milesBetween(lat, lng, pLat, pLng)
            : null,
        price: priceFromLevel(p.priceLevel),
        openNow: openNowFromHours(p.currentOpeningHours),
      };
    });

    return NextResponse.json(
      { places: selectLabeledPlaces(candidates), lat, lng },
      { headers: { "Cache-Control": "private, max-age=60" } },
    );
  } catch (err) {
    console.warn("[places] request failed", err);
    return NextResponse.json(EMPTY);
  }
}
