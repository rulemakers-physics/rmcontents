// app/premium-service/page.tsx

import React from "react";
import Link from "next/link";
import {
  CheckCircleIcon,
  SparklesIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/solid";

export default function PremiumServicePage() {
  return (
    <div className="relative isolate overflow-hidden bg-white py-24 sm:py-32">
      <div className="container mx-auto max-w-5xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* 헤더 */}
          <div className="text-center">
            <p className="text-base font-semibold leading-7 text-blue-600">
              프리미엄 서비스
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl leading-snug">
              오직 강사님만을 위한
              <br />
              1:1 맞춤형 컨텐츠 제작
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              RuleMakers 연구소의 High Quality 자체 제작 문항을 활용한,
              <br />
              요청서에 따라 100% 커스터마이징 된 고난도 프리미엄 컨텐츠를 경험하세요.
            </p>
          </div>

          {/* 핵심 기능 목록 */}
          <div className="mt-20">
            <h2 className="text-center text-2xl font-bold text-gray-900">
              프리미엄 플랜 혜택
            </h2>
            <div className="mt-10 flow-root">
              <div className="-m-2 rounded-xl bg-gray-50 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
                <dl className="grid grid-cols-1 gap-x-6 gap-y-8 text-base leading-7 sm:grid-cols-2 lg:grid-cols-3">
                  <FeatureItem
                    icon={SparklesIcon}
                    title="프리미엄 문제은행"
                    description="RuleMakers 자체 개발 고난도 문항을 포함한 모든 문항 풀 사용 및 맞춤형 문항 제작"
                  />
                  <FeatureItem
                    icon={PencilSquareIcon}
                    title="커스텀 N제 & 모의고사"
                    description="요청서에 따라 기출 분석, 내신 N제, 모의고사를 맞춤 제작"
                  />
                  <FeatureItem
                    icon={CheckCircleIcon}
                    title="교육청 Full Package"
                    description="교육청 모의고사 분석, 변형 문항은 물론, 교육청 대비 모의고사 + 변형 모의고사까지"
                  />
                  <FeatureItem
                    icon={CheckCircleIcon}
                    title="주요 교재 완벽 분석"
                    description="주요 개념서 및 부교재를 분석하여 고퀄리티 유사 문항 제공"
                  />
                  <FeatureItem
                    icon={CheckCircleIcon}
                    title="컨셉별/유사문항 N제"
                    description="특정 문항의 유사문항 모음집, 킬러 컨셉별 N제 등 특화된 자료 제작"
                  />
                  <FeatureItem
                    icon={CheckCircleIcon}
                    title="신속한 제작 및 검수"
                    description="요청 후 3일 이내 완성되는, 전문가 검수까지 완료된 최종본"
                  />
                </dl>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-24 text-center">
            <Link
              href="/request"
              className="rounded-md bg-blue-600 px-10 py-4 text-lg font-medium text-white shadow-lg transition-colors hover:bg-blue-700"
            >
              지금 바로 프리미엄 컨텐츠 요청하기
            </Link>
            <p className="mt-6">
              <Link
                href="/showcase"
                className="text-base font-medium text-gray-600 hover:text-blue-600"
              >
                컨텐츠 샘플 먼저 확인하기 &rarr;
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-y-2 border-l border-gray-900/10 p-6">
      <dt className="flex items-center gap-x-3 text-base font-semibold">
        <Icon className="h-5 w-5 flex-none text-blue-600" aria-hidden="true" />
        {title}
      </dt>
      <dd className="text-gray-600">{description}</dd>
    </div>
  );
}