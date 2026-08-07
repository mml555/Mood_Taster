"use client";

import { MapPin } from "lucide-react";
import { mapsSearchUrl } from "@/lib/places-prefetch";
import type { Food, NearbyPlace } from "@/lib/taste-types";

export type PlacesState = "locating" | "loading" | "ready" | "fallback";

export function NearbySection({
  food,
  places,
  state,
}: {
  food: Food;
  places: NearbyPlace[];
  state: PlacesState;
}) {
  if (state === "locating" || state === "loading") {
    return (
      <div className="nearby">
        <p className="nearby-label">
          <MapPin size={16} strokeWidth={1.5} aria-hidden />
          Nearby
        </p>
        <p className="nearby-status" role="status">
          {state === "locating" ? "Finding you" : "Looking nearby"}
        </p>
      </div>
    );
  }

  // One slot, two outcomes. The fallback link is why a denied location or a
  // quota error never leaves a dead region on the page.
  if (state !== "ready" || places.length === 0) {
    return (
      <div className="nearby">
        <p className="nearby-label">
          <MapPin size={16} strokeWidth={1.5} aria-hidden />
          Nearby
        </p>
        <a
          className="nearby-link"
          href={mapsSearchUrl(food)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MapPin size={20} strokeWidth={1.5} aria-hidden />
          Search maps for {food.name}
        </a>
      </div>
    );
  }

  return (
    <div className="nearby">
      <p className="nearby-label">
        <MapPin size={16} strokeWidth={1.5} aria-hidden />
        Nearby
      </p>
      <ul className="nearby-list">
        {places.map((p) => (
          <li key={`${p.name}-${p.address}`}>
            {p.mapsUri ? (
              <a
                className="nearby-place"
                href={p.mapsUri}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="nearby-place-icon" aria-hidden>
                  <MapPin size={20} strokeWidth={1.5} />
                </span>
                <span className="nearby-place-body">
                  <span className="nearby-head">
                    <span className="nearby-name">{p.name}</span>
                    <span className="nearby-meta">
                      {[
                        p.miles !== null ? `${p.miles.toFixed(1)} mi` : null,
                        p.rating !== null ? p.rating.toFixed(1) : null,
                      ]
                        .filter(Boolean)
                        .join(" / ")}
                    </span>
                  </span>
                  <span className="nearby-address">{p.address}</span>
                </span>
              </a>
            ) : (
              <span className="nearby-place is-static">
                <span className="nearby-place-icon" aria-hidden>
                  <MapPin size={20} strokeWidth={1.5} />
                </span>
                <span className="nearby-place-body">
                  <span className="nearby-head">
                    <span className="nearby-name">{p.name}</span>
                    <span className="nearby-meta">
                      {[
                        p.miles !== null ? `${p.miles.toFixed(1)} mi` : null,
                        p.rating !== null ? p.rating.toFixed(1) : null,
                      ]
                        .filter(Boolean)
                        .join(" / ")}
                    </span>
                  </span>
                  <span className="nearby-address">{p.address}</span>
                </span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
