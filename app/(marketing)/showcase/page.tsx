// app/(marketing)/showcase/page.tsx

"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckBadgeIcon, 
  ArrowRightIcon, 
  DocumentArrowDownIcon,
  BeakerIcon,
  AcademicCapIcon,
  FireIcon,
  SparklesIcon
} from "@heroicons/react/24/solid";
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  DocumentCheckIcon 
} from "@heroicons/react/24/outline";

// --- 데이터 및 타입 정의 ---

type Category = "ALL" | "MOCK" | "N_SET" | "HIGH_LEVEL";

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "ALL", label: "전체 보기" },
  { id: "MOCK", label: "실전 모의고사" },
  { id: "N_SET", label: "내신대비 N제" },
  { id: "HIGH_LEVEL", label: "고난이도 문항모음zip" },
];

const SAMPLES = [
  {
    id: "mock-exam",
    category: "MOCK",
    badge: "Best Seller",
    title: "학교별 실전 모의고사",
    subtitle: "정확한 분석과 세밀한 구성으로 완성되는 맞춤형 실전 모의고사",
    description: "학교별 최신 기출 경향을 100% 반영하여 실제 시험과 가장 유사한 난이도와 유형으로 제작된 프리미엄 모의고사입니다.",
    tags: ["높은 적중률", "서술형 포함", "해설지 제공"],
    image: "/images/mock-exam.png",
    link: "/showcase/mock-exam",
    stats: { download: "1.2k", rating: "4.9" }
  },
  {
    id: "n-set",
    category: "N_SET",
    badge: "Steady Seller",
    title: "학교별 내신 대비 N제",
    subtitle: "빈출 유형 집중 공략",
    description: "교과서 및 부교재 변형 문항을 포함하여, 특정 단원이나 취약 유형을 집중적으로 훈련할 수 있는 맞춤형 N제입니다.",
    tags: ["취약점 보완", "유형별 정리", "오답노트 연계"],
    image: "/images/n-set.png",
    link: "/showcase/n-set",
    stats: { download: "850+", rating: "4.8" }
  },
  {
    id: "high-difficulty",
    category: "HIGH_LEVEL",
    badge: "Premium",
    title: "고난이도 문항모음zip",
    subtitle: "1등급 결정 킬러 문항",
    description: "상위권 변별력을 가르는 고난도 킬러 문항과 신유형만을 엄선하여 깊이 있는 사고력을 길러주는 심화 자료입니다.",
    tags: ["킬러 문항", "신유형 대비", "상위 1%"],
    image: "/images/high-difficulty.png",
    link: "/showcase/high-difficulty",
    stats: { download: "500+", rating: "5.0" }
  },
];

// --- 컴포넌트 ---

