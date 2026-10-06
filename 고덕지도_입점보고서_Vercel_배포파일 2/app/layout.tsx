import type { Metadata } from "next";
import "./globals.css";
import "./insight.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://amap-report-builder.realren0215.chatgpt.site"),
  title: "고덕지도 입점 완료 보고서 제작기",
  description: "AMAP 해외 매장 입점 보고서를 빠르게 제작하고 PDF로 저장합니다.",
  openGraph: {
    title: "고덕지도 입점 완료 보고서",
    description: "캡처 이미지를 업로드하고 AMAP 입점 보고서를 바로 제작하세요.",
    images: [{ url: "/og.png", width: 1731, height: 877 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "고덕지도 입점 완료 보고서",
    description: "AMAP 해외 매장 입점 보고서 제작기",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
