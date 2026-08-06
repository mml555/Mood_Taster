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
    "Match how you feel to what you should taste. Mood first — food, drink, and recipes that fit the moment.",
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
