import { ImageResponse } from "next/og";

/**
 * The share card. Generated rather than checked in as a PNG so the copy stays
 * editable in one place, and rendered with the default font so the build never
 * depends on a network fetch.
 *
 * Flat fills only, per the design system: Ghost White canvas, Indigo type, one
 * Royal Gold rule. No gradients.
 */

export const alt =
  "Mood Taster. Tell us your mood, get one specific thing to eat.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#fdfaff";
const INK = "#510c85";
const ACCENT = "#ffdf6e";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: PAPER,
          color: INK,
          padding: "88px 96px",
        }}
      >
        <div
          style={{
            fontSize: 30,
            letterSpacing: 6,
            textTransform: "uppercase",
            opacity: 0.75,
          }}
        >
          Mood Taster
        </div>
        <div
          style={{
            width: 132,
            height: 12,
            background: ACCENT,
            borderRadius: 6,
            margin: "28px 0 40px",
          }}
        />
        <div style={{ fontSize: 82, fontWeight: 700, lineHeight: 1.1 }}>
          Stop scrolling menus.
        </div>
        <div style={{ fontSize: 82, fontWeight: 700, lineHeight: 1.1 }}>
          Start with your mood.
        </div>
        <div style={{ fontSize: 34, marginTop: 40, opacity: 0.72 }}>
          A few questions, then one specific pick.
        </div>
      </div>
    ),
    size,
  );
}
