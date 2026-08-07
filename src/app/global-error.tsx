"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * Last-resort boundary for a failure in the root layout itself. It replaces
 * the layout, so it has to supply its own html and body.
 *
 * Deliberately dependency-free: no shared header, footer, or analytics import,
 * since anything the root layout pulls in is a candidate for what just failed.
 * Styling is inline for the same reason.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] root layout error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main
          style={{
            maxWidth: "34rem",
            margin: "0 auto",
            padding: "4rem 1.5rem",
            fontFamily: "system-ui, sans-serif",
            color: "#2c2a4a",
          }}
        >
          <p
            style={{
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontSize: "0.75rem",
              margin: "0 0 0.5rem",
            }}
          >
            Something broke
          </p>
          <h1 style={{ fontSize: "1.75rem", margin: "0 0 0.75rem" }}>
            Mood Taster could not start
          </h1>
          <p style={{ lineHeight: 1.6, margin: "0 0 1.5rem" }}>
            Reloading usually clears this. Nothing you saved has been lost.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#2c2a4a",
              color: "#fdfaff",
              border: "none",
              borderRadius: "0.75rem",
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Reload
          </button>
          {error.digest ? (
            <p style={{ marginTop: "1.5rem", fontSize: "0.8rem" }}>
              Reference: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
