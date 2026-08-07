"use client";

import Link from "next/link";
import { Check, Compass, Sparkles, Utensils } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  applyQuestExperience,
  formatDnaChangeLine,
  labelDimension,
  readDna,
  underexploredDimensions,
  type DnaDelta,
} from "@/lib/dna";
import { loadDnaForUser, persistDna } from "@/lib/dna-sync";
import { foodIdForCuisine, unexploredCuisines } from "@/lib/cuisines";
import {
  loadGamificationForUser,
  persistGamification,
} from "@/lib/gamification-sync";
import {
  applyQuickBite,
  nextQuickBite,
  type QuickBite,
} from "@/lib/quick-bites";
import {
  activeOrAvailableQuest,
  completeQuest,
  ensureTodaysQuest,
  readQuests,
  recentCompletedQuests,
  startQuest,
  type TasteQuest,
} from "@/lib/quests";
import {
  confirmPassportExperience,
  passportProgress,
  readPassport,
  stampedCuisineSet,
  type PassportState,
} from "@/lib/passport";
import {
  formatStreak,
  recordMeaningfulAction,
  type StreakState,
} from "@/lib/streak";
import {
  awardXp,
  overallTasteLabel,
  QUEST_XP,
  QUICK_BITE_XP,
  readXp,
  writeXp,
  type XpState,
} from "@/lib/xp";
import type { DnaDimension, DnaProfile } from "@/lib/taste-types";

const QB_ANSWERED_KEY = "mood-taster-qb-answered";

