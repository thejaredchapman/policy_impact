"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

const navItems = [
  { href: "/", label: "~/dashboard", short: "dashboard" },
  { href: "/changes", label: "~/changes", short: "changes" },
  { href: "/impact", label: "~/impact", short: "impact" },
  { href: "/upcoming", label: "~/upcoming", short: "upcoming" },
  { href: "/api-docs", label: "~/api", short: "api" },
];

function getRouteLabel(pathname: string): string {
  if (pathname === "/") return "~/dashboard";
  if (pathname.startsWith("/changes")) return "~/changes";
  if (pathname.startsWith("/impact")) return "~/impact";
  if (pathname.startsWith("/upcoming")) return "~/upcoming";
  if (pathname.startsWith("/api-docs")) return "~/api";
  return "~";
}

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const currentRoute = getRouteLabel(pathname);

  return (
    <header className="border-b border-[var(--color-term-border)] sticky top-0 z-50 bg-[var(--color-term-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <span className="text-[var(--color-term-heading)] font-bold text-base">
              user@policypulse<span className="text-[var(--color-term-dim)]">:</span>{currentRoute}<span className="text-[var(--color-term-dim)]"> $</span>
            </span>
            <span className="cursor-blink text-[var(--color-term-heading)]">_</span>
          </div>

          <div className="flex items-center gap-2">
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 text-base transition-colors ${
                      isActive
                        ? "text-[var(--color-term-heading)] border border-[var(--color-term-heading)]"
                        : "text-[var(--color-term-dim)] hover:text-[var(--color-term-text)] border border-transparent"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={toggleTheme}
              className="px-2 py-1.5 text-sm border border-[var(--color-term-border)] text-[var(--color-term-dim)] hover:text-[var(--color-term-heading)] hover:border-[var(--color-term-heading)] transition-colors"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? "[light]" : "[dark]"}
            </button>

            <button
              className="md:hidden p-2 text-[var(--color-term-heading)]"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? "[close]" : "[menu]"}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="md:hidden pb-4 space-y-1 border-t border-[var(--color-term-border)] pt-2">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-1.5 text-base ${
                    isActive
                      ? "text-[var(--color-term-heading)]"
                      : "text-[var(--color-term-dim)] hover:text-[var(--color-term-text)]"
                  }`}
                >
                  &gt; cd {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
