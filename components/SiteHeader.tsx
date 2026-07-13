"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/schedule", label: "Schedule" },
  { href: "/referrals", label: "Referrals" },
  { href: "/patients", label: "Patients" },
  { href: "/followups", label: "Follow-ups" },
  { href: "/waitlist", label: "Waitlist" },
  { href: "/physicians", label: "Physicians" },
  { href: "/rtm", label: "RTM" },
  { href: "/outcomes", label: "Outcomes" },
  { href: "/billing", label: "Billing" },
  { href: "/money", label: "Money" },
  { href: "/forecast", label: "Forecast" },
  { href: "/denials", label: "Denials" },
  { href: "/patient-app", label: "Patient app" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="border-b" style={{ background: "var(--header-bg)", borderColor: "var(--header-border)" }}>
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0" aria-label="Cadence PT home">
          {/* Stride brand mark — two overlapping "step" shapes on a sandstone tile */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="flex-shrink-0"
          >
            <rect x="0" y="0" width="100" height="100" rx="22" ry="22" fill="#ebd4b8" />
            <ellipse cx="38" cy="60" rx="15" ry="24" fill="#2e2620" transform="rotate(-14 38 60)" />
            <ellipse cx="62" cy="42" rx="15" ry="24" fill="#b45640" transform="rotate(12 62 42)" />
          </svg>
          <div>
            <div className="font-bold leading-none" style={{ color: "#2e2620" }}>
              <span className="dark:text-stone-50">Cadence PT</span>
            </div>
            <div
              className="text-[10px] leading-none mt-0.5 hidden sm:block font-semibold tracking-widest uppercase"
              style={{ color: "#b45640" }}
            >
              Physical Therapy
            </div>
          </div>
        </Link>

        {/* Desktop nav — visible at lg+ where there's room for all 11 items */}
        <nav aria-label="Primary" className="hidden lg:flex gap-0.5 flex-wrap">
          {links.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`px-2.5 py-2 text-sm font-medium rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 ${
                  active
                    ? "bg-teal-50 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200"
                    : "text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>Demo Clinic</span>
          <ThemeToggle />
        </div>

        {/* Mobile theme toggle (sits next to the hamburger) */}
        <div className="lg:hidden flex items-center gap-2">
          <ThemeToggle />
        {/* Mobile + tablet hamburger button */}
        <button
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="flex items-center justify-center h-9 w-9 rounded-md border hover:bg-stone-100 dark:hover:bg-stone-800"
          style={{ borderColor: "var(--input-border)" }}
        >
          <span className="sr-only">Menu</span>
          <div className="flex flex-col gap-1">
            <span className={`block w-4 h-0.5 bg-stone-700 transition ${open ? "rotate-45 translate-y-1.5" : ""}`} />
            <span className={`block w-4 h-0.5 bg-stone-700 transition ${open ? "opacity-0" : ""}`} />
            <span className={`block w-4 h-0.5 bg-stone-700 transition ${open ? "-rotate-45 -translate-y-1.5" : ""}`} />
          </div>
        </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <nav aria-label="Mobile primary" className="lg:hidden border-t" style={{ background: "var(--header-bg)", borderColor: "var(--header-border)" }}>
          <div className="mx-auto max-w-7xl px-4 py-2 grid grid-cols-2 gap-1">
            {links.map((l) => {
              const active = isActive(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`px-3 py-2.5 text-sm font-medium rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
                    active
                      ? "bg-teal-50 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200"
                      : "text-stone-700 hover:bg-stone-50 dark:text-stone-200 dark:hover:bg-stone-800"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
