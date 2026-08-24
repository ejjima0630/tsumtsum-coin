import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

const backCoin = {
  position: "absolute" as const,
  width: 273,
  height: 273,
  borderRadius: "50%",
  boxSizing: "border-box" as const,
  border: "13px solid #8a6a2f",
  background: "radial-gradient(circle at 35% 30%, #d1a350 0%, #8a6a2f 100%)",
};

export default function Icon() {
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
        <div style={{ ...backCoin, left: 68, top: 171 }} />
        <div style={{ ...backCoin, left: 145, top: 102 }} />
        <div
          style={{
            position: "absolute",
            left: 196,
            top: 26,
            width: 273,
            height: 273,
            borderRadius: "50%",
            boxSizing: "border-box",
            border: "13px solid #a97f37",
            background: "radial-gradient(circle at 35% 30%, #f4cd7c 0%, #d1a350 100%)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
