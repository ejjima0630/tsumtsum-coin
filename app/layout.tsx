import type { Metadata, Viewport } from "next";
import { Zen_Old_Mincho, Zen_Maru_Gothic, Space_Mono } from "next/font/google";
import "./globals.css";

const zenOldMincho = Zen_Old_Mincho({
  variable: "--font-display",
  weight: ["500", "700"],
  subsets: ["latin"],
});

const zenMaruGothic = Zen_Maru_Gothic({
  variable: "--font-body",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ツム貯金",
  description: "所持コインの推移から、その日の稼ぎを逆算して記録する。",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ツム貯金",
  },
};

export const viewport: Viewport = {
  themeColor: "#171310",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${zenOldMincho.variable} ${zenMaruGothic.variable} ${spaceMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
