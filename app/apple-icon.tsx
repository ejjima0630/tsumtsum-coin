import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const backCoin = {
  position: "absolute" as const,
  width: 96,
  height: 96,
  borderRadius: "50%",
  boxSizing: "border-box" as const,
  border: "5px solid #8a6a2f",
  background: "radial-gradient(circle at 35% 30%, #d1a350 0%, #8a6a2f 100%)",
};

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          background: "#171310",
        }}
      >
        <div style={{ ...backCoin, left: 24, top: 60 }} />
        <div style={{ ...backCoin, left: 51, top: 36 }} />
        <div
          style={{
            position: "absolute",
            left: 69,
            top: 9,
            width: 96,
            height: 96,
            borderRadius: "50%",
            boxSizing: "border-box",
            border: "5px solid #a97f37",
            background: "radial-gradient(circle at 35% 30%, #f4cd7c 0%, #d1a350 100%)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
