import type { Metadata } from "next";
import { Fraunces, Sora } from "next/font/google";
import { Grain } from "@/components/Grain";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Mood Taster",
    template: "%s — Mood Taster",
  },
  description:
    "Figure out what you actually want to eat in under 30 seconds. A few questions about your mood, then one specific pick — not another endless menu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${sora.variable}`}>
      <body>
        <Grain />
        {children}
      </body>
    </html>
  );
}
