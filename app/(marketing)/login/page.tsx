// app/login/page.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; 
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import {
  CheckCircleIcon,
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  DocumentCheckIcon
} from "@heroicons/react/24/solid";

export default function LoginPage() {
  const { user, loading, isFirstLogin } = useAuth();
  const router = useRouter();

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

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("로그인 중 에러 발생:", error);
    }
  };

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        로그인 정보 확인 중...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* 1. 왼쪽: 브랜딩 영역 (문구 및 아이콘 수정) */}
      <div className="hidden lg:flex lg:w-1/3 flex-col justify-center bg-gray-900 p-16 text-white">
        <h1 className="mb-4 text-4xl font-bold">RuleMakers</h1>
        <p className="text-xl text-gray-300 font-light leading-relaxed">
          선생님의 수업 준비 시간을 줄여드리는<br />
          <span className="font-semibold text-white">가장 확실한 컨텐츠 파트너</span>
        </p>
        <div className="mt-12 space-y-8">
          <FeatureItem
            icon={<CheckCircleIcon className="h-6 w-6 text-blue-400" />}
            title="1:1 전담 맞춤 제작"
            description="학교별 기출 경향과 요청사항을 완벽히 반영한 나만의 교재를 제작해드립니다."
          />
          <FeatureItem
            icon={<ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-400" />}
            title="실시간 소통 & 피드백"
            description="작업 중 발생하는 수정 사항이나 의견을 전담 연구원과 실시간으로 주고받으세요."
          />
          <FeatureItem
            icon={<DocumentCheckIcon className="h-6 w-6 text-blue-400" />}
            title="검증된 퀄리티 보장"
            description="서울대 출신 연구진의 3단계 교차 검수를 통해 오류 없는 완벽한 자료를 제공합니다."
          />
        </div>
      </div>

      {/* 2. 오른쪽: 로그인 영역 */}
      <div className="flex w-full lg:w-2/3 min-h-screen flex-col bg-gray-50">
        
        {/* 상단: 메인 페이지로 돌아가기 */}
        <div className="w-full p-6 text-right sm:p-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>메인 페이지로 돌아가기</span>
          </Link>
        </div>

        {/* 중단: 로그인 카드 */}
        <div className="flex flex-col flex-grow items-center justify-center px-6 pb-6">
          <div className="w-full max-w-sm">
            {/* 모바일용 헤더 (lg 사이즈 이상에서 숨김) */}
            <div className="mb-8 text-center lg:hidden">
              <h1 className="text-3xl font-bold text-gray-900">RuleMakers</h1>
              <p className="mt-2 text-gray-600">
                선생님을 위한 프리미엄 컨텐츠 서비스
              </p>
            </div>

            {/* 로그인 카드 */}
            <div className="rounded-xl bg-white p-8 shadow-lg border border-gray-100">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900">시작하기</h2>
                <p className="mt-2 text-sm text-gray-500">
                  Google 계정으로 간편하게 시작하세요.
                </p>
              </div>
              <button
                onClick={handleGoogleLogin}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md active:scale-[0.99]"
              >
                <Image
                  src="/google-logo.svg"
                  alt="Google"
                  width={20}
                  height={20}
                />
                <span>Google 계정으로 로그인</span>
              </button>
              
              <div className="mt-8 border-t border-gray-100 pt-6 text-center">
                <p className="text-xs text-gray-400">
                  로그인 시 
                  <Link href="/terms" className="text-blue-600 hover:underline mx-1">이용약관</Link>
                  및 
                  <Link href="/privacy" className="text-blue-600 hover:underline mx-1">개인정보처리방침</Link>
                  에 동의하게 됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
      <div className="flex-shrink-0 mt-1">{icon}</div>
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm text-gray-400 mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}