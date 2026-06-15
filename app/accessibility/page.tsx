import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accessibility statement — Cadence PT",
  description:
    "Cadence PT is built to conform with WCAG 2.1 AA. Read our commitment, conformance status, known issues, and how to report accessibility barriers.",
};

export default function AccessibilityStatementPage() {
  return (
    <article className="prose prose-stone max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-teal-900">Accessibility statement</h1>
      <p className="text-sm text-stone-500 mt-1">Last updated: June 2026</p>

      <h2 className="text-xl font-bold text-stone-900 mt-8 mb-2">Our commitment</h2>
      <p className="text-stone-800">
        Cadence PT is designed to be usable by physical therapists, clinic staff,
        and patients of all abilities. We treat digital accessibility as a
        baseline standard, not an enhancement. This page documents our
        conformance posture, what we've verified, what we haven't, and how to
        report a barrier.
      </p>

      <h2 className="text-xl font-bold text-stone-900 mt-8 mb-2">Standard we target</h2>
      <p className="text-stone-800">
        Cadence PT is built against the{" "}
        <strong>Web Content Accessibility Guidelines (WCAG) 2.1, Level AA</strong>,
        which is the standard referenced by:
      </p>
      <ul className="list-disc pl-6 text-stone-800 space-y-1">
        <li>The Americans with Disabilities Act (ADA), Title III</li>
        <li>Section 508 of the Rehabilitation Act (federal accessibility)</li>
        <li>
          Section 1557 of the Affordable Care Act (healthcare-specific
          accessibility), 2024 final rule
        </li>
        <li>EN 301 549 (European Union accessibility standard)</li>
      </ul>

      <h2 className="text-xl font-bold text-stone-900 mt-8 mb-2">Conformance status</h2>
      <p className="text-stone-800">
        <strong>Partially conformant.</strong> Most of the site meets WCAG 2.1 AA
        Success Criteria. We verify the following continuously in CI:
      </p>
      <ul className="list-disc pl-6 text-stone-800 space-y-1">
        <li>
          Automated <code>axe-core</code> scans run on every route in
          continuous integration. Zero critical or serious WCAG 2 AA violations
          across all 13 application routes at the time of this writing.
        </li>
        <li>
          Color contrast meets or exceeds the 4.5:1 ratio for normal text and
          3:1 for large text on every theme (light and dark).
        </li>
        <li>
          All form inputs are properly labeled, either implicitly (label
          wraps input) or explicitly via{" "}
          <code>htmlFor</code>/<code>id</code> association.
        </li>
        <li>
          Form validation errors are announced via <code>role="alert"</code>{" "}
          and linked to the corresponding input via{" "}
          <code>aria-describedby</code> and <code>aria-invalid</code>.
        </li>
        <li>
          Toast notifications use <code>role="status"</code> with{" "}
          <code>aria-live="polite"</code> so screen readers announce them
          without interrupting the user's current task.
        </li>
        <li>
          Confirmation dialogs trap focus, restore focus on close, support
          Escape to dismiss, and block background scroll.
        </li>
        <li>
          A skip-to-content link is the first focusable element on every page.
        </li>
        <li>
          Tables include <code>&lt;caption&gt;</code> (visually hidden but
          announced) and <code>th scope="col"</code> for row/column
          association.
        </li>
        <li>
          Range sliders carry <code>aria-label</code> and{" "}
          <code>aria-valuetext</code> so screen readers announce both the
          purpose and the current value.
        </li>
        <li>
          Active navigation links carry <code>aria-current="page"</code> for
          screen reader orientation.
        </li>
        <li>
          State conveyed by color (denial severity, authorization risk, payer
          category) also carries a visually-hidden text label, so colorblind
          users and screen-reader users receive the same information.
        </li>
        <li>
          The site honors <code>prefers-reduced-motion</code>: all animations
          collapse to 10ms duration when the user has requested reduced
          motion in their operating system.
        </li>
      </ul>

      <h2 className="text-xl font-bold text-stone-900 mt-8 mb-2">Known limitations</h2>
      <p className="text-stone-800">
        We are transparent about gaps. The following are not yet verified or
        require ongoing work:
      </p>
      <ul className="list-disc pl-6 text-stone-800 space-y-1">
        <li>
          <strong>Screen reader manual testing.</strong> Our automated
          coverage is broad but not deep. We have not yet completed a full
          manual pass with JAWS, NVDA, or VoiceOver on every critical user
          flow.
        </li>
        <li>
          <strong>Touch target sizing.</strong> Most interactive elements meet
          the WCAG 2.5.5 (Level AAA) 44×44px target. Some compact controls
          (kanban "Advance" links, RTM enroll buttons in tables) are smaller
          and rely on the parent row's larger hit area.
        </li>
        <li>
          <strong>Patient mobile app preview.</strong> The phone mockup
          renders sample exercise videos as static icons; the underlying
          video player is not implemented in this demo.
        </li>
        <li>
          <strong>Print version.</strong> The print stylesheet on the Billing
          page is functional but not formally audited for accessibility.
        </li>
        <li>
          <strong>Internationalization.</strong> The site is English-only.
          Right-to-left language support is not implemented.
        </li>
      </ul>

      <h2 className="text-xl font-bold text-stone-900 mt-8 mb-2">Compatible technologies</h2>
      <p className="text-stone-800">Cadence PT is tested for use with:</p>
      <ul className="list-disc pl-6 text-stone-800 space-y-1">
        <li>Modern versions of Chrome, Safari, Firefox, and Edge</li>
        <li>JAWS, NVDA (Windows), and VoiceOver (macOS, iOS) — automated only at this time</li>
        <li>Keyboard-only navigation (no mouse required for any operation)</li>
        <li>Operating-system zoom up to 200% without horizontal scroll on standard viewports</li>
      </ul>

      <h2 className="text-xl font-bold text-stone-900 mt-8 mb-2">Reporting a barrier</h2>
      <p className="text-stone-800">
        If you encounter an accessibility barrier on Cadence PT, please tell
        us so we can fix it. Describe the page, the action you were trying to
        take, and the assistive technology you were using if any.
      </p>
      <p className="text-stone-800">
        Email accessibility reports to{" "}
        <a href="mailto:accessibility@cadence-pt.example" className="text-teal-700 underline">
          accessibility@cadence-pt.example
        </a>{" "}
        (placeholder during the demo phase). We aim to acknowledge reports
        within 2 business days and resolve confirmed WCAG AA failures within
        30 days.
      </p>

      <h2 className="text-xl font-bold text-stone-900 mt-8 mb-2">Demo disclosure</h2>
      <p className="text-stone-800">
        Cadence PT is a proof-of-concept demonstration build. No real patient
        health information is stored, transmitted, or processed by this
        application. All patient names, diagnoses, and clinical data shown are
        fictional. The accessibility commitments above apply to the production
        version of this software once released.
      </p>
    </article>
  );
}
