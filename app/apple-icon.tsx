import { ImageResponse } from "next/og";

// iOS home-screen icon (180×180). The Cadence brand mark on a warm sandstone
// tile, extending edge-to-edge so iOS's rounded-corner mask sits cleanly on
// top of the design without clipping the "step" shapes.
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
          background: "#ebd4b8",
          position: "relative",
        }}
      >
        {/* Back step — charcoal, bottom-left of center, tilted -14° */}
        <div
          style={{
            position: "absolute",
            width: 54,
            height: 86,
            left: 42,
            top: 62,
            background: "#2e2620",
            borderRadius: 999,
            transform: "rotate(-14deg)",
            display: "flex",
          }}
        />
        {/* Front step — terracotta, upper-right of center, tilted +12° */}
        <div
          style={{
            position: "absolute",
            width: 54,
            height: 86,
            left: 86,
            top: 32,
            background: "#b45640",
            borderRadius: 999,
            transform: "rotate(12deg)",
            display: "flex",
            boxShadow: "0 4px 12px rgba(46, 38, 32, 0.25)",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
