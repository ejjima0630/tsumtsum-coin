import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ツム貯金",
    short_name: "ツム貯金",
    description: "所持コインの推移から、その日の稼ぎを逆算して記録する。",
    start_url: "/",
    display: "standalone",
    background_color: "#171310",
    theme_color: "#171310",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
  };
}
