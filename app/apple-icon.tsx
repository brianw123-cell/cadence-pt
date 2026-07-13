import { ImageResponse } from "next/og";

// iOS home-screen icon: 180×180 is the modern standard.
// iOS applies its own rounded-corner mask, so we render a full square with
// the background color extending edge-to-edge. Interior content is centered
// with generous padding so nothing gets clipped by the mask.
export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #0f3a47 0%, #1a5a6b 50%, #0c4a5a 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Soft glow behind the mark */}
        <div
          style={{
            position: "absolute",
            width: 130,
            height: 130,
            borderRadius: 26,
            background: "rgba(94, 234, 212, 0.15)",
            display: "flex",
          }}
        />
        {/* The mark itself — same "C" as favicon, sized up */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 24,
            background: "#5eead4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 82,
            fontWeight: 800,
            color: "#0c4a5a",
            letterSpacing: -2,
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          }}
        >
          C
        </div>
      </div>
    ),
    { ...size },
  );
}
