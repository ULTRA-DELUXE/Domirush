import type { Metadata, Viewport } from "next";
import { Bokor, Source_Serif_4 } from "next/font/google";
import "../styles/globals.css";

// §5.3 — exactly two families: Bokor for display, one serif for everything else.
const bokor = Bokor({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bokor",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Domirush",
  description:
    "Bridge two points on an 8×8 grid with domino tiles. Solve five, ten, or fifteen puzzles back to back against the clock.",
};

export const viewport: Viewport = {
  themeColor: "#1c4286",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bokor.variable} ${sourceSerif.variable}`}>
      <body className="min-h-dvh bg-navy text-cream antialiased">{children}</body>
    </html>
  );
}
