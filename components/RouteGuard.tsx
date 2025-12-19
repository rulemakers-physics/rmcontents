// components/RouteGuard.tsx

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
  "/payment/subscribe", // 결제 페이지는 접근 가능해야 함
  "/payment/callback",
  "/payment/fail"
];

const PUBLIC_PREFIXES = [
  "/showcase",
  "/student/omr" 
];

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  // [수정] isUserDataLoaded 가져오기
  const { user, userData, loading, isFirstLogin, isUserDataLoaded } = useAuth(); 
  const router = useRouter();
  const pathname = usePathname();
  
  const [isAuthorized, setIsAuthorized] = useState(false);

  // 경로 변경 시 권한 체크 상태 초기화
  useEffect(() => {
    setIsAuthorized(false);
  }, [pathname]);

  useEffect(() => {
    // 1. 기본 인증 로딩 중이면 대기
    if (loading) return;

    // 2. 공개 페이지는 즉시 통과
    const isPublic = 
      PUBLIC_PATHS.includes(pathname) || 
      PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix));

    if (isPublic) {
      setIsAuthorized(true);
      return;
    }

    // 3. 비로그인 유저 -> 로그인 페이지로
    if (!user) {
      router.replace("/login"); 
      return;
    }

    // 4. [핵심] 유저 데이터가 아직 로드되지 않았다면 대기 (여기서 뚫리는 것 방지)
    if (!isUserDataLoaded) return;

    // --- 여기부터는 userData가 확실히 있는 상태 ---

    // 5. 관리자 프리패스
    if (user.isAdmin) {
      setIsAuthorized(true);
      return;
    }

    // 6. 프로필 미설정 유저 -> 설정 페이지로
    if (!userData && isFirstLogin === true) {
      if (pathname !== "/profile/setup") {
        router.replace("/profile/setup");
        return;
      }
      setIsAuthorized(true);
      return;
    }

    // userData가 없는데 FirstLogin도 아닌 이상한 상황 (DB 오류 등)
    if (!userData) return; 

    // 7. 강사/원장님 권한 체크
    if (userData.role === 'instructor' || userData.role === 'director') {
      
      // 유료 회원은 프리패스
      if (userData.plan !== 'FREE') {
        setIsAuthorized(true);
        return;
      }

      // ★ FREE 회원이 서비스 기능에 접근할 때 체크
      const isServicePage = 
        pathname.startsWith("/service") || 
        pathname.startsWith("/manage") ||
        pathname.startsWith("/request");

      if (isServicePage) {
        // (1) 체험 시작 안 함 -> 대시보드로 튕기기
        if (!userData.trialStartDate || userData.subscriptionStatus === 'NONE') {
          toast("서비스 이용을 위해 대시보드에서 무료 체험을 시작해주세요.", { icon: "👋" });
          router.replace("/dashboard");
          return;
        }

        // (2) 체험 기간 체크 로직 (기존과 동일)
        const now = Date.now();
        const startDate = userData.trialStartDate.toDate().getTime();
        const daysSinceStart = (now - startDate) / (1000 * 60 * 60 * 24);

        if (daysSinceStart >= 14 && daysSinceStart < 30) {
          if (!userData.billingKey) {
            toast.error("무료 체험 연장을 위해 카드 등록이 필요합니다.");
            router.replace("/payment/subscribe");
            return;
          }
        } else if (daysSinceStart >= 30) {
          if (userData.subscriptionStatus !== 'ACTIVE') {
             toast.error("무료 체험 기간이 종료되었습니다.");
             router.replace("/pricing");
             return;
          }
        }
      }
    }

    // 8. 학생 권한 체크 (기존 유지)
    if (pathname.startsWith("/student") && !pathname.startsWith("/student/omr")) {
       if (userData.role === 'instructor' || userData.role === 'director') {
         router.replace("/dashboard");
         return;
       }
    }

    // 모든 검사 통과
    setIsAuthorized(true);

  }, [user, userData, loading, isFirstLogin, isUserDataLoaded, pathname, router]);

  // 로딩 중이거나 권한 확인 전이면 로딩 화면 표시
  if (loading || !isUserDataLoaded || !isAuthorized) {
    // 공개 페이지면서 비로그인 상태일 때는 바로 보여주기 위해 예외 처리할 수도 있지만,
    // 위 useEffect 로직 흐름상 isAuthorized가 true가 되므로 괜찮음.
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500 font-medium">권한 확인 중...</p>
      </div>
    );
  }

  return <>{children}</>;
}