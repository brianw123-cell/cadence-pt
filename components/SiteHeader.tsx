"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/referrals", label: "Referrals" },
  { href: "/physicians", label: "Physicians" },
  { href: "/patients", label: "Patients" },
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
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="h-7 w-7 rounded bg-teal-700 flex items-center justify-center text-white text-sm font-bold">
            C
          </div>
          <div>
            <div className="font-bold text-teal-800 dark:text-teal-300 leading-none">Cadence PT</div>
            <div className="text-[10px] leading-none mt-0.5 hidden sm:block" style={{ color: "var(--subtle)" }}>
              Referral lifecycle + RTM
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
