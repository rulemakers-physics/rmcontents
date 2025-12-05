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
  "/privacy"
];

// 쇼케이스 등 일부 공개 경로는 startsWith로 처리
const PUBLIC_PREFIXES = [
  "/showcase"
];

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  // [수정] isFirstLogin 추가
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
    
    // 3-1. 관리자(Admin)는 프리패스
    if (user.isAdmin) {
      setIsAuthorized(true);
      return;
    }

    // 3-2. [핵심 수정] 유저 데이터가 없는 경우 (첫 로그인 처리)
    if (!userData) {
      // (A) 첫 로그인 상태가 확인된 경우
      if (isFirstLogin === true) {
        // 이미 셋업 페이지라면 렌더링 허용
        if (pathname === "/profile/setup") {
          setIsAuthorized(true);
          return;
        }
        // 다른 페이지라면 셋업 페이지로 강제 이동
        router.replace("/profile/setup");
        return;
      }
      
      // (B) 아직 데이터 로딩 중인 경우 (isFirstLogin도 null) -> 대기
      return; 
    }

    // 3-3. userData가 있는 정상 유저 권한 검사
    const { role, plan } = userData;

    // (A) 학생 라우트 제어
    if (pathname.startsWith("/student")) {
      if (role === "instructor" || role === "director") {
        router.replace("/dashboard");
        return;
      }
      
      const isPaidStudent = plan === "STD_STANDARD" || plan === "STD_PREMIUM";
      if (role === "student" && !isPaidStudent) {
        // 프로필 설정은 예외적으로 허용 (결제 유도를 위해)
        if (!pathname.startsWith("/student/profile")) {
           router.replace("/pricing"); 
           return;
        }
      }
    }

    // (B) 앱 라우트 제어
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

  // 차단 중일 때 로딩 표시
  if (loading || !isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}