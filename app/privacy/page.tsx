// app/privacy/page.tsx

import React from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";

export default function PrivacyPage() {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="container mx-auto max-w-3xl px-6 lg:px-8">
        {/* 로그인 페이지나 메인으로 돌아갈 수 있는 링크 (선택 사항) */}
        <div className="mb-8">
          <Link
            href="/login" // 또는 "/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>이전 페이지로 돌아가기</span>
          </Link>
        </div>

        {/* 'prose' 클래스는 h1, h2, p, ul 태그 등에 
          가독성 높은 스타일을 자동으로 적용합니다. 
        */}
        <article className="prose prose-lg max-w-none prose-h1:font-bold prose-h2:font-semibold">
          <h1>개인정보처리방침</h1>
          <p className="text-sm text-gray-500">
            시행일: 2025년 11월 11일
          </p>

          <p>
            RuleMakers(이하 "회사")는 정보통신망 이용촉진 및 정보보호 등에 관한
            법률, 개인정보보호법 등 관련 법령상의 개인정보보호 규정을
            준수하며, 관련 법령에 의거한 개인정보처리방침을 정하여 이용자
            권익 보호에 최선을 다하고 있습니다.
          </p>

          <h2>1. 수집하는 개인정보의 항목</h2>
          <p>
            [수집하는 개인정보의 구체적인 항목(예: 구글 계정 정보, 이메일,
            이름)에 대한 내용을 여기에 작성합니다.]
          </p>
          <ul>
            <li>필수 항목: 이메일 주소, 이름 (Google 프로필 제공)</li>
            <li>
              서비스 이용 과정에서 자동 수집 항목: IP 주소, 쿠키, 서비스
              이용 기록 등
            </li>
          </ul>

          <h2>2. 개인정보의 수집 및 이용 목적</h2>
          <p>
            [수집한 개인정보를 어떤 목적으로 이용하는지에 대한 내용을 여기에
            작성합니다. (예: 회원 식별, 서비스 제공, 고객 문의 응대 등)]
          </p>

          <h2>3. 개인정보의 보유 및 이용 기간</h2>
          <p>
            [개인정보를 언제까지 보유하고 언제 파기하는지에 대한 규정을 여기에
            작성(예: 회원 탈퇴 시 즉시 파기 등)]
          </p>

          {/* ...이하 필요한 법적 조항들을 추가합니다... */}
        </article>
      </div>
    </div>
  );
}