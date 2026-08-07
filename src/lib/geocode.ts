import { requestJson } from "./http-json";

/**
 * Resolve a city or US ZIP to coordinates via Google Geocoding.
 * Reuses GOOGLE_PLACES_API_KEY (enable Geocoding API on that key).
 *
 * Soft-fails to null on any network, parse, or zero-result error.
 */

const GEOCODE_ENDPOINT = "https://maps.googleapis.com/maps/api/geocode/json";

type GeocodeResponse = {
  status?: string;
  results?: Array<{
    geometry?: { location?: { lat?: number; lng?: number } };
  }>;
};

export async function geocodePlaceQuery(
  query: string,
  apiKey: string,
): Promise<{ lat: number; lng: number } | null> {
  const url = `${GEOCODE_ENDPOINT}?address=${encodeURIComponent(query)}&key=${encodeURIComponent(apiKey)}`;

  try {
    const { status, data } = await requestJson<GeocodeResponse>(url, {
      method: "GET",
    });
    if (status !== 200 || data?.status !== "OK") return null;

    const loc = data.results?.[0]?.geometry?.location;
    if (typeof loc?.lat !== "number" || typeof loc?.lng !== "number") {
      return null;
    }
    return { lat: loc.lat, lng: loc.lng };
  } catch (err) {
    console.warn("[geocode] lookup failed", err);
    return null;
  }
}
