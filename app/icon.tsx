import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
            width: 380,
            height: 380,
            borderRadius: "50%",
            display: "flex",
            background: "radial-gradient(circle at 35% 30%, #f4cd7c 0%, #d1a350 55%, #a97f37 100%)",
            boxShadow: "inset 0 0 0 14px rgba(23,19,16,0.18)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
