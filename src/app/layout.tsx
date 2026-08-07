import type { Metadata } from "next";
import { Comfortaa } from "next/font/google";
import { AuthSessionProvider } from "@/components/AuthSessionProvider";
import { Grain } from "@/components/Grain";
import "./globals.css";

const comfortaa = Comfortaa({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-comfortaa",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Mood Taster",
    template: "%s · Mood Taster",
  },
  description:
    "Figure out what you actually want to eat in under 30 seconds. A few questions about your mood, then one specific pick. Not another endless menu.",
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
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
