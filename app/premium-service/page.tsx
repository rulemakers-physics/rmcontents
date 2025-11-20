// app/premium-service/page.tsx

"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  SparklesIcon,
  PencilSquareIcon,
  ClipboardDocumentCheckIcon,
  CpuChipIcon,
  BookOpenIcon,
  IdentificationIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const premiumFeatures = [
  {
    icon: SparklesIcon,
    title: "프리미엄 문제은행",
    desc: "고난도 문항부터 서술형 문항까지. RuleMakers 자체 개발 High End 문항을 총 망라한 문항 풀로 제작하는 맞춤 자료",
  },
  {
    icon: PencilSquareIcon,
    title: "프리미엄 N제 제공",
    desc: "특정 킬러 유형부터 취약 단원, 신유형까지 원하시는 컨셉에 맞춘 특화 자료를 제작해드립니다.",
  },
  {
    icon: ClipboardDocumentCheckIcon,
    title: "학생 관리 시스템",
    desc: "진단 평가를 통한 학생 관리와 학부모 레포트. 평가 결과 기반 학습지 및 컨텐츠 추천까지",
  },
  {
    icon: BookOpenIcon,
    title: "Custom Contents",
    desc: "학교별, 학생 수준별 맞춤 컨텐츠를 바탕으로 나만의 커리큘럼 설계 기출 분석, 내신 N제, 실전 모의고사를 100% 맞춤 제작합니다.",
  },
  {
    icon: CpuChipIcon,
    title: "내신대비 Contents",
    desc: "학교별 기출 분석 레포트와 요청서에 따라 제공되는 학교별 모의고사 및 N제로 내신 완전 대비",
  },
  {
    icon: IdentificationIcon,
    title: "1:1 담당자 배정",
    desc: "선생님의 컨텐츠와 커리큘럼을 지원할 담당자를 배정하여 빠른 소통과 니즈에 맞는 컨텐츠를 제공합니다.",
  },
];

export default function PremiumServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 1. Hero Section */}
      <section className="relative bg-gray-900 py-24 text-white sm:py-32">
        <div className="container mx-auto max-w-5xl px-6 text-center">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center rounded-full bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20">
              Maker's Plan
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              지금까지 경험하지 못한,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">나만을 위한 High End 컨텐츠 연구소</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300">
              시대인재 컨텐츠팀 RuleBreakers 대표가 설립한
              <br className="hidden sm:block" />
              RuleMakers 연구소의 High Quality 자체 제작 문항들을 만나보세요.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-10 flex justify-center gap-4"
          >
            <Link
              href="/contact"
              className="rounded-lg bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              도입 문의하기
            </Link>
            <Link
              href="/showcase"
              className="group flex items-center gap-2 rounded-lg border border-gray-600 px-8 py-3.5 text-base font-semibold text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
            >
              샘플 확인하기
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 2. Benefits Grid */}
      <section className="py-24">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="mb-16 md:text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              메이커스 플랜 혜택
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              요청서에 따른 100% Custom Contents의 압도적인 퀄리티를 경험하세요.
              <br />
              단순한 문항 제공이 아닌, 선생님의 성장을 함께하는 파트너로서 동행하겠습니다.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {premiumFeatures.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-xl hover:-translate-y-1"
              >
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Bottom CTA */}
      <section className="bg-gray-900 py-20 text-center">
        <div className="container mx-auto max-w-4xl px-6">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            지금 바로 시작하세요
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            복잡한 자료 준비는 RuleMakers에게 맡기고, 선생님은 수업에만 집중하세요.
          </p>
          <div className="mt-10">
            {/* [수정] 하단 버튼: 문의 페이지(/contact)로 연결 */}
            <Link
              href="/contact"
              className="inline-block rounded-full bg-white px-10 py-4 text-lg font-bold text-gray-900 transition-transform hover:scale-105 hover:bg-gray-100"
            >
              도입 문의하기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}