// © 2026 Nahid Hasan Rayan. All rights reserved.

import type { Metadata } from "next";
import { Instrument_Serif, Onest, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const onest = Onest({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "InternSage — verified internship matching for Malaysia",
  description: "Explainable, verified internship matching for students, recruiters, and universities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${onest.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper-50 text-ink-900" style={{ fontFamily: "var(--font-ui)" }}>
        {children}
      </body>
    </html>
  );
}
