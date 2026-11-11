import type { Metadata } from "next";
import Header from "@/components/header";
import Footer from "@/components/footer";
import "./globals.css";
import "./analysis-styles.css";
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "나읽기. | 사주와 성향으로 읽는 나의 이야기",
    template: "%s | 나읽기.",
  },
  description:
    "사주, MBTI, 태몽을 함께 읽고 새로운 나를 발견하세요. 나만의 종합 프로필과 매일의 작은 조언.",
  openGraph: {
    locale: "ko_KR",
    type: "website",
    siteName: "나읽기.",
    title: "나읽기. — 나는 어떤 사람일까?",
    description: "사주부터 MBTI, 태몽까지. 나를 이해하는 새로운 시선.",
    images: ["/og.jpg"],
  },
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main">
          본문으로 건너뛰기
        </a>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
