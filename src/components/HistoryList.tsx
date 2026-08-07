"use client";

import Link from "next/link";
import { Clock, RotateCcw, Utensils } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRankFoodById } from "@/lib/catalog-data";
import {
  intentLabel,
  ratingLabel,
  type HistoryEntry,
  type HistoryFilter,
} from "@/lib/history";
import { loadHistoryForUser } from "@/lib/history-sync";
import { emptySession, writeSession } from "@/lib/session";

type HistoryItem = {
  entry: HistoryEntry;
  name: string;
};

const FILTERS: { id: HistoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "nailed", label: "Loved" },
  { id: "kinda", label: "Kinda" },
  { id: "nope", label: "Nope" },
  { id: "restaurant", label: "Restaurants" },
  { id: "recipe", label: "Recipes" },
  { id: "snack", label: "Snacks" },
];

function resolveItems(entries: HistoryEntry[]): HistoryItem[] {
  const items: HistoryItem[] = [];
  for (const entry of entries) {
    const food = getRankFoodById(entry.foodId);
    if (!food) continue;
    items.push({ entry, name: food.name });
  }
  return items;
}

function formatWhen(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(new Date(t));
  } catch {
    return "";
  }
}

export function HistoryList() {
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [filter, setFilter] = useState<HistoryFilter>("all");

  useEffect(() => {
    queueMicrotask(async () => {
      const loaded = await loadHistoryForUser();
      setItems(resolveItems(loaded.entries));
    });
  }, []);

  const visible = !items
    ? null
    : filter === "all"
      ? items
      : items.filter(({ entry }) => {
          if (filter === "nailed" || filter === "kinda" || filter === "nope") {
            return entry.rating === filter;
          }
          return entry.intent === filter;
        });

  const onFindAgain = useCallback(
    (entry: HistoryEntry) => {
      if (entry.answers) {
        writeSession({
          ...emptySession(entry.answers),
          servedIds: [entry.foodId],
        });
      }
      router.push(`/result/${entry.foodId}`);
    },
    [router],
  );

  if (items === null || visible === null) {
    return (
      <section className="favorites" aria-busy="true" aria-label="Loading History">
        <p className="eyebrow">Past picks</p>
        <div className="skeleton-block" style={{ width: "140px", height: "32px", marginBottom: "16px" }} />
        <div className="skeleton-card" style={{ height: "80px" }} />
        <div className="skeleton-card" style={{ height: "80px" }} />
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="favorites">
        <p className="eyebrow">
          <Clock size={16} strokeWidth={1.5} aria-hidden /> Past picks
        </p>
        <h1 className="dna-title">No history yet</h1>
        <p className="dna-lede">
          Finish a craving. Your picks show up here so you can find them again.
        </p>
        <div className="result-actions">
          <Link className="cta" href="/taste">
            <Utensils size={20} strokeWidth={1.5} aria-hidden />
            Show me
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="favorites">
      <p className="eyebrow">
        <Clock size={16} strokeWidth={1.5} aria-hidden /> Past picks
      </p>
      <h1 className="dna-title">History</h1>
      <p className="dna-lede">
        Reopen a pick. Same craving when we still have it.
      </p>

      <ul className="feedback-chips history-filters" aria-label="Filter history">
        {FILTERS.map((f) => (
          <li key={f.id}>
            <button
              type="button"
              className={`feedback-chip${filter === f.id ? " is-selected" : ""}`}
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          </li>
        ))}
      </ul>

      {visible.length === 0 ? (
        <p className="dna-lede history-empty-filter">
          Nothing in this filter. Try All.
        </p>
      ) : (
        <ul className="favorites-list history-list">
          {visible.map(({ entry, name }) => {
            const when = formatWhen(entry.createdAt);
            const rated = ratingLabel(entry.rating);
            const mode = intentLabel(entry.intent);
            const meta = [mode, rated, when].filter(Boolean).join(" · ");
            return (
              <li key={entry.id} className="favorites-item">
                <div className="favorites-item-main">
                  <Link
                    className="favorites-item-link"
                    href={`/result/${entry.foodId}`}
                  >
                    {name}
                  </Link>
                  {meta ? (
                    <p className="favorites-item-meta">{meta}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="cta-secondary favorites-unsave"
                  onClick={() => onFindAgain(entry)}
                  aria-label={`Find ${name} again`}
                >
                  <RotateCcw size={16} strokeWidth={1.5} aria-hidden />
                  Find again
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="result-actions">
        <Link className="cta" href="/taste">
          <Utensils size={20} strokeWidth={1.5} aria-hidden />
          New craving
        </Link>
      </div>
    </section>
  );
}
