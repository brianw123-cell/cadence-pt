import { ImageResponse } from "next/og";

// 32x32 favicon — generated as PNG, served from /icon
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
          background: "#0f5b6e",
          color: "#5eead4",
          fontSize: 24,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 6,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        C
      </div>
    ),
    { ...size },
  );
}
