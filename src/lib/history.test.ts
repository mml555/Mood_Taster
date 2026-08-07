import { describe, expect, it } from "vitest";
import {
  appendHistoryLocal,
  clearHistoryLocal,
  parseHistoryEntries,
  setHistoryRatingLocal,
  writeHistory,
  HISTORY_CAP,
  type HistoryEntry,
} from "./history";
import type { Answers } from "./taste-types";

const answers: Answers = {
  intent: "restaurant",
  flavor: "savory",
  texture: "crunchy",
  heaviness: "medium",
  adventure: "curious",
  temperature: "any",
  cookEffort: "any",
};

function sample(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: overrides.id ?? "11111111-1111-4111-8111-111111111111",
    foodId: overrides.foodId ?? "birria-tacos",
    intent: overrides.intent ?? "restaurant",
    rating: overrides.rating ?? null,
    answers: overrides.answers ?? answers,
    place: overrides.place ?? null,
    createdAt: overrides.createdAt ?? "2026-08-06T12:00:00.000Z",
  };
}

describe("history", () => {
  it("parseHistoryEntries keeps newest first and drops junk", () => {
    const entries = parseHistoryEntries([
      sample({
        id: "older",
        createdAt: "2026-08-01T00:00:00.000Z",
      }),
      { foodId: "nope" },
      sample({
        id: "newer",
        foodId: "miso-soup",
        createdAt: "2026-08-05T00:00:00.000Z",
      }),
    ]);
    expect(entries.map((e) => e.id)).toEqual(["newer", "older"]);
  });

  it("appendHistoryLocal dedupes an open pick for the same food", () => {
    clearHistoryLocal();
    const first = appendHistoryLocal({
      foodId: "birria-tacos",
      intent: "restaurant",
      answers,
    });
    expect(first.entry).not.toBeNull();

    const second = appendHistoryLocal({
      foodId: "birria-tacos",
      intent: "restaurant",
      answers,
    });
    expect(second.entry).toBeNull();
    expect(second.state.entries).toHaveLength(1);
  });

  it("setHistoryRatingLocal updates the newest matching food", () => {
    clearHistoryLocal();
    appendHistoryLocal({
      foodId: "birria-tacos",
      intent: "restaurant",
      answers,
      dedupeOpen: false,
    });
    const { entry } = setHistoryRatingLocal("birria-tacos", "nailed");
    expect(entry?.rating).toBe("nailed");
  });

  it("caps stored entries", () => {
    clearHistoryLocal();
    const many: HistoryEntry[] = [];
    for (let i = 0; i < HISTORY_CAP + 5; i += 1) {
      many.push(
        sample({
          id: `id-${i}`,
          createdAt: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString(),
        }),
      );
    }
    writeHistory({ entries: many });
    const trimmed = parseHistoryEntries(many);
    expect(trimmed.length).toBe(HISTORY_CAP);
  });
});
