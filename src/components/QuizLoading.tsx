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
 * Full-screen interstitial between the last quiz tap and the result.
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
    <section
      className="quiz-loading quiz-loading-screen"
      aria-live="polite"
      aria-busy="true"
      aria-label="Finding your match"
    >
      <div className="quiz-loading-brand quiz-loading-mark-pulse">
        <Image
          className="quiz-loading-mark"
          src="/brand/mark-purple.png"
          alt=""
          width={72}
          height={72}
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
