// app/showcase/high-difficulty/page.tsx

import Image from "next/image";
import Link from "next/link";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

export default function HighDifficultyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* 1. Hero 섹션 */}
      <section className="relative bg-gray-900 text-white">
        <div className="container mx-auto max-w-5xl px-6 py-24 text-center">
          <p className="text-m font-semibold uppercase text-blue-400">
            컨텐츠 샘플
          </p>
          <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">
            고난이도 문항모음zip
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-300">
            상위권 변별을 위한 고난도 킬러 문항, 신유형 문항만을 선별하여
            제공합니다. 깊이 있는 사고력과 문제 해결 능력을 배양하는 데 초점을
            맞춥니다.
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
                src="/images/high-difficulty.png"
                alt="고난이도 문항모음zip 샘플"
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
              <FeatureItem text="깊이 있는 사고력과 문제 해결 능력 배양" />
              <FeatureItem text="정교하게 설계된 고난도 킬러 문항" />
              <FeatureItem text="최신 수능/모의고사 신유형 완벽 대비" />
              <FeatureItem text="상세한 풀이 과정 및 해설 제공" />
              <FeatureItem text="컨셉별, 주제별 N제로 제공 가능" />
            </ul>
            <Link
              href="/request"
              className="mt-10 inline-block rounded-md bg-blue-600 px-8 py-3 text-base font-medium text-white shadow-lg transition-colors hover:bg-blue-700"
            >
              요청하기
            </Link>
          </div>
        </div>
      </section>

      {/* 3. 다른 샘플 보기 */}
      <section className="bg-white py-24">
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
              title="학교별 실전 모의고사"
              description="학교별 최신 기출을 완벽 분석하여 제작된 고품질 모의고사입니다."
              link="/showcase/mock-exam"
              imgSrc="/images/mock-exam.png"
            />
            <OtherSampleCard
              title="학교별 내신 대비 N제"
              description="특정 주제나 유형을 집중 공략할 수 있도록 설계된 문항 N제입니다."
              link="/showcase/n-set"
              imgSrc="/images/n-set.png"
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
      className="group block rounded-lg bg-gray-50 p-6 shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1"
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