function readAnsweredQb(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(QB_ANSWERED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function writeAnsweredQb(ids: Set<string>) {
  sessionStorage.setItem(QB_ANSWERED_KEY, JSON.stringify([...ids]));
}

export function ExploreDashboard() {
  const [dna, setDna] = useState<DnaProfile | null>(null);
  const [quest, setQuest] = useState<TasteQuest | null>(null);
  const [bite, setBite] = useState<QuickBite | null>(null);
  const [passport, setPassport] = useState<PassportState | null>(null);
  const [streak, setStreak] = useState<StreakState | null>(null);
  const [xp, setXp] = useState<XpState | null>(null);
  const [biteNote, setBiteNote] = useState<string | null>(null);
  const [questNote, setQuestNote] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<string[]>([]);

  const refreshBite = useCallback((profile: DnaProfile) => {
    const answered = readAnsweredQb();
    setBite(nextQuickBite(profile, answered));
  }, []);

  useEffect(() => {
    queueMicrotask(async () => {
      const [loaded, progress] = await Promise.all([
        loadDnaForUser(),
        loadGamificationForUser(),
      ]);
      setDna(loaded);
      setPassport(progress.passport);
      const quests = ensureTodaysQuest(
        progress.quests,
        loaded,
        progress.passport,
      );
      if (quests !== progress.quests) {
        void persistGamification();
      }
      setQuest(activeOrAvailableQuest(quests));
      setStreak(progress.streak);
      setXp(progress.xp);
      refreshBite(loaded);
      const done = recentCompletedQuests(quests, 3).map((q) => q.title);
      const stamps = progress.passport.stamps
        .slice(-2)
        .map((s) => `${s.cuisine} stamp`);
      setAchievements([...done, ...stamps].slice(0, 4));
    });
  }, [refreshBite]);

  const onStartQuest = useCallback(() => {
    if (!quest) return;
    const next = startQuest(readQuests(), quest.id);
    setQuest(activeOrAvailableQuest(next));
    void persistGamification();
  }, [quest]);

  const onCompleteQuest = useCallback(() => {
    if (!quest) return;
    const { state, quest: done } = completeQuest(readQuests(), quest.id);
    if (!done) return;

    let profile = readDna();
    let deltas: DnaDelta[] = [];
    if (done.targetDimension) {
      const applied = applyQuestExperience(profile, done.targetDimension);
      profile = applied.dna;
      deltas = applied.deltas;
      void persistDna(profile);
      setDna(profile);

      const xpNext = awardXp(
        readXp(),
        [done.targetDimension],
        QUEST_XP,
      ).state;
      writeXp(xpNext);
      setXp(xpNext);
    }

    if (done.targetCuisine) {
      const foodId = foodIdForCuisine(done.targetCuisine);
      if (foodId) {
        const { state: pass } = confirmPassportExperience(readPassport(), {
          foodId,
          foodName: `${done.targetCuisine} dish`,
          matchScore: 0.7,
        });
        setPassport(pass);
      }
    }

    setQuestNote(
      deltas.length
        ? formatDnaChangeLine(deltas)
        : "Quest done. Keep exploring.",
    );
    setStreak(recordMeaningfulAction());
    const refreshed = ensureTodaysQuest(state, profile, readPassport());
    setQuest(activeOrAvailableQuest(refreshed));
    setAchievements((prev) => [done.title, ...prev].slice(0, 4));
    void persistGamification();
  }, [quest]);

  const onQuickBite = useCallback(
    (chosen: DnaDimension) => {
      if (!bite || !dna) return;
      const { dna: next, deltas } = applyQuickBite(dna, bite, chosen);
      void persistDna(next);
      setDna(next);

      const xpNext = awardXp(readXp(), [chosen], QUICK_BITE_XP).state;
      writeXp(xpNext);
      setXp(xpNext);

      const answered = readAnsweredQb();
      answered.add(bite.id);
      writeAnsweredQb(answered);
      setBiteNote(formatDnaChangeLine(deltas));
      setStreak(recordMeaningfulAction());
      refreshBite(next);
      void persistGamification();
    },
    [bite, dna, refreshBite],
  );

  if (!dna || !passport || !streak || !xp) {
    return (
      <section className="explore" aria-busy="true" aria-label="Loading Explore">
        <p className="eyebrow">Explore</p>
        <div className="skeleton-block" style={{ width: "160px", height: "32px", marginBottom: "16px" }} />
        <div className="skeleton-card" style={{ height: "140px" }} />
        <div className="skeleton-card" style={{ height: "180px" }} />
      </section>
    );
  }

  const develop = underexploredDimensions(dna, 1)[0];
  const progress = passportProgress(passport);
  const missing = unexploredCuisines(stampedCuisineSet(passport), 3);
  const level = overallTasteLabel(xp);

  return (
    <section className="explore">
      <p className="eyebrow">
        <Compass size={16} strokeWidth={1.5} aria-hidden /> Explore
      </p>
      <h1 className="dna-title">Explore</h1>
      <p className="dna-lede">
        {level}. {formatStreak(streak)}.
      </p>

      <div className="explore-grid">
        <div className="explore-main-col">
          <aside className="explore-block callout" aria-labelledby="quest-title">
            <p className="callout-label" id="quest-title">
              Today&apos;s quest
            </p>
            {quest ? (
              <>
                <h2 className="explore-block-title">{quest.title}</h2>
                <p>{quest.description}</p>
                {questNote ? <p className="explore-note">{questNote}</p> : null}
                <div className="result-actions">
                  {quest.status === "available" ? (
                    <button
                      type="button"
                      className="cta"
                      onClick={onStartQuest}
                    >
                      Start
                    </button>
                  ) : null}
                  {quest.status === "active" || quest.status === "available" ? (
                    <button
                      type="button"
                      className="cta-secondary"
                      onClick={onCompleteQuest}
                    >
                      <Check size={20} strokeWidth={1.5} aria-hidden />
                      I did it
                    </button>
                  ) : null}
                  <Link className="cta-highlight" href="/taste">
                    <Utensils size={20} strokeWidth={1.5} aria-hidden />
                    Find a dish
                  </Link>
                </div>
              </>
            ) : (
              <p>No quest right now. Rate a dish to unlock one.</p>
            )}
          </aside>

          {develop ? (
            <aside
              className="explore-block callout"
              aria-labelledby="develop-explore-title"
            >
              <p className="callout-label" id="develop-explore-title">
                Develop your taste
              </p>
              <p>
                You like{" "}
                <strong>{labelDimension(develop.dimension)}</strong>. Start a
                quest to live it.
              </p>
              <div className="result-actions">
                <Link className="cta-highlight" href="#quest-title">
                  Start a Taste Quest
                </Link>
              </div>
            </aside>
          ) : null}

          <aside className="explore-block callout" aria-labelledby="qb-title">
            <p className="callout-label" id="qb-title">
              Quick Bite
            </p>
            {bite ? (
              <>
                <h2 className="explore-block-title">Which do you prefer?</h2>
                {biteNote ? <p className="explore-note">{biteNote}</p> : null}
                <ul className="quiz-options quiz-options-stack" role="list">
                  <li>
                    <button
                      type="button"
                      className="quiz-option"
                      onClick={() => onQuickBite(bite.left.dimension)}
                    >
                      <span className="quiz-option-label">{bite.left.label}</span>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="quiz-option"
                      onClick={() => onQuickBite(bite.right.dimension)}
                    >
                      <span className="quiz-option-label">{bite.right.label}</span>
                    </button>
                  </li>
                </ul>
              </>
            ) : (
              <p>You&apos;re caught up. Rate dishes to open new gaps.</p>
            )}
          </aside>
        </div>

        <div className="explore-side-col">
          <div className="explore-block">
            <h2 className="dna-heading">Passport progress</h2>
            <p className="dna-discovery">
              <span className="dna-discovery-value">
                {progress.explored}
              </span>{" "}
              / {progress.total} cuisines
            </p>
            {missing.length > 0 ? (
              <p className="dna-lede">Still open: {missing.join(", ")}.</p>
            ) : (
              <p className="dna-lede">Every cuisine stamped. Nice.</p>
            )}
            <div className="result-actions">
              <Link className="cta-secondary" href="/passport">
                Open passport
              </Link>
            </div>
          </div>

          {achievements.length > 0 ? (
            <div className="explore-block">
              <h2 className="dna-heading">Recent achievements</h2>
              <ul className="dna-list">
                {achievements.map((line) => (
                  <li key={line}>
                    <span className="dna-dim">
                      <Sparkles size={20} strokeWidth={1.5} aria-hidden />
                      {line}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

