"use client";

import { MapPin } from "lucide-react";
import { useState, type FormEvent } from "react";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import { PLACE_LABEL_COPY } from "@/lib/places-rank";
import { mapsSearchUrl } from "@/lib/places-prefetch";
import type { Food, NearbyPlace } from "@/lib/taste-types";

export type PlacesState = "locating" | "loading" | "ready" | "fallback";

function placeMeta(p: NearbyPlace): string {
  return [
    p.miles !== null ? `${p.miles.toFixed(1)} mi` : null,
    p.rating !== null ? p.rating.toFixed(1) : null,
    p.price,
    p.openNow === true ? "Open" : p.openNow === false ? "Closed" : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function PlaceCard({ place }: { place: NearbyPlace }) {
  const label = place.label ? PLACE_LABEL_COPY[place.label] : null;
  const meta = placeMeta(place);

  const onPlaceClick = () => {
    track(ANALYTICS_EVENTS.placesClick, {
      has_maps: Boolean(place.mapsUri),
      label: place.label ?? "none",
      open_now: place.openNow ?? "unknown",
    });
  };

  const body = (
    <>
      <span className="nearby-place-icon" aria-hidden>
        <MapPin size={20} strokeWidth={1.5} />
      </span>
      <span className="nearby-place-body">
        {label ? (
          <span
            className={`nearby-role${place.label === "best" ? " is-best" : ""}`}
          >
            {label}
          </span>
        ) : null}
        <span className="nearby-head">
          <span className="nearby-name">{place.name}</span>
          {meta ? <span className="nearby-meta">{meta}</span> : null}
        </span>
        <span className="nearby-address">{place.address}</span>
        {place.mapsUri ? (
          <span className="nearby-directions">Directions</span>
        ) : null}
      </span>
    </>
  );

  if (place.mapsUri) {
    return (
      <a
        className="nearby-place"
        href={place.mapsUri}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onPlaceClick}
      >
        {body}
      </a>
    );
  }

  return <span className="nearby-place is-static">{body}</span>;
}

export function NearbySection({
  food,
  places,
  state,
  onSearchLocation,
  locationError,
}: {
  food: Food;
  places: NearbyPlace[];
  state: PlacesState;
  onSearchLocation?: (query: string) => void;
  locationError?: string | null;
}) {
  const [query, setQuery] = useState("");

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
        {state === "locating" && onSearchLocation ? (
          <button
            type="button"
            className="text-link nearby-change-place"
            onClick={() => onSearchLocation("")}
          >
            Enter a city instead
          </button>
        ) : null}
      </div>
    );
  }

  if (state !== "ready" || places.length === 0) {
    const onSubmit = (e: FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (!trimmed || !onSearchLocation) return;
      onSearchLocation(trimmed);
    };

    return (
      <div className="nearby">
        <p className="nearby-label">
          <MapPin size={16} strokeWidth={1.5} aria-hidden />
          Nearby
        </p>
        <p className="nearby-status">
          Location off or unavailable. Enter a city or ZIP.
        </p>
        {onSearchLocation ? (
          <form className="nearby-manual" onSubmit={onSubmit}>
            <label className="visually-hidden" htmlFor="nearby-place-query">
              City or ZIP
            </label>
            <input
              id="nearby-place-query"
              className="reject-input"
              type="text"
              inputMode="text"
              autoComplete="postal-code"
              maxLength={80}
              placeholder="City or ZIP"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="cta" disabled={!query.trim()}>
              Find nearby
            </button>
          </form>
        ) : null}
        {locationError ? (
          <p className="nearby-error" role="alert">
            {locationError}
          </p>
        ) : null}
        <a
          className="nearby-link"
          href={mapsSearchUrl(food)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            track(ANALYTICS_EVENTS.placesClick, {
              has_maps: true,
              label: "maps_fallback",
              food_id: food.id,
            })
          }
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
            <PlaceCard place={p} />
          </li>
        ))}
      </ul>
      {onSearchLocation ? (
        <button
          type="button"
          className="text-link nearby-change-place"
          onClick={() => {
            setQuery("");
            onSearchLocation("");
          }}
        >
          Change place
        </button>
      ) : null}
    </div>
  );
}
