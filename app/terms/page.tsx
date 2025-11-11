// app/terms/page.tsx

import React from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";

/**
 * 텍스트 중심의 법률 고지 페이지를 위한 공용 레이아웃입니다.
 * 가독성을 위해 Tailwind Typography 플러그인(@tailwindcss/typography)의
 * 'prose' 클래스를 사용하는 것이 가장 좋습니다.
 *
 * 💡 (설치되어 있지 않다면) 터미널에 아래 명령어를 실행하세요:
 * npm install -D @tailwindcss/typography
 *
 * ...그리고 tailwind.config.js 파일의 plugins에 추가하세요:
 * plugins: [require('@tailwindcss/typography')],
 */

export default function TermsPage() {
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
          <h1><strong>이용약관</strong></h1>
          <p className="text-sm text-gray-500">
            최종 수정일: 2025년 11월 11일
          </p>

          <p>
            <strong>RuleMakers 컨텐츠 서비스(이하 "서비스")</strong>에 오신 것을 환영합니다. 본 약관은
            서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항,
            기타 필요한 사항을 규정함을 목적으로 합니다.
          </p>

          <h2><strong>제1조 (목적)</strong></h2>
          <p>
            [제1조의 목적에 대한 상세 내용을 여기에 작성]
          </p>

          <h2><strong>제2조 (용어의 정의)</strong></h2>
          <p>
            [본 약관에서 사용하는 용어의 정의에 대한 내용을 여기에 작성]
          </p>
          <ul>
            <li>
              <strong>"서비스"</strong>라 함은 RuleMakers가 제공하는 모든
              컨텐츠 제작 및 관련 제반 서비스를 의미합니다.
            </li>
            <li>
              <strong>"회원"</strong>이라 함은 서비스에 접속하여 본 약관에 따라
              회사와 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는
              고객을 말합니다.
            </li>
          </ul>

          <h2><strong>제3조 (서비스의 제공 및 변경)</strong></h2>
          <p>
            [서비스 제공, 변경, 중단 등에 관한 규정을 여기에 작성]
          </p>

          {/* ...이하 필요한 법적 조항들을 추가합니다... */}
        </article>
      </div>
    </div>
  );
}