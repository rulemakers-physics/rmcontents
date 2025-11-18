// app/basic-service/page.tsx

import React from "react";
import Link from "next/link";
import {
  CheckCircleIcon,
  SparklesIcon,
  GiftIcon,
} from "@heroicons/react/24/solid";

export default function BasicServicePage() {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="container mx-auto max-w-5xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* 헤더 */}
          <div className="text-center">
            <p className="text-base font-semibold leading-7 text-blue-600">
              베이직 서비스
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl leading-snug">
              강력한 문제은행과
              <br />
              내신 대비 솔루션
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              합리적인 비용의 구독형 서비스로
              <br />
              RuleMakers의 핵심 데이터베이스를 활용한 컨텐츠를 경험하세요.
            </p>
          </div>

          {/* 핵심 기능 목록 */}
          <div className="mt-20">
            <h2 className="text-center text-2xl font-bold text-gray-900">
              주요 제공 서비스
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2">
              <FeatureItem
                title="기본 문제은행 서비스:"
                description="다양한 난이도와 유형의 문항으로 구성된 기본 문제은행을 제공합니다."
              />
              <FeatureItem
                title="기출 분석 및 내신 N제:"
                description="주요 학교 기출을 분석하여 내신 대비 N제 및 모의고사 서비스를 제공합니다."
              />
              <FeatureItem
                title="교육청 모의고사 변형:"
                description="최신 교육청 모의고사를 분석하고 변형 문항을 신속하게 업데이트합니다."
              />
              <FeatureItem
                title="개념서/부교재 유사 문항:"
                description="주요 개념서와 부교재를 분석하여 유사 문항을 제공해드립니다."
              />
            </div>
          </div>

          {/* 초기 도입 프로모션 */}
          <div className="mt-24 rounded-2xl bg-gray-50 p-12 ring-1 ring-gray-200">
            <div className="flex flex-col items-center text-center">
              <GiftIcon className="h-12 w-12 text-blue-600" />
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
                베이직 서비스 초기 도입 프로모션
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                최초 도입 비용 100만원, but
                <br />
                <span className="font-bold text-blue-600">
                  26년 6월까지 초기 도입 학원 무료!
                </span>
                <br />
                <span className="text-sm text-gray-500">
                  (30개 학원 등록 시 조기 종료될 수 있습니다)
                </span>
              </p>
              <p className="mt-6 font-semibold text-gray-800">
                초기 도입 시 추가 제공 혜택:
              </p>
              <ul className="mt-4 list-disc space-y-2 text-left text-gray-600">
                <li>학원 홍보용 블로그 글 업로드</li>
                <li>학원 블로그 개설 및 배너 제작</li>
                <li>학부모 상담용 가이드북 제공</li>
                <li>RuleMakers 인증서 발급</li>
                <li>컨텐츠 이용 교육 제공 (Zoom 비대면 / 현장 방문)</li>
              </ul>
              <Link
                href="/login" // 또는 상담 페이지
                className="mt-10 rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700"
              >
                지금 바로 도입 문의하기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="relative pl-9">
      <dt className="inline font-semibold text-gray-900">
        <CheckCircleIcon
          className="absolute left-1 top-1 h-5 w-5 text-blue-600"
          aria-hidden="true"
        />
        {title}
      </dt>{" "}
      <dd className="inline text-gray-600">{description}</dd>
    </div>
  );
}