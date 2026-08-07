import type { MetadataRoute } from "next";

/**
 * Web app manifest. The product promise is "works on mobile with no install",
 * so this exists to let someone who uses it often keep it on a home screen,
 * not to push an install prompt.
 *
 * start_url points at /taste rather than /: a returning user opening from the
 * home screen is there to decide what to eat, not to read the pitch.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mood Taster",
    short_name: "Mood Taster",
    description:
      "Tell us your mood, get one specific thing to eat. No endless menus.",
    start_url: "/taste",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fdfaff",
    theme_color: "#fdfaff",
    categories: ["food", "lifestyle"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
