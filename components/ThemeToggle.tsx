"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function readInitial(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("cadence-theme");
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(readInitial());
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("cadence-theme", next);
    } catch {
      /* private browsing */
    }
  };

  // Render a stable placeholder on first paint to avoid hydration mismatch;
  // the inline script in <head> has already set the correct theme class.
  if (!mounted) {
    return (
      <button
        aria-label="Toggle dark mode"
        className="h-9 w-9 rounded-md border flex items-center justify-center text-sm"
        style={{ borderColor: "var(--input-border)" }}
      >
        ◐
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className="h-9 w-9 rounded-md border flex items-center justify-center text-base hover:bg-stone-100 dark:hover:bg-stone-800"
      style={{ borderColor: "var(--input-border)" }}
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}
