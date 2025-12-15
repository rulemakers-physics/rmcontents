// components/RouteGuard.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// 1. 누구나 접근 가능한 경로 (로그인 불필요)
const PUBLIC_PATHS = [
  "/", 
  "/login", 
  "/pricing",           
  "/basic-service",     
  "/premium-service",   
  "/contact", 
  "/company", 
  "/terms", 
  "/privacy",
  "/share"
];

// 2. [수정] 공개 경로 접두사 추가
// OMR 페이지는 로그인 없이도 접근 가능해야 하므로 여기에 추가합니다.
const PUBLIC_PREFIXES = [
  "/showcase",
  "/student/omr" // 👈 [추가] OMR 페이지는 공개로 설정
];

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, userData, loading, isFirstLogin } = useAuth(); 
  const router = useRouter();
  const pathname = usePathname();
  
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    setIsAuthorized(false);
  }, [pathname]);

  useEffect(() => {
    if (loading) return;

    // 1. 공개 페이지 확인
    const isPublic = 
      PUBLIC_PATHS.includes(pathname) || 
      PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix));

    // 2. 비로그인 유저 처리
    if (!user) {
      if (isPublic) {
        setIsAuthorized(true); 
        return;
      } else {
        router.replace("/login"); 
        return;
      }
    }

    // 3. 로그인 유저 권한 검사
    if (user.isAdmin) {
      setIsAuthorized(true);
      return;
    }

    if (!userData) {
      if (isFirstLogin === true) {
        if (pathname === "/profile/setup") {
          setIsAuthorized(true);
          return;
        }
        router.replace("/profile/setup");
        return;
      }
      return; 
    }

    const { role, plan } = userData;

    // (A) 학생 라우트 제어
    if (pathname.startsWith("/student")) {
      // 강사나 원장이 학생 페이지 접근 시 대시보드로 이동 (OMR은 예외일 수 있으나, 보통 모바일로 접속하므로 유지)
      // 단, 강사가 테스트로 OMR을 찍어볼 수도 있으므로 OMR은 허용해주는 게 좋습니다.
      const isOmrPage = pathname.startsWith("/student/omr"); // 👈 체크 변수 추가

      if (!isOmrPage && (role === "instructor" || role === "director")) {
        router.replace("/dashboard");
        return;
      }
      
      const isPaidStudent = plan === "STD_STANDARD" || plan === "STD_PREMIUM";
      
      // [수정] 유료 플랜 체크 예외 경로에 '/student/omr' 추가
      // OMR 페이지는 플랜과 상관없이 접속 가능해야 합니다.
      if (role === "student" && !isPaidStudent) {
        if (!pathname.startsWith("/student/profile") && !isOmrPage) { // 👈 !isOmrPage 조건 추가
           router.replace("/pricing"); 
           return;
        }
      }
    }

    // (B) 앱 라우트 제어 (기존 유지)
    const isAppRoute = 
      pathname.startsWith("/dashboard") || 
      pathname.startsWith("/manage") || 
      pathname.startsWith("/request") || 
      pathname.startsWith("/service");

    if (isAppRoute) {
      if (role === "student") {
        router.replace("/student/dashboard");
        return;
      }

      const isPaidInstructor = plan === "BASIC" || plan === "MAKERS";
      if ((role === "instructor" || role === "director") && !isPaidInstructor) {
         router.replace("/pricing");
         return;
      }
    }

    // 모든 검사 통과
    setIsAuthorized(true);

  }, [user, userData, loading, isFirstLogin, pathname, router]);

  if (loading || !isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}