export default function ShowcasePage() {
  const [activeTab, setActiveTab] = useState<Category>("ALL");

  // 필터링 로직
  const filteredSamples = activeTab === "ALL" 
    ? SAMPLES 
    : SAMPLES.filter(s => s.category === activeTab);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* 1. Hero Section: 압도적인 비주얼 */}
      <section className="relative overflow-hidden bg-slate-900 pb-20 pt-32 text-white">
        {/* 배경 효과 */}
        <div className="absolute inset-0 z-0">
          <div className="absolute -top-24 -left-24 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[120px]" />
          <div className="absolute top-1/2 right-0 h-[400px] w-[400px] -translate-y-1/2 translate-x-1/3 rounded-full bg-indigo-600/20 blur-[100px]" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
        </div>

        <div className="container relative z-10 mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-7xl">
              RuleMakers<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                Custom Contents
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-400 leading-relaxed">
              정확한 설계로 제작되고 현장에서 검증된<br className="hidden sm:block" />
              RuleMakers만의 프리미엄 컨텐츠를 소개합니다.
            </p>
          </motion.div>

          {/* 통계 지표 (Social Proof) 주석 처리
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8 max-w-4xl mx-auto"
          >
            <StatBox label="누적 제작 문항" value="50,000+" icon={DocumentCheckIcon} />
            <StatBox label="파트너 학원/강사" value="120+" icon={UserGroupIcon} />
            <StatBox label="평균 만족도" value="4.9/5.0" icon={FireIcon} />
            <StatBox label="월간 이용자 수" value="3,500+" icon={ChartBarIcon} />
          </motion.div>*/}
        </div>
      </section>

      {/* 2. Filter Tabs */}
      <section className="sticky top-16 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 py-4">
        <div className="container mx-auto px-6 flex justify-center overflow-x-auto scrollbar-hide">
          <div className="flex space-x-2 bg-slate-100/50 p-1.5 rounded-full border border-slate-200/50">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`relative px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                  activeTab === cat.id 
                    ? "text-white shadow-md" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                {activeTab === cat.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-slate-900 rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Showcase Grid */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            layout 
            className="grid gap-12 md:gap-16"
          >
            <AnimatePresence mode="popLayout">
              {filteredSamples.map((sample, idx) => (
                <ShowcaseItem key={sample.id} sample={sample} idx={idx} />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Empty State */}
          {filteredSamples.length === 0 && (
            <div className="py-20 text-center text-slate-400">
              <BeakerIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>해당 카테고리의 샘플이 준비 중입니다.</p>
            </div>
          )}
        </div>
      </section>

      {/* 4. Bottom CTA */}
      <section className="bg-white py-24 border-t border-slate-100 text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">
            이 퀄리티 그대로,<br/>선생님의 교재로 만들어드립니다.
          </h2>
          <p className="text-slate-500 mb-10 max-w-xl mx-auto">
            지금 바로 무료 체험을 통해 문제은행을 이용해보거나,<br/>
            전문가에게 맞춤 제작을 요청해보세요.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/service/maker"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-slate-900 text-white font-bold text-lg hover:bg-slate-800 transition-all hover:scale-105 shadow-xl shadow-slate-900/20"
            >
              문제은행 무료 체험 <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Link>
            <Link 
              href="/request"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-lg hover:bg-slate-50 transition-all hover:border-slate-300"
            >
              제작 요청하기
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

// --- 하위 컴포넌트 ---

function StatBox({ label, value, icon: Icon }: any) {
  return (
    <div className="flex flex-col items-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
      <div className="mb-3 p-2 rounded-lg bg-blue-500/20 text-blue-400">
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-3xl font-black text-white mb-1">{value}</div>
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function ShowcaseItem({ sample, idx }: { sample: any, idx: number }) {
  const isEven = idx % 2 === 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, delay: idx * 0.1 }}
      className={`group flex flex-col md:flex-row gap-8 md:gap-16 items-center ${!isEven ? 'md:flex-row-reverse' : ''}`}
    >
      {/* 이미지 영역 */}
      <div className="w-full md:w-1/2 perspective-1000">
        <Link href={sample.link} className="block relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 transition-all duration-500 group-hover:shadow-blue-200/50 group-hover:scale-[1.02] group-hover:-rotate-1">
          <Image 
            src={sample.image} 
            alt={sample.title} 
            fill 
            className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
            quality={95}
          />
          {/* 호버 오버레이 */}
          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <span className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-full font-bold transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              자세히 보기 <ArrowRightIcon className="w-4 h-4" />
            </span>
          </div>
        </Link>
      </div>

      {/* 텍스트 영역 */}
      <div className="w-full md:w-1/2">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wide">
            {sample.badge}
          </span>
          <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
            {/*<DocumentArrowDownIcon className="w-4 h-4" /> {sample.stats.download} 다운로드*/}
          </div>
        </div>

        <h3 className="text-3xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
          <Link href={sample.link}>{sample.title}</Link>
        </h3>
        <p className="text-lg text-slate-500 font-medium mb-6">
          {sample.subtitle}
        </p>
        <p className="text-slate-600 leading-relaxed mb-8 break-keep">
          {sample.description}
        </p>

        {/* 태그 리스트 */}
        <div className="flex flex-wrap gap-2 mb-8">
          {sample.tags.map((tag: string, i: number) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium">
              <CheckBadgeIcon className="w-4 h-4 text-blue-500" />
              {tag}
            </span>
          ))}
        </div>

        <Link 
          href={sample.link}
          className="inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700 hover:underline underline-offset-4 transition-colors"
        >
          상세 정보 및 샘플 확인 <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}