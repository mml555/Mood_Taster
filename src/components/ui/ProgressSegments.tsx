type ProgressSegmentsProps = {
  current: number;
  total: number;
  className?: string;
};

/** “n of m” plus segmented progress bar (quiz chrome). */
export function ProgressSegments({
  current,
  total,
  className = "",
}: ProgressSegmentsProps) {
  const safeTotal = Math.max(1, total);
  const safeCurrent = Math.min(Math.max(0, current), safeTotal);

  return (
    <div
      className={["quiz-progress", className].filter(Boolean).join(" ")}
      aria-live="polite"
    >
      <span className="quiz-progress-count">
        {safeCurrent} of {safeTotal}
      </span>
      <ol className="quiz-segments" aria-hidden>
        {Array.from({ length: safeTotal }, (_, i) => {
          const n = i + 1;
          const state =
            n < safeCurrent ? "is-done" : n === safeCurrent ? "is-current" : "";
          return (
            <li
              key={n}
              className={state ? `quiz-segment ${state}` : "quiz-segment"}
            />
          );
        })}
      </ol>
    </div>
  );
}
