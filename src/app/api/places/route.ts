import { createHash } from "node:crypto";
import { request as httpsRequest } from "node:https";
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

// Keeping the mask tight matters: Places bills by the fields requested.
const FIELD_MASK = [
  "places.displayName",
  "places.formattedAddress",
  "places.rating",
  "places.googleMapsUri",
  "places.location",
].join(",");

const SEARCH_RADIUS_METRES = 8000;

const REQUEST_TIMEOUT_MS = 4000;

/**
 * node:https rather than fetch, so the request goes out with exactly the
 * headers set here and nothing added or normalised on the way. The referrer is
 * what satisfies this key's restriction, so it has to survive verbatim.
 */
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

  try {
    const { status, body: text } = await postJson(
      ENDPOINT,
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
        maxResultCount: 3,
      },
    );

    if (status !== 200) {
      // 403 here is almost always the key, not the request. A fingerprint tells
      // which key is loaded, so a shell-exported key shadowing .env is still
      // visible, without writing key material into the log.
      console.warn(
        "[places] responded %d using key fingerprint %s (length %d)",
        status,
        keyFingerprint(apiKey),
        apiKey.length,
      );
      return NextResponse.json({ places: [] });
    }

    const body = JSON.parse(text) as PlacesResponse;

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
    console.warn("[places] request failed", err);
    return NextResponse.json({ places: [] });
  }
}
