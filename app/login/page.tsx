// app/login/page.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext"; // AuthContext 훅 사용
import Image from "next/image";

export default function LoginPage() {
  const { user, loading, isFirstLogin } = useAuth(); // 전역 상태 가져오기
  const router = useRouter();

  // [핵심 로직] 로그인 상태가 변경될 때마다 실행
  useEffect(() => {
    if (loading) return; // 로딩 중에는 대기

    if (user) {
      if (isFirstLogin === true) {
        // 첫 로그인이면 프로필 설정으로
        router.push("/profile/setup");
      } else if (isFirstLogin === false) {
        // 기존 회원이면 대시보드로
        router.push("/dashboard");
      }
      // isFirstLogin이 null이면 (아직 체크 중) 대기
    }
    // user가 null이면 (로그아웃 상태) 로그인 페이지에 머무름
  }, [user, loading, isFirstLogin, router]);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // signInWithPopup만 호출하면, AuthContext의 onIdTokenChanged 리스너가
      // 자동으로 나머지를 (관리자 권한, 첫 로그인 체크) 처리합니다.
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("로그인 중 에러 발생:", error);
    }
  };

  // 이미 로그인을 시도 중이거나 로딩 중일 때 보여줄 화면
  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        로그인 정보 확인 중...
      </div>
    );
  }

  // 로그아웃 상태일 때만 로그인 버튼 표시
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">RuleMakers</h1>
          <p className="mt-2 text-gray-600">강사님을 위한 컨텐츠 요청 시스템</p>
        </div>
        <button
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-100"
        >
          <Image src="/google-logo.svg" alt="Google" width={20} height={20} />
          <span>Google 계정으로 로그인</span>
        </button>
      </div>
    </div>
  );
}