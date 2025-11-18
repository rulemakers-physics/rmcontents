// app/showcase/page.tsx

"use client"; // 애니메이션을 위해 "use client"가 필요합니다.

import Image from "next/image"; // [수정] Image 컴포넌트 import
import Link from "next/link"; // [신규] Link 임포트
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { motion, Variants } from "framer-motion"; // [수정] motion, Variants import

/**
 * [추가] 메인 페이지와 동일한 애니메이션 Variants
 */
const fadeInUp: Variants = {
  initial: {
    opacity: 0,
    y: 30,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
};

// [수정] 3개 항목 + [신규] slug 추가
const samples = [
  {
    title: "학교별 실전 모의고사",
    slug: "mock-exam", // [신규]
    description:
      "학교별 최신 기출을 완벽 분석하여 제작된 고품질 내신 저격 모의고사입니다.",
    features: [
      "최신 기출 분석을 바탕으로 한 유형 완벽 반영",
      "고난도 서술형 문항 포함",
      "정확한 해설지 제공",
      "모의고사 유사 문항 추가 제공(요청시)",
    ],
    mockImageUrl: "/images/mock-exam.png", // 메인 페이지와 동일한 경로
  },
  {
    title: "학교별 내신 대비 N제",
    slug: "n-set", // [신규]
    description:
      "특정 주제나 유형을 집중 공략할 수 있도록 설계된 문항 N제입니다.",
    features: [
      "킬러 문항 대비 집중 훈련",
      "학교의 출제 코드에 맞춘 문항 설계",
      "다양한 난이도 배분",
      "자료 및 유형 다각화로 내신 완벽 대비",
    ],
    mockImageUrl: "/images/n-set.png", // 메인 페이지와 동일한 경로
  },
  {
    title: "고난도 문항모음", // [추가] 세 번째 항목
    slug: "high-difficulty", // [신규]
    description:
      "상위권 변별을 위한 고난도 킬러 문항, 신유형 문항만을 선별하여 제공합니다.",
    features: [
      "깊이 있는 사고력과 문제 해결 능력 배양",
      "정교하게 설계된 킬러 문항",
      "최신 수능/모의고사 신유형 완벽 대비",
      "상세한 풀이 과정 및 해설 제공",
    ],
    mockImageUrl: "/images/high-difficulty.png", // 메인 페이지와 동일한 경로
  },
];

export default function ShowcasePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* [수정] 메인 페이지와 통일된 다크 모드 Hero 섹션 */}
      <motion.section
        className="bg-gray-900 text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto max-w-5xl px-6 py-24 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl font-extrabold sm:text-5xl"
          >
            컨텐츠 샘플
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-xl text-gray-300"
          >
            RuleMakers에서 제공하는 맞춤형 컨텐츠 퀄리티를 확인해보세요.
          </motion.p>
        </div>
      </motion.section>

      {/* [수정] 메인 섹션에 패딩 추가 */}
      <main className="flex-grow container mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <div className="space-y-20">
          {samples.map((sample, index) => (
            // [신규] motion.div를 Link로 감싸고, hover 효과를 Link로 이동
            <Link
              key={sample.title}
              href={`/showcase/${sample.slug}`}
              passHref
              className="block group" // [신규]
            >
              <motion.div
                variants={fadeInUp}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                // [신규] group-hover를 사용하여 Link 호버 시 효과 적용
                className={`flex flex-col items-center gap-12 rounded-lg bg-white p-8 shadow-lg md:flex-row transition-all duration-300 ease-in-out group-hover:shadow-2xl group-hover:-translate-y-1 ${
                  index % 2 !== 0 ? "md:flex-row-reverse" : ""
                }`}
              >
                {/* 콘텐츠 샘플 설명 (w-full md:w-1/2은 동일) */}
                <div className="w-full md:w-1/2">
                  <h2 className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {sample.title}
                  </h2>
                  <p className="mt-4 text-lg text-gray-600">
                    {sample.description}
                  </p>
                  <ul className="mt-8 space-y-3">
                    {sample.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <CheckCircleIcon className="h-6 w-6 flex-shrink-0 text-blue-600" />
                        <span className="ml-3 text-base font-medium text-gray-700">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {/* [신규] 자세히 보기 버튼 */}
                  <div className="mt-8">
                    <span className="rounded-md bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-600/10 group-hover:bg-blue-100">
                      자세히 보기 &rarr;
                    </span>
                  </div>
                </div>

                {/* [수정] 이미지 목업 (next/image로 수정) */}
                <div className="w-full md:w-1/2">
                  {/* 4:3 비율을 위한 relative 컨테이너 (plugin 불필요) */}
                  <div
                    className="relative w-full overflow-hidden rounded-lg bg-gray-200"
                    style={{ paddingTop: "75%" }} // 4:3 비율 = (3 / 4) * 100
                  >
                    <Image
                      src={sample.mockImageUrl}
                      alt={sample.title}
                      fill={true} // 'position: absolute'를 자동으로 적용
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                      // ▼▼▼ [수정] ▼▼▼
                      // 1. 텍스트가 뭉개지지 않도록 품질을 90%로 올립니다.
                      quality={90}
                      // 첫 번째와 두 번째 이미지(index 0, 1)에 priority={true}를 전달합니다.
                      priority={index < 2}
                      // ▲▲▲ [수정] ▲▲▲
                    />
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}