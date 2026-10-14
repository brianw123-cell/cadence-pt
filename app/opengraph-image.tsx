import { ImageResponse } from "next/og";

// Generated on every cold deploy. Cached at the CDN edge after that.
// The Cadence brand: warm sandstone background, terracotta + charcoal step
// marks, deep charcoal text. Reads confident and human-scale, not medical-tech.
export const runtime = "edge";
export const alt =
  "Cadence PT — Referral lifecycle, RTM revenue, denial protection for outpatient physical therapy";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#ebd4b8",
          padding: 80,
          fontFamily: "system-ui, sans-serif",
          color: "#2e2620",
          position: "relative",
        }}
      >
        {/* Logo + brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          {/* Cadence mark tile */}
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 20,
              background: "#f5e6c8",
              display: "flex",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 28,
                height: 46,
                left: 22,
                top: 32,
                background: "#2e2620",
                borderRadius: 999,
                transform: "rotate(-14deg)",
                display: "flex",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: 28,
                height: 46,
                left: 46,
                top: 16,
                background: "#b45640",
                borderRadius: 999,
                transform: "rotate(12deg)",
                display: "flex",
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.05, color: "#2e2620" }}>
              Cadence PT
            </div>
            <div
              style={{
                fontSize: 20,
                color: "#b45640",
                marginTop: 4,
                letterSpacing: 3,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Physical Therapy
            </div>
          </div>
        </div>

        {/* Hero copy */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 68,
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              color: "#2e2620",
            }}
          >
            Capture every referral.
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              color: "#2e2620",
            }}
          >
            Bill every RTM dollar.
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              color: "#b45640",
            }}
          >
            Catch denials before they ship.
          </div>
        </div>

        {/* Bottom strip */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "absolute",
            left: 80,
            right: 80,
            bottom: 60,
            fontSize: 22,
          }}
        >
          <div style={{ color: "#7a5d3a", fontWeight: 600 }}>
            cadence-pt.vercel.app
          </div>
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              color: "#7a5d3a",
              fontWeight: 600,
            }}
          >
            <div>Referrals</div>
            <div style={{ opacity: 0.5 }}>•</div>
            <div>RTM</div>
            <div style={{ opacity: 0.5 }}>•</div>
            <div>Outcomes</div>
            <div style={{ opacity: 0.5 }}>•</div>
            <div>Denials</div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
