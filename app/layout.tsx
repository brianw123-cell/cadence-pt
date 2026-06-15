import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import DemoBanner from "@/components/DemoBanner";
import StorageHealthCheck from "@/components/StorageHealthCheck";
import Toaster from "@/components/Toaster";

export const metadata: Metadata = {
  title: "Cadence PT — Referral Lifecycle + RTM Revenue",
  description:
    "Capture every referral. Log every plan-of-care transmission. Bill every dollar of RTM. Built for outpatient physical therapy.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-teal-700 focus:text-white focus:px-3 focus:py-2 focus:rounded"
        >
          Skip to content
        </a>
        <DemoBanner />
        <StorageHealthCheck />
        <SiteHeader />
        <main id="main" className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">{children}</main>
        <Toaster />
        <footer className="border-t border-stone-200 mt-16">
          <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 text-xs text-stone-500 flex flex-col sm:flex-row sm:justify-between gap-1">
            <span>
              Cadence PT — POC build ·{" "}
              <span className="font-semibold text-amber-700">DEMO data only</span> ·
              No real PHI · Not for clinical use
            </span>
            <span>v0.2 · June 2026</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
