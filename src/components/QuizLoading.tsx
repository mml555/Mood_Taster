"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const MESSAGES = [
  "Tasting your mood...",
  "Checking the cravings...",
  "Finding your match...",
  "Almost ready to eat...",
] as const;

/**
 * Brief interstitial between the last quiz tap and the result.
 * Message rotates. No looping logo motion (design system: rise only).
 */
export function QuizLoading() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="quiz-loading" aria-live="polite" aria-busy="true">
      <div className="quiz-loading-brand">
        <Image
          className="quiz-loading-mark"
          src="/brand/mark-purple.png"
          alt=""
          width={64}
          height={64}
          priority
        />
        <p className="quiz-loading-wordmark">mood taster</p>
      </div>
      <p className="quiz-loading-msg" key={MESSAGES[msgIndex]}>
        {MESSAGES[msgIndex]}
      </p>
    </section>
  );
}
