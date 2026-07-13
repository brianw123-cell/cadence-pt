import { ImageResponse } from "next/og";

// 32x32 favicon — the Stride mark: two overlapping "step" shapes on a
// warm sandstone tile. Charcoal back step, terracotta front step, tilted
// as if mid-stride. Palette matches the app's brand: terracotta #b45640,
// sandstone #ebd4b8, charcoal #2e2620.
export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#ebd4b8",
          borderRadius: 7,
          display: "flex",
          position: "relative",
        }}
      >
        {/* Back step — charcoal, bottom-left, tilted -14° */}
        <div
          style={{
            position: "absolute",
            width: 10,
            height: 16,
            left: 7,
            top: 10,
            background: "#2e2620",
            borderRadius: 999,
            transform: "rotate(-14deg)",
            display: "flex",
          }}
        />
        {/* Front step — terracotta, top-right, tilted +12° */}
        <div
          style={{
            position: "absolute",
            width: 10,
            height: 16,
            left: 15,
            top: 5,
            background: "#b45640",
            borderRadius: 999,
            transform: "rotate(12deg)",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
