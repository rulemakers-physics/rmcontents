import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";
import RouteGuard from "@/components/RouteGuard";

// ▼▼▼ [수정] 메타데이터 설정 시작 ▼▼▼
export const metadata: Metadata = {
  // 1. 도메인 주소 설정 (배포된 실제 주소로 꼭 변경해주세요!)
  metadataBase: new URL('https://www.rulemakers.co.kr'), 

  title: {
    template: '%s | RuleMakers',
    default: 'PASS by RuleMakers - 통합과학 문제은행 & 학원 관리 솔루션',
  },
  
  description: '서울대 사범대 출신 연구진이 제작한 프리미엄 통합과학 문제은행과 맞춤형 컨텐츠 제작 서비스',
  
  keywords: [
    '문제은행', '과학문제은행', '통합과학', '물리학', '화학', '생명과학', '지구과학', '통과', '물리', '생명', '지구', '과학 내신', '통과 내신', '통합과학 내신', '물리 내신', '화학 내신', '생명 내신', '지구 내신',
    '학원관리프로그램', 'LMS', '오답노트', '자동채점', '학원관리', '통합과학 컨텐츠', '물리학 컨텐츠', '화학 컨텐츠', '생명과학 컨텐츠', '지구과학 컨텐츠', '통과 컨텐츠', '학원 프로그램', '통합과학 모의고사', '물리 모의고사', '화학 모의고사', '생명 모의고사', '지구 모의고사',
    '내신대비', '수능대비', '룰메이커스', 'RuleMakers', '룰브레이커스', 'RuleBreakers'
  ],

  openGraph: {
    title: 'PASS by RuleMakers',
    description: '선생님의 수업 준비 시간을 줄여드리는 가장 확실한 파트너. 3일 완성 맞춤 교재 제작부터 성적 관리까지.',
    // ✅ OG URL도 서브도메인으로
    url: 'https://pass.rulemakers.co.kr',
    siteName: 'RuleMakers',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: '/images/logo.png',
        width: 1200,
        height: 630,
        alt: 'RuleMakers PASS 서비스 미리보기',
      },
    ],
  },

  verification: {
    // ✅ 구글은 DNS로 이미 인증하셨으므로 삭제했습니다! (깔끔)
    other: {
      // 네이버 서치어드바이저에는 'https://pass.rulemakers.co.kr'을 사이트로 등록하고
      // 발급받은 메타 태그 값을 여기에 넣어주세요.
      'naver-site-verification': '네이버_웹마스터도구_인증코드_입력',
    },
  },

  robots: {
    index: true,
    follow: true,
  },
  
  icons: {
    icon: '/favicon.ico',
  },
};
// ▲▲▲ [수정] 메타데이터 설정 끝 ▲▲▲

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="flex min-h-screen flex-col font-sans">
        <AuthProvider>
          <RouteGuard>
            {children}
          </RouteGuard>
          <Toaster 
            position="top-center" 
            toastOptions={{
              duration: 3000,
              style: {
                background: '#333',
                color: '#fff',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: 'white',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}