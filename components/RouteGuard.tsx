"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";

// [설정] 누구나 접근 가능한 경로 (로그인 불필요)
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
  "/share",
  "/payment/subscribe",
  "/payment/callback",
  "/payment/fail"
];

const PUBLIC_PREFIXES = [
  "/showcase",
  "/student/omr" 
];

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, userData, loading, isFirstLogin, isUserDataLoaded } = useAuth(); 
  const router = useRouter();
  const pathname = usePathname();
  
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    setIsAuthorized(false);
  }, [pathname]);

  useEffect(() => {
    // 1. 로딩 중 대기
    if (loading) return;

    // 2. 공개 페이지 통과
    const isPublic = 
      PUBLIC_PATHS.includes(pathname) || 
      PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix));

    if (isPublic) {
      setIsAuthorized(true);
      return;
    }

    // 3. 비로그인 -> 로그인으로
    if (!user) {
      router.replace("/login"); 
      return;
    }

    // 4. 유저 데이터 로딩 대기
    if (!isUserDataLoaded) return;

    // 5. 관리자 프리패스
    if (user.isAdmin || userData?.role === 'admin') {
      setIsAuthorized(true);
      return;
    }

    // 6. 프로필 미설정 유저 -> 설정으로
    if (!userData && isFirstLogin === true) {
      if (pathname !== "/profile/setup") {
        router.replace("/profile/setup");
        return;
      }
      setIsAuthorized(true);
      return;
    }

    if (!userData) return; 

    // [강사 전용 페이지 목록 정의]
    const isServicePage = 
      pathname.startsWith("/service") || 
      pathname.startsWith("/manage") ||
      pathname.startsWith("/request");

    // 7. 강사/원장 권한 체크
    if (userData.role === 'instructor' || userData.role === 'director') {
      
      // (1) 유료 회원이거나 체험 중이면 통과
      if (userData.plan !== 'FREE') {
        setIsAuthorized(true);
        return;
      }

      // (2) FREE 회원이 서비스 페이지 접근 시 -> 무료 체험 여부 체크
      if (isServicePage) {
        // 체험 시작일이 없거나 상태가 NONE이면 차단
        if (!userData.trialStartDate || userData.subscriptionStatus === 'NONE') {
          toast("서비스 이용을 위해 대시보드에서 무료 체험을 시작해주세요.", { icon: "👋" });
          router.replace("/dashboard");
          return;
        }

        // 체험 기간 만료 체크 (기존 로직 유지)
        const now = Date.now();
        const startDate = userData.trialStartDate.toDate().getTime();
        const daysSinceStart = (now - startDate) / (1000 * 60 * 60 * 24);

        // 14일 ~ 30일: 카드 미등록 시 차단
        if (daysSinceStart >= 14 && daysSinceStart < 30) {
          if (!userData.billingKey) {
            toast.error("무료 체험 연장을 위해 카드 등록이 필요합니다.");
            router.replace("/payment/subscribe");
            return;
          }
        } 
        // 30일 이후: 유료 전환 안 됐으면 차단
        else if (daysSinceStart >= 30) {
          if (userData.subscriptionStatus !== 'ACTIVE') {
             toast.error("무료 체험 기간이 종료되었습니다.");
             router.replace("/pricing");
             return;
          }
        }
      }
    } 
    // 8. [보안 수정] 학생 등 기타 역할이 강사 전용 페이지 접근 시 차단
    else {
      if (isServicePage || pathname.startsWith("/admin")) {
        toast.error("접근 권한이 없습니다.");
        // 학생이면 학생 대시보드로, 아니면 홈으로
        if (userData.role === 'student') {
          router.replace("/student/dashboard");
        } else {
          router.replace("/");
        }
        return;
      }
    }

    // 9. 학생 페이지 접근 제어 (강사가 학생 페이지 접근 시 차단)
    if (pathname.startsWith("/student") && !pathname.startsWith("/student/omr")) {
       if (userData.role === 'instructor' || userData.role === 'director') {
         router.replace("/dashboard");
         return;
       }
    }

    // 모든 검사 통과
    setIsAuthorized(true);

  }, [user, userData, loading, isFirstLogin, isUserDataLoaded, pathname, router]);

  if (loading || !isUserDataLoaded || !isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500 font-medium">권한 확인 중...</p>
      </div>
    );
  }

  return <>{children}</>;
}