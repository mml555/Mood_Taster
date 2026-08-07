import { request as httpsRequest } from "node:https";

/**
 * Resolve a city or US ZIP to coordinates via Google Geocoding.
 * Reuses GOOGLE_PLACES_API_KEY (enable Geocoding API on that key).
 *
 * Soft-fails to null on any network, parse, or zero-result error.
 */

const GEOCODE_ENDPOINT = "https://maps.googleapis.com/maps/api/geocode/json";
const REQUEST_TIMEOUT_MS = 4000;

type GeocodeResponse = {
  status?: string;
  results?: Array<{
    geometry?: { location?: { lat?: number; lng?: number } };
  }>;
};

function getText(url: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const req = httpsRequest(
      {
        hostname: target.hostname,
        path: target.pathname + target.search,
        method: "GET",
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
    req.end();
  });
}

export async function geocodePlaceQuery(
  query: string,
  apiKey: string,
): Promise<{ lat: number; lng: number } | null> {
  const url = `${GEOCODE_ENDPOINT}?address=${encodeURIComponent(query)}&key=${encodeURIComponent(apiKey)}`;
  try {
    const { status, body } = await getText(url);
    if (status !== 200) return null;
    const parsed = JSON.parse(body) as GeocodeResponse;
    if (parsed.status !== "OK" || !parsed.results?.[0]) return null;
    const loc = parsed.results[0].geometry?.location;
    if (typeof loc?.lat !== "number" || typeof loc?.lng !== "number") {
      return null;
    }
    return { lat: loc.lat, lng: loc.lng };
  } catch {
    return null;
  }
}
