// app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Next.js 기본 CSS
import { AuthProvider } from "@/context/AuthContext"; // 1. 전역 인증 관리
import Header from "@/components/Header";             // 2. 공통 헤더
import Footer from "@/components/Footer";             // 3. 공통 푸터

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RuleMakers - 컨텐츠 요청 시스템",
  description: "강사를 위한 맞춤형 컨텐츠 제작 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <AuthProvider> {/* 모든 페이지에서 로그인 상태를 알 수 있게 함 */}
          
          <Header /> {/* 모든 페이지 상단에 헤더 표시 */}
          
          {/* <main> 태그를 여기서 사용하지 않는 것이 좋습니다.
            각 페이지(page.tsx)가 <main>을 직접 관리하도록 하여
            로그인 페이지처럼 헤더/푸터만 필요한 경우 유연하게 만듭니다.
          */}
          <div className="flex-grow">{children}</div> {/* 페이지 본문 내용 */}
          
          <Footer /> {/* 모든 페이지 하단에 푸터 표시 */}
          
        </AuthProvider>
      </body>
    </html>
  );
}