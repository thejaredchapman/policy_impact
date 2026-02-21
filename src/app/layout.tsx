import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GovLens",
  description:
    "Track U.S. policy changes with neutral, AP-style reporting and see how they affect you with personalized demographic impact analysis.",
  openGraph: {
    title: "GovLens",
    description:
      "Non-partisan policy tracking with personalized demographic impact ratings.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistMono.variable} font-mono bg-[var(--color-term-bg)] text-[var(--color-term-text)] min-h-screen flex flex-col`}
      >
        <ThemeProvider>
          {/* Terminal window chrome */}
          <div className="bg-[var(--color-term-bg-light)] border-b border-[var(--color-term-border)] px-4 py-2 flex items-center gap-2 text-sm shrink-0">
            <span className="text-[#ff5f56]">[&times;]</span>
            <span className="text-[#ffbd2e]">[&ndash;]</span>
            <span className="text-[#27c93f]">[&square;]</span>
            <span className="text-[var(--color-term-dim)] ml-2">govlens &mdash; bash</span>
          </div>
          <Header />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
