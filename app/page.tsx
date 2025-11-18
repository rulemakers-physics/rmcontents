// app/page.tsx

"use client";

import React, { useRef, isValidElement } from "react";
import Link from "next/link";
import Image from "next/image"; // [수정] next/image import 추가
import {
  CheckCircleIcon,
  PencilSquareIcon,
  CpuChipIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/solid";
import { motion, Variants } from "framer-motion";

/**
 * 일관된 애니메이션을 위한 Variants 객체 정의
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

export default function HomePage() {
  const howItWorksRef = useRef<HTMLElement>(null);

  const handleScrollToWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="w-full">
      {/* Hero 섹션 */}
      <section className="bg-gray-900 text-white">
        <div className="container mx-auto flex max-w-5xl flex-col items-center px-6 py-24 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl font-extrabold sm:text-5xl md:text-6xl leading-snug"
          >
            강사를 위한 <span className="text-blue-400">프리미엄 컨텐츠</span>,
            <br />
            이제 간편하게 요청하세요.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 max-w-2xl text-lg text-gray-300"
          >
            RuleMakers는 고객님의 요청에 맞춘 고품질 모의고사와 N제
            컨텐츠를
            <br />
            신속하고 정확하게 제작합니다.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col gap-4 sm:flex-row"
          >
            <button
              onClick={handleScrollToWorks}
              className="rounded-md bg-blue-600 px-8 py-3 text-base font-medium text-white shadow-lg transition-colors hover:bg-blue-700 cursor-pointer"
            >
              지금 작업 요청하기
            </button>
            <Link
              href="/showcase"
              className="rounded-md bg-transparent px-8 py-3 text-base font-medium text-white ring-1 ring-white hover:bg-white hover:text-gray-900"
            >
              컨텐츠 샘플 보기
            </Link>
          </motion.div>
        </div>
      </section>

      {/* RuleMakers만의 핵심 역량 */}
      <motion.section
        variants={fadeInUp}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="bg-gray-50 py-24"
      >
        <div className="container mx-auto max-w-5xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              RuleMakers만의 핵심 역량
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              시간이 많이 소요되는 컨텐츠 제작, 이제 전문가에게 맡기세요.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon={<CheckCircleIcon />}
              title="학교별 맞춤 제작"
              description="담당 학교의 최신 기출 경향 및 교과서를 완벽하게 분석하여 맞춤형 컨텐츠를 제공합니다."
              delay={0.1}
            />
            <FeatureCard
              icon={<CheckCircleIcon />}
              title="3일 내의 신속한 제작"
              description="체계화된 제작 파이프라인을 통해 요청하신 마감일에 맞춰 신속하게 결과물을 전달합니다."
              delay={0.2}
            />
            <FeatureCard
              icon={<CheckCircleIcon />}
              title="전문가 검수"
              description="서울대 사범대 출신 전문 컨텐츠 연구진 및 현직 강사의 세밀한 검수를 거쳐 문항의 퀄리티를 보장합니다."
              delay={0.3}
            />
          </div>
        </div>
      </motion.section>

      {/* "작업 방식" 섹션 */}
      <motion.section
        ref={howItWorksRef}
        variants={fadeInUp}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="bg-gray-50 py-24"
      >
        <div className="container mx-auto max-w-5xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              간편한 작업 요청 방식
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              단 3단계로, 3일 이내에 프리미엄 컨텐츠를 완성합니다.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <ProcessStep
              icon={<PencilSquareIcon />}
              step="Step 1"
              title="작업 요청 및 자료 전송"
              description="전용 요청 폼으로 상세 내용과 참고 파일(기출 PDF 등)을 업로드합니다."
              delay={0.1}
            />
            <ProcessStep
              icon={<CpuChipIcon />}
              step="Step 2"
              title="컨텐츠 제작 및 검수"
              description="요청에 맞춰 컨텐츠를 제작하고, 세밀한 검수까지 3일 내로 진행합니다."
              delay={0.2}
            />
            <ProcessStep
              icon={<ArrowDownTrayIcon />}
              step="Step 3"
              title="결과물 다운로드"
              description="대시보드에서 완성된 컨텐츠(PDF)를 즉시 다운로드하실 수 있습니다."
              delay={0.3}
            />
          </div>

          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <Link
              href="/request"
              className="rounded-md bg-blue-600 px-10 py-4 text-lg font-medium text-white shadow-lg transition-colors hover:bg-blue-700"
            >
              지금 바로 시작하기
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* [추가] 컨텐츠 샘플 섹션 */}
      <motion.section
        variants={fadeInUp}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="bg-gray-800 py-24"
      >
        <div className="container mx-auto max-w-5xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white"> 
              압도적인 퀄리티의 맞춤형 컨텐츠
            </h2>
            <p className="mt-4 text-lg text-gray-300">
              RuleMakers는 강의의 질을 높이는 프리미엄 맞춤형 컨텐츠만을 제작합니다.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {/* [수정] imgSrc 경로를 public 폴더 기준으로 변경 */}
            <ContentSampleCard
              imgSrc="/images/mock-exam.png"
              title="학교별 실전 모의고사"
              description="최신 출제 경향과 학교별 데이터를 완벽 분석하여, 실전과 가장 유사한 난이도 및 문항 구성으로 제작됩니다. 학생들의 최종 실력 점검에 최적화된 컨텐츠입니다."
              delay={0.1}
            />
            <ContentSampleCard
              imgSrc="/images/n-set.png"
              title="학교별 내신 대비 N제"
              description="담당 학교의 교과서, 부교재, 프린트 등을 세밀하게 분석하여 내신 대비를 완성하는 학교별 맞춤형 N제입니다. 적중률 높은 문항으로 효율적인 학습을 돕습니다."
              delay={0.2}
            />
            <ContentSampleCard
              imgSrc="/images/high-difficulty.png"
              title="고난도 문항모음"
              description="상위권 변별을 위한 고난도 킬러 문항, 신유형 문항만을 선별하여 제공합니다. 깊이 있는 사고력과 문제 해결 능력을 배양하는 데 초점을 맞춥니다."
              delay={0.3}
            />
          </div>
        </div>
      </motion.section>

      {/* 최종 CTA 섹션 */}
      <motion.section
        variants={fadeInUp}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="bg-gray-900 text-white"
      >
        <div className="container mx-auto flex max-w-4xl flex-col items-center justify-between gap-8 px-6 py-20 text-center md:flex-row md:text-left">
          <div>
            <h2 className="text-3xl font-bold">
              준비되셨나요?
            </h2>
            <p className="mt-3 text-lg text-gray-300">
              고객님의 첫 번째 프리미엄 컨텐츠를 지금 바로 요청해보세요.
            </p>
          </div>
          <Link
            href="/request"
            className="flex-shrink-0 rounded-md bg-white px-8 py-3 text-base font-medium text-gray-900 shadow-lg transition-colors hover:bg-gray-200"
          >
            작업 요청 페이지로 이동
          </Link>
        </div>
      </motion.section>
    </main>
  );
}

/**
 * 카드 애니메이션 Variants
 */
const cardVariants: Variants = {
  offscreen: {
    opacity: 0,
    y: 30,
  },
  onscreen: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: "easeInOut",
      delay: delay,
    },
  }),
};

/**
 * FeatureCard 컴포넌트
 */
function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      variants={cardVariants}
      initial="offscreen"
      whileInView="onscreen"
      custom={delay}
      viewport={{ once: true }}
      whileHover={{
        y: -5,
        boxShadow:
          "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="rounded-lg bg-gray-50 p-8 shadow-sm"
    >
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
        {icon}
      </div>
      <h3 className="mt-6 text-xl font-bold text-gray-900">{title}</h3>
      <p className="mt-4 text-base text-gray-600">{description}</p>
    </motion.div>
  );
}

/**
 * ProcessStep 컴포넌트
 */
function ProcessStep({
  icon,
  step,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      variants={cardVariants}
      initial="offscreen"
      whileInView="onscreen"
      custom={delay}
      viewport={{ once: true }}
      whileHover={{
        y: -5,
        boxShadow:
          "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      }}
      transition={{ duration: 0.1, ease: "easeOut" }}
      className="rounded-lg bg-white p-8 text-center shadow"
    >
      <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
        {icon &&
          isValidElement(icon) &&
          React.cloneElement(
            icon as React.ReactElement<{ className?: string }>,
            { className: "h-8 w-8" }
          )}
      </div>
      <p className="mt-6 text-sm font-semibold uppercase text-blue-600">{step}</p>
      <h3 className="mt-2 text-xl font-bold text-gray-900">{title}</h3>
      <p className="mt-3 text-base text-gray-600">{description}</p>
    </motion.div>
  );
}

/**
 * [수정] ContentSampleCard 컴포넌트 (next/image 최적화)
 */
function ContentSampleCard({
  imgSrc,
  title,
  description,
  delay,
}: {
  imgSrc: string;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      variants={cardVariants}
      initial="offscreen"
      whileInView="onscreen"
      custom={delay}
      viewport={{ once: true }}
      whileHover={{
        y: -5,
        boxShadow:
          "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="rounded-lg bg-gray-50 shadow-sm overflow-hidden"
    >
      {/* 이미지 영역 (부모 <div>에 relative 추가) */}
      <div className="w-full h-48 bg-gray-200 relative">
        <Image
          src={imgSrc}
          alt={`${title} 샘플 이미지`}
          fill={true} // 부모 요소(div)를 꽉 채움
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // 반응형 최적화
          className="object-cover" // 이미지가 잘리지 않고 채워지도록
          //텍스트가 뭉개지지 않도록 품질을 100%로 올립니다.
          quality={100}
        />
      </div>

      {/* 텍스트 영역 */}
      <div className="p-8">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <p className="mt-3 text-base text-gray-600">{description}</p>
      </div>
    </motion.div>
  );
}