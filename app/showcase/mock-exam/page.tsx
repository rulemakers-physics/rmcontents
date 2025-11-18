// app/showcase/mock-exam/page.tsx

import Image from "next/image";
import Link from "next/link";
import { CheckCircleIcon, SparklesIcon } from "@heroicons/react/24/solid";
import HitRateTable from "@/components/HitRateTable"; // [신규] 적중 사례 표 임포트

export default function MockExamPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* 1. Hero 섹션 */}
      <section className="relative bg-gray-900 text-white">
        <div className="container mx-auto max-w-5xl px-6 py-24 text-center">
          <p className="text-m font-semibold uppercase text-blue-400">
            컨텐츠 샘플
          </p>
          <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">
            학교별 실전 모의고사
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-300">
            학교별 최신 기출을 완벽 분석하여 제작된 고품질 내신 저격
            모의고사입니다.
            <br />
            실전과 가장 유사한 난이도 및 문항 구성으로 학생들의
            최종 실력 점검에 최적화되었습니다.
          </p>
        </div>
      </section>

      {/* 2. 상세 설명 섹션 */}
      <section className="py-24">
        <div className="container mx-auto max-w-5xl px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* 왼쪽: 이미지 */}
          <div className="w-full">
            <div
              className="relative w-full overflow-hidden rounded-lg bg-gray-200 shadow-xl"
              style={{ paddingTop: "75%" }} // 4:3 비율
            >
              <Image
                src="/images/mock-exam.png"
                alt="학교별 실전 모의고사 샘플"
                fill={true}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                quality={90}
                priority
              />
            </div>
          </div>
          {/* 오른쪽: 핵심 특징 */}
          <div className="w-full">
            <h2 className="text-3xl font-bold text-gray-900">
              핵심 특징
            </h2>
            <ul className="mt-8 space-y-4">
              <FeatureItem text="최신 기출 분석을 바탕으로 한 유형 완벽 반영" />
              <FeatureItem text="실전과 동일한 난이도 배분 및 문항 구성" />
              <FeatureItem text="까다로운 고난도 서술형 문항 포함" />
              <FeatureItem text="정확하고 상세한 해설지 기본 제공" />
              <FeatureItem text="요청 시 모의고사 유사 문항 추가 제공" />
            </ul>
            <Link
              href="/request"
              className="mt-10 inline-block rounded-md bg-blue-600 px-8 py-3 text-base font-medium text-white shadow-lg transition-colors hover:bg-blue-700"
            >
              프리미엄 요청하기
            </Link>
          </div>
        </div>
      </section>

      {/* 3. [신규] 학교별 적중 사례 표 */}
      <section className="bg-white py-24">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="text-center">
            <SparklesIcon className="mx-auto h-12 w-12 text-blue-600" />
            <h2 className="mt-4 text-3xl font-bold text-gray-900">
              학교별 유사 문항 적중 사례
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
              RuleMakers 연구팀의 수많은 경험과 분석 시스템을 기반으로 높은 적중률을 보여줍니다.
              <br />
              샘플 클릭 시 비교 자료를 확인하실 수 있습니다.
            </p>
          </div>
          <div className="mt-16">
            <HitRateTable />
          </div>
        </div>
      </section>

      {/* 4. 다른 샘플 보기 */}
      <section className="bg-gray-50 py-24">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              다른 컨텐츠 샘플
            </h2>
            <Link
              href="/showcase"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              모든 샘플 보기 &rarr;
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            <OtherSampleCard
              title="학교별 내신 대비 N제"
              description="특정 주제나 유형을 집중 공략할 수 있도록 설계된 문항 N제입니다."
              link="/showcase/n-set"
              imgSrc="/images/n-set.png"
            />
            <OtherSampleCard
              title="고난도 문항모음"
              description="상위권 변별을 위한 고난도 킬러 문항, 신유형 문항만을 선별하여 제공합니다."
              link="/showcase/high-difficulty"
              imgSrc="/images/high-difficulty.png"
            />
          </div>
        </div>
      </section>
    </main>
  );
}

// 페이지용 헬퍼 컴포넌트
function FeatureItem({ text }: { text: string }) {
  return (
    <li className="flex items-start">
      <CheckCircleIcon className="h-6 w-6 flex-shrink-0 text-blue-600 mt-0.5" />
      <span className="ml-3 text-lg text-gray-700">{text}</span>
    </li>
  );
}

function OtherSampleCard({
  title,
  description,
  link,
  imgSrc,
}: {
  title: string;
  description: string;
  link: string;
  imgSrc: string;
}) {
  return (
    <Link
      href={link}
      className="group block rounded-lg bg-white p-6 shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1"
    >
      <div className="flex items-start gap-4">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-200">
          <Image
            src={imgSrc}
            alt={title}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600">
            {title}
          </h3>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </Link>
  );
}