import { createHash } from "node:crypto";
import { request as httpsRequest } from "node:https";
import { NextResponse } from "next/server";
import { CATALOG } from "@/lib/catalog";
import { geocodePlaceQuery } from "@/lib/geocode";
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
 * Accepts lat/lng or a manual `q` / `location` (city / ZIP). Manual queries
 * are geocoded first, then biased the same way as browser geolocation.
 *
 * Every failure returns 200 with an empty list. The result screen renders a
 * maps deep link (and a city/ZIP form) when this comes back empty.
 */

const PLACES_ENDPOINT = "https://places.googleapis.com/v1/places:searchText";

function placesReferrer(): string {
  const explicit = process.env.PLACES_REFERRER;
  if (explicit) return explicit;

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return vercel ? `https://${vercel}/` : "https://mood-taster.vercel.app/";
}

function keyFingerprint(key: string): string {
  return createHash("sha256").update(key).digest("hex").slice(0, 8);
}

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
const REQUEST_TIMEOUT_MS = 4000;
/** Fetch a wider pool, then label up to 3 (Best / Closest / Wildcard). */
const SEARCH_POOL_SIZE = 10;

function postJson(
  url: string,
  headers: Record<string, string>,
  payload: unknown,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const target = new URL(url);

    const req = httpsRequest(
      {
        hostname: target.hostname,
        path: target.pathname + target.search,
        method: "POST",
        headers: { ...headers, "Content-Length": Buffer.byteLength(data) },
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk: string) => {
          body += chunk;
        });
        res.on("end", () =>
          resolve({ status: res.statusCode ?? 0, body }),
        );
      },
    );

    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy(new Error("timeout"));
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

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

export async function GET(request: Request) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const { searchParams } = new URL(request.url);

  const food = CATALOG.find((f) => f.id === searchParams.get("foodId"));
  if (!food) {
    return NextResponse.json({ error: "Unknown food id" }, { status: 400 });
  }

  // Location resolution (lat/lng or city/ZIP). Keep this block at the top so
  // fieldMask / place mapping changes elsewhere can merge cleanly.
  let lat = parseCoordinate(searchParams.get("lat"), 90);
  let lng = parseCoordinate(searchParams.get("lng"), 180);
  const placeQuery =
    parsePlaceQuery(searchParams.get("q")) ??
    parsePlaceQuery(searchParams.get("location"));

  if (!apiKey) {
    return NextResponse.json({ places: [] });
  }

  if ((lat === null || lng === null) && placeQuery) {
    const geo = await geocodePlaceQuery(placeQuery, apiKey);
    if (!geo) {
      return NextResponse.json({ places: [], geoError: true });
    }
    lat = geo.lat;
    lng = geo.lng;
  }

  if (lat === null || lng === null) {
    return NextResponse.json({ places: [] });
  }

  try {
    const { status, body: text } = await postJson(
      PLACES_ENDPOINT,
      {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
        Referer: placesReferrer(),
      },
      {
        textQuery: `${food.name} restaurant`,
        locationBias: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: SEARCH_RADIUS_METRES,
          },
        },
        maxResultCount: SEARCH_POOL_SIZE,
      },
    );

    if (status !== 200) {
      console.warn(
        "[places] responded %d using key fingerprint %s (length %d)",
        status,
        keyFingerprint(apiKey),
        apiKey.length,
      );
      return NextResponse.json({ places: [] });
    }

    const body = JSON.parse(text) as PlacesResponse;

    const candidates: PlaceCandidate[] = (body.places ?? []).map((p) => {
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

    const places = selectLabeledPlaces(candidates);

    return NextResponse.json(
      { places, lat, lng },
      {
        headers: {
          "Cache-Control": "private, max-age=60",
        },
      },
    );
  } catch (err) {
    console.warn("[places] request failed", err);
    return NextResponse.json({ places: [] });
  }
}
