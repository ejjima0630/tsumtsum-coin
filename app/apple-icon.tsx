import { ImageResponse } from "next/og";

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
          background: "#171310",
        }}
      >
        <div
          style={{
            width: 134,
            height: 134,
            borderRadius: "50%",
            display: "flex",
            background: "radial-gradient(circle at 35% 30%, #f4cd7c 0%, #d1a350 55%, #a97f37 100%)",
            boxShadow: "inset 0 0 0 5px rgba(23,19,16,0.18)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
