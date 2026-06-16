import { ImageResponse } from "next/og";

// Generated on every cold deploy. Cached at the CDN edge after that.
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
          background:
            "linear-gradient(135deg, #0f3a47 0%, #1a5a6b 50%, #0c4a5a 100%)",
          padding: 80,
          fontFamily: "system-ui, sans-serif",
          color: "white",
          position: "relative",
        }}
      >
        {/* Logo + brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 16,
              background: "#5eead4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 56,
              fontWeight: 800,
              color: "#0c4a5a",
            }}
          >
            C
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.1 }}>
              Cadence PT
            </div>
            <div
              style={{
                fontSize: 22,
                color: "#a8cfd5",
                marginTop: 4,
                letterSpacing: 0.5,
              }}
            >
              Built for outpatient physical therapy
            </div>
          </div>
        </div>

        {/* Hero copy */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 60,
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1,
            }}
          >
            Capture every referral.
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1,
            }}
          >
            Bill every RTM dollar.
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1,
              color: "#5eead4",
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
            bottom: 64,
            fontSize: 22,
          }}
        >
          <div style={{ color: "#a8cfd5" }}>cadence-pt.vercel.app</div>
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              color: "#a8cfd5",
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
