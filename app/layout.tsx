import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import DemoBanner from "@/components/DemoBanner";
import StorageHealthCheck from "@/components/StorageHealthCheck";
import SupabaseBoot from "@/components/SupabaseBoot";
import Toaster from "@/components/Toaster";

// No-FOUC: set the theme class on <html> before paint to prevent a light→dark flash.
const themeInit = `
try {
  var t = localStorage.getItem('cadence-theme');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (t === 'dark' || (!t && prefersDark)) document.documentElement.classList.add('dark');
} catch (e) {}
`;

export const metadata: Metadata = {
  metadataBase: new URL("https://cadence-pt.vercel.app"),
  title: "Cadence PT — Referral Lifecycle + RTM Revenue",
  description:
    "Capture every referral. Log every plan-of-care transmission. Bill every dollar of RTM. Built for outpatient physical therapy.",
  openGraph: {
    title: "Cadence PT — Referral Lifecycle + RTM Revenue",
    description:
      "Capture every referral. Bill every RTM dollar. Catch denials before they ship. Built for outpatient physical therapy.",
    url: "https://cadence-pt.vercel.app",
    siteName: "Cadence PT",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cadence PT — Referral Lifecycle + RTM Revenue",
    description:
      "Capture every referral. Bill every RTM dollar. Catch denials before they ship.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-screen">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-teal-700 focus:text-white focus:px-3 focus:py-2 focus:rounded"
        >
          Skip to content
        </a>
        <SupabaseBoot />
        <DemoBanner />
        <StorageHealthCheck />
        <SiteHeader />
        <main id="main" className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">{children}</main>
        <Toaster />
        <footer className="border-t mt-16" style={{ borderColor: "var(--card-border)" }}>
          <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 text-xs flex flex-col sm:flex-row sm:justify-between gap-1" style={{ color: "var(--subtle)" }}>
            <span>
              Cadence PT — POC build ·{" "}
              <span className="font-semibold text-amber-700 dark:text-amber-400">DEMO data only</span> ·
              No real PHI · Not for clinical use
            </span>
            <span>
              <a href="/accessibility" className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 rounded">
                Accessibility statement
              </a>
              <span className="mx-2">·</span>
              v0.4 · June 2026
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
