"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";

// [추가] 강사 접근 금지 경로 목록
const DIRECTOR_ONLY_PATHS = [
  "/profile/billing",
  "/payment", // payment 하위 모든 경로 포함
  "/manage/instructors"
];

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

    // [신규] 강사(Instructor)가 원장 전용 페이지 접근 시 차단
    if (userData.role === 'instructor') {
      const isRestrictedPath = DIRECTOR_ONLY_PATHS.some(path => pathname.startsWith(path));
      
      if (isRestrictedPath) {
        toast.error("접근 권한이 없습니다");
        router.replace("/dashboard");
        return;
      }
    }

    // [강사 전용 페이지 목록 정의]
    const isServicePage = 
      pathname.startsWith("/service") || 
      pathname.startsWith("/manage") ||
      pathname.startsWith("/request");

    // 7. 강사/원장 권한 체크 (핵심 수정 부분)
    if (userData.role === 'instructor' || userData.role === 'director') {
      
      // 유료 회원이 아닌 경우 (FREE)
      if (userData.plan === 'FREE') {
        
        // (A) 결제 실패 상태 체크 (최우선 차단)
        if (userData.subscriptionStatus === 'PAYMENT_FAILED') {
          if (pathname !== "/profile/billing") {
            toast.error("결제에 실패하여 서비스가 일시 정지되었습니다.\n카드 정보를 업데이트해주세요.");
            router.replace("/profile/billing");
            return;
          }
        }

        if (isServicePage) {
          // (B) 체험 미시작 체크
          if (!userData.trialStartDate || userData.subscriptionStatus === 'NONE') {
            toast("서비스 이용을 위해 대시보드에서 무료 체험을 시작해주세요.", { icon: "👋" });
            router.replace("/dashboard");
            return;
          }

          // (C) 14일+14일 로직 (지연 기간 포함)
          const now = Date.now();
          const startDate = userData.trialStartDate.toDate().getTime();
          const daysSinceStart = (now - startDate) / (1000 * 60 * 60 * 24);

          // 1차 체험(14일)이 지났는데 카드(billingKey)가 없는 경우 -> 무조건 차단
          // 3일이 지났든 10일이 지났든, 카드를 등록할 때까지는 접근 불가
          if (daysSinceStart >= 14 && !userData.billingKey) {
             toast.error("무료 체험(1차)이 종료되었습니다.\n카드를 등록하면 14일 더 무료로 이용 가능합니다!");
             router.replace("/payment/subscribe"); // 구독 페이지로 강제 이동
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