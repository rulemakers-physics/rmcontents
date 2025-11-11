// app/showcase/page.tsx

"use client"; // 애니메이션을 위해 "use client"가 필요합니다.

import Image from "next/image"; // [수정] Image 컴포넌트 import
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

// [수정] 3개 항목으로 업데이트
const samples = [
  {
    title: "학교별 내신 대비 모의고사",
    description:
      "학교별 최신 기출을 완벽 분석하여 제작된 고품질 내신 저격 모의고사입니다.",
    features: [
      "최신 기출 분석을 바탕으로 한 유형 완벽 반영",
      "고난도 서술형 문항 포함",
      "정확한 해설지 제공",
      "모의고사 유사 문항 추가 제공(요청시)",
    ],
    mockImageUrl: "/images/mock-exam.jpg", // 메인 페이지와 동일한 경로
  },
  {
    title: "내신 대비 N제",
    description:
      "특정 주제나 유형을 집중 공략할 수 있도록 설계된 문항 N제입니다.",
    features: [
      "킬러 문항 대비 집중 훈련",
      "학교의 출제 코드에 맞춘 문항 설계",
      "다양한 난이도 배분",
      "자료 및 유형 다각화로 내신 완벽 대비",
    ],
    mockImageUrl: "/images/n-set.jpg", // 메인 페이지와 동일한 경로
  },
  {
    title: "고난도 문항모음", // [추가] 세 번째 항목
    description:
      "상위권 변별을 위한 고난도 킬러 문항, 신유형 문항만을 선별하여 제공합니다.",
    features: [
      "깊이 있는 사고력과 문제 해결 능력 배양",
      "정교하게 설계된 킬러 문항",
      "최신 수능/모의고사 신유형 완벽 대비",
      "상세한 풀이 과정 및 해설 제공",
    ],
    mockImageUrl: "/images/high-difficulty.jpg", // 메인 페이지와 동일한 경로
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
            // [수정] motion.div로 변경 및 애니메이션 적용
            <motion.div
              key={sample.title}
              variants={fadeInUp}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              // [수정] 짝수/홀수 번째(index)에 따라 레이아웃 뒤집기
              className={`flex flex-col items-center gap-12 rounded-lg bg-white p-8 shadow-lg md:flex-row ${
                index % 2 !== 0 ? "md:flex-row-reverse" : ""
              }`}
            >
              {/* 콘텐츠 샘플 설명 (w-full md:w-1/2은 동일) */}
              <div className="w-full md:w-1/2">
                <h2 className="text-3xl font-bold text-gray-900">
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
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}