import { NextResponse } from "next/server";
import { CATALOG } from "@/lib/catalog";
import { parseCoordinate } from "@/lib/validate";

/**
 * Nearby places serving the recommended dish, via Google Places searchText.
 *
 * The key is server side only. The client sends coordinates, never the key.
 *
 * Every failure returns 200 with an empty list. The result screen renders a
 * maps deep link in the same slot when this comes back empty, so a denied
 * permission, a missing key, or a quota error all degrade to a working link
 * rather than a dead region on the page.
 */

const ENDPOINT = "https://places.googleapis.com/v1/places:searchText";

// Keeping the mask tight matters: Places bills by the fields requested.
const FIELD_MASK = [
  "places.displayName",
  "places.formattedAddress",
  "places.rating",
  "places.googleMapsUri",
  "places.location",
].join(",");

const SEARCH_RADIUS_METRES = 8000;

type PlacesResponse = {
  places?: Array<{
    displayName?: { text?: string };
    formattedAddress?: string;
    rating?: number;
    googleMapsUri?: string;
    location?: { latitude?: number; longitude?: number };
  }>;
};

export type NearbyPlace = {
  name: string;
  address: string;
  rating: number | null;
  mapsUri: string | null;
  miles: number | null;
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

export async function GET(request: Request) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const { searchParams } = new URL(request.url);

  const food = CATALOG.find((f) => f.id === searchParams.get("foodId"));
  if (!food) {
    return NextResponse.json({ error: "Unknown food id" }, { status: 400 });
  }

  const lat = parseCoordinate(searchParams.get("lat"), 90);
  const lng = parseCoordinate(searchParams.get("lng"), 180);

  // No key or no location is a normal state, not an error. The client already
  // knows how to render the fallback link.
  if (!apiKey || lat === null || lng === null) {
    return NextResponse.json({ places: [] });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: `${food.name} restaurant`,
        locationBias: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: SEARCH_RADIUS_METRES,
          },
        },
        maxResultCount: 3,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn("[places] responded %d", res.status);
      return NextResponse.json({ places: [] });
    }

    const body = (await res.json()) as PlacesResponse;

    const places: NearbyPlace[] = (body.places ?? [])
      .map((p) => {
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
        };
      })
      .filter((p) => p.name.length > 0)
      .slice(0, 3);

    return NextResponse.json({ places });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    console.warn("[places] request failed", aborted ? "timeout" : err);
    return NextResponse.json({ places: [] });
  } finally {
    clearTimeout(timeout);
  }
}
