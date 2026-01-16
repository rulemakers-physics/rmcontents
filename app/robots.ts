import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // 실제 배포 도메인으로 변경해주세요
  const baseUrl = 'https://pass.rulemakers.co.kr';

  return {
    rules: {
      userAgent: '*',
      // 1. 마케팅 페이지(랜딩, 소개, 요금 등)는 모두 허용
      allow: '/',
      
      // 2. 앱 서비스 라우트(로그인 필요 영역)는 크롤링 원천 차단
      disallow: [
        '/dashboard/',  // 대시보드
        '/service/',    // 문제은행(Maker), 보관함 등
        '/request/',    // 작업 요청
        '/profile/',    // 프로필 설정, 결제 관리
        '/manage/',     // 원생/반/리포트 관리
        '/admin/',      // 관리자 페이지
        '/board/',      // 공지사항(내부용일 경우)
        '/student/',    // 학생용 페이지 (대시보드, 문제풀이 등)
        '/payment/',    // 결제 처리 페이지
        '/login/',      // 로그인 페이지
        '/api/',        // API 엔드포인트
        '/_next/',      // Next.js 빌드 파일
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}