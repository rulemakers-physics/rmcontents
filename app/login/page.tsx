// app/login/page.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // [추가] Link 임포트
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import {
  CheckCircleIcon,
  ArrowLeftIcon, // [추가] 아이콘 임포트
} from "@heroicons/react/24/solid";

export default function LoginPage() {
  const { user, loading, isFirstLogin } = useAuth();
  const router = useRouter();

  // [기존 로직] (수정 없음)
  useEffect(() => {
    if (loading) return;
    if (user) {
      if (isFirstLogin === true) {
        router.push("/profile/setup");
      } else if (isFirstLogin === false) {
        router.push("/dashboard");
      }
    }
  }, [user, loading, isFirstLogin, router]);

  // [기존 로직] (수정 없음)
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("로그인 중 에러 발생:", error);
    }
  };

  // [기존 로직] (수정 없음)
  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        로그인 정보 확인 중...
      </div>
    );
  }

  // [수정] 4:6 비율의 2단 분할 레이아웃 + 상/하단 요소 추가
  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* 1. 왼쪽: 브랜딩 영역 (폭을 40%로 수정) */}
      <div className="hidden lg:flex lg:w-1/5 flex-col justify-center bg-gray-900 p-16 text-white">
        <h1 className="mb-4 text-4xl font-bold">RuleMakers</h1>
        <p className="text-xl text-gray-300">
          고객님을 위한 단 하나의 프리미엄 컨텐츠,
          <br />
          지금 바로 경험해보세요.
        </p>
        <div className="mt-12 space-y-6">
          <FeatureItem
            icon={<CheckCircleIcon className="h-6 w-6 text-blue-400" />}
            title="학교별 맞춤형 컨텐츠"
            description="최신 기출 경향과 데이터를 분석하여 맞춤형 문항을 제작합니다."
          />
          <FeatureItem
            icon={<CheckCircleIcon className="h-6 w-6 text-blue-400" />}
            title="신속한 제작 및 검수"
            description="요청 후 3일 이내에 검수까지 완료된 최종본을 제공합니다."
          />
          <FeatureItem
            icon={<CheckCircleIcon className="h-6 w-6 text-blue-400" />}
            title="강의 전용 대시보드"
            description="모든 요청 내역과 제작된 컨텐츠를 한곳에서 관리합니다."
          />
        </div>
      </div>

      {/* 2. 오른쪽: 로그인 영역 (폭을 60%로 수정) */}
      {/* [수정] flex-col을 사용해 상단, 중단(카드), 하단으로 나눔 */}
      <div className="flex w-full lg:w-4/5 min-h-screen flex-col bg-gray-50">
        
        {/* [추가] 상단: 메인 페이지로 돌아가기 */}
        <div className="w-full p-6 text-right sm:p-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>메인 페이지로 돌아가기</span>
          </Link>
        </div>

        {/* 중단: 로그인 카드 (flex-grow로 중앙 영역 차지) */}
        <div className="flex flex-col flex-grow items-center justify-center px-6 pb-6">
          <div className="w-full max-w-sm">
            {/* 모바일용 헤더 (lg 사이즈 이상에서 숨김) */}
            <div className="mb-6 text-center lg:hidden">
              <h1 className="text-3xl font-bold text-gray-900">RuleMakers</h1>
              <p className="mt-2 text-gray-600">
                강사님을 위한 컨텐츠 요청 시스템
              </p>
            </div>

            {/* 로그인 카드 */}
            <div className="rounded-lg bg-white p-8 shadow-md">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-gray-900">시작하기</h2>
                <p className="mt-2 text-gray-500">
                  Google 계정으로 간편하게 시작하세요.
                </p>
              </div>
              <button
                onClick={handleGoogleLogin}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-100"
              >
                <Image
                  src="/google-logo.svg"
                  alt="Google"
                  width={20}
                  height={20}
                />
                <span>Google 계정으로 로그인</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// [기존] 헬퍼 컴포넌트 (수정 없음)
function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </div>
    </div>
  );
}