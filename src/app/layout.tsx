import type { Metadata } from "next";
import { Comfortaa } from "next/font/google";
import { Grain } from "@/components/Grain";
import { siteOrigin } from "@/lib/site-url";
import "./globals.css";

const comfortaa = Comfortaa({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-comfortaa",
  display: "swap",
});

const DESCRIPTION =
  "Figure out what you actually want to eat in under 30 seconds. A few questions about your mood, then one specific pick. Not another endless menu.";

export const metadata: Metadata = {
  // Without metadataBase every relative og:image and canonical resolves against
  // localhost at build time, so shared links render without a card.
  metadataBase: new URL(siteOrigin()),
  title: {
    default: "Mood Taster",
    template: "%s · Mood Taster",
  },
  description: DESCRIPTION,
  applicationName: "Mood Taster",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Mood Taster",
    title: "Mood Taster",
    description: DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mood Taster",
    description: DESCRIPTION,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#fdfaff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={comfortaa.variable}>
      <body>
        <Grain />
        {children}
      </body>
    </html>
  );
}
