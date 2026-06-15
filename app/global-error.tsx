"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.error("Cadence global error:", error);
    }
  }, [error]);

  return (
    <html>
      <body style={{ fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", padding: 24, color: "#0c1f24" }}>
        <div style={{ maxWidth: 600, margin: "60px auto", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#991b1b", marginBottom: 8 }}>
            Cadence hit an unexpected error
          </h1>
          <p style={{ color: "#57534e", marginBottom: 24 }}>
            The app encountered a problem at the root level. Try a refresh.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#0f5b6e",
              color: "white",
              border: 0,
              padding: "10px 18px",
              borderRadius: 6,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest && (
            <div style={{ marginTop: 24, fontSize: 12, color: "#a8a29e", fontFamily: "monospace" }}>
              Error ID: {error.digest}
            </div>
          )}
        </div>
      </body>
    </html>
  );
}
