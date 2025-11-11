// app/page.tsx

import React from "react";
import Link from "next/link";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

// npm install @heroicons/react (아직 설치 안 하셨다면)

export default function HomePage() {
  return (
    // layout.tsx에서 Header/Footer를 제공하므로, 이 페이지는 <main>만 관리합니다.
    <main className="w-full">
      {/* Hero 섹션 */}
      <section className="bg-gray-900 text-white">
        <div className="container mx-auto flex max-w-5xl flex-col items-center px-6 py-24 text-center">
          <h1 className="text-4xl font-extrabold sm:text-5xl md:text-6xl">
            강사를 위한 <span className="text-blue-400">프리미엄 컨텐츠</span>,
            <br />
            이제 간편하게 요청하세요.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-gray-300">
            RuleMakers는 고객님의 요청에 맞춘 고품질 모의고사와 N제
            컨텐츠를
            <br />
            신속하고 정확하게 제작합니다.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/request" // 로그인했다면 바로 요청 페이지로
              className="rounded-md bg-blue-600 px-8 py-3 text-base font-medium text-white shadow-lg transition-colors hover:bg-blue-700"
            >
              지금 작업 요청하기
            </Link>
            <Link
              href="/showcase"
              className="rounded-md bg-transparent px-8 py-3 text-base font-medium text-white ring-1 ring-white hover:bg-white hover:text-gray-900"
            >
              컨텐츠 샘플 보기
            </Link>
          </div>
        </div>
      </section>

      {/* 특징(Features) 섹션 */}
      <section className="bg-white py-20">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              RuleMakers만의 핵심 역량
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              시간이 많이 소요되는 컨텐츠 제작, 이제 전문가에게 맡기세요.
            </p>
          </div>
          <div className="mt-16 grid gap-10 md:grid-cols-3">
            <FeatureCard
              icon={<CheckCircleIcon />}
              title="학교별 맞춤 제작"
              description="담당 학교의 최신 기출 경향과 부교재를 완벽하게 분석하여 맞춤형 컨텐츠를 제공합니다."
            />
            <FeatureCard
              icon={<CheckCircleIcon />}
              title="신속한 제작"
              description="체계화된 제작 파이프라인을 통해 요청하신 마감일에 맞춰 신속하게 결과물을 전달합니다."
            />
            <FeatureCard
              icon={<CheckCircleIcon />}
              title="전문가 검수"
              description="현직 강사 및 전문 컨텐츠 연구진의 다단계 검수를 거쳐 문항의 퀄리티를 보장합니다."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

// 특징 카드를 위한 재사용 컴포넌트
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode; // <-- 타입도 다시 유연한 React.ReactNode로 변경
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg bg-gray-50 p-8 shadow-sm">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
        
        {/* 그냥 아이콘을 렌더링합니다. (Heroicon은 기본 크기가 24px(h-6 w-6)입니다) */}
        {icon}

      </div>
      <h3 className="mt-6 text-xl font-bold text-gray-900">{title}</h3>
      <p className="mt-2 text-base text-gray-600">{description}</p>
    </div>
  );
}