// app/page.tsx

"use client";

import React, { useRef, isValidElement } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircleIcon,
  PencilSquareIcon,
  CpuChipIcon,
  ArrowDownTrayIcon,
  XCircleIcon,
  SparklesIcon,
  BeakerIcon,
  DocumentTextIcon,
  BoltIcon,
  AcademicCapIcon,
  ChatBubbleBottomCenterTextIcon,
  ChevronRightIcon,
  StarIcon
} from "@heroicons/react/24/solid";
import { motion, Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";

/**
 * 애니메이션 Variants
 */
const fadeInUp: Variants = {
  initial: { opacity: 0, y: 30 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function HomePage() {
  const howItWorksRef = useRef<HTMLElement>(null);

  const handleScrollToWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="w-full font-sans selection:bg-sky-200 selection:text-sky-900">
      
      {/* ========================================================================
          [MOBILE VIEW RE-DESIGN] 모바일 전용 뷰 (md:hidden)
          - 디자인 컨셉: "Mobile Premium" (Dark Mode Hero + Glassmorphism)
          - PC의 화려함을 모바일에 맞게 최적화
      ======================================================================== */}
      <div className="block md:hidden pb-24 bg-slate-50">
        
        {/* 1. Mobile Hero: PC의 감성을 가져온 Dark & Grid 스타일 */}
        <section className="relative bg-slate-950 px-6 pt-20 pb-16 overflow-hidden">
           {/* 배경 효과: PC 버전의 축소판 */}
           <div className="absolute inset-0 opacity-[0.1]" 
                style={{ backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />
           <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-sky-500/30 rounded-full blur-[80px]" />
           <div className="absolute bottom-[-20%] right-[-20%] w-[250px] h-[250px] bg-indigo-500/20 rounded-full blur-[60px]" />
           
           <div className="relative z-10 flex flex-col items-start text-left">
             <span className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-wide text-sky-400 bg-sky-900/30 border border-sky-700/50 rounded-full">
               Premium Content Service
             </span>
             <h1 className="text-4xl font-extrabold text-white leading-tight">
               선생님을 위한<br />
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-blue-500">
                 맞춤형 컨텐츠
               </span>
             </h1>
             <p className="mt-4 text-base text-slate-400 leading-relaxed">
               High End 자체제작 컨텐츠와<br/>
               학교별 기출 분석을 통한<br/> 
               선생님만의 프리미엄 커스텀 컨텐츠
             </p>
           </div>
        </section>



        {/* 3. Core Features (카드형 디자인으로 변경) */}
        <section className="px-6 py-12 bg-white">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Why RuleMakers?</h2>
          </div>
          <div className="grid gap-4">
            <MobileFeatureCard 
              icon={BeakerIcon} 
              title="학교별 1:1 정밀 분석" 
              desc="교과서, 부교재, 프린트, 최신 기출까지 완벽 반영" 
            />
            <MobileFeatureCard 
              icon={BoltIcon} 
              title="업계 최단 3일 완성" 
              desc="급한 수업 준비도 문제 없도록 신속하게 제작" 
            />
            <MobileFeatureCard 
              icon={AcademicCapIcon} 
              title="서울대 연구진 검수" 
              desc="오류 없는 무결점 고퀄리티 문항 보장" 
            />
          </div>
        </section>

        {/* 4. 3-Step Process (PC 내용을 모바일에 맞게 세로 타임라인으로 변환) */}
        <section className="px-6 py-12 bg-slate-50 border-t border-slate-100">
           <h2 className="text-xl font-bold text-slate-900 mb-2">3 Steps, 3 Days</h2>
           <p className="text-sm text-slate-500 mb-8">복잡한 과정 없이 3단계면 충분합니다.</p>
           
           <div className="space-y-8 relative pl-2">
             {/* 타임라인 선 */}
             <div className="absolute top-2 bottom-2 left-[19px] w-0.5 bg-slate-200" />
             
             <MobileProcessItem 
               step="01" 
               title="작업 요청" 
               desc="기출 문제 및 참고 자료 업로드" 
             />
             <MobileProcessItem 
               step="02" 
               title="분석 및 제작" 
               desc="전문가의 문항 출제 및 교차 검수" 
             />
             <MobileProcessItem 
               step="03" 
               title="결과물 수령" 
               desc="완성된 PDF 파일 다운로드" 
               isLast
             />
           </div>
        </section>

        {/* 5. Showcase Preview (비주얼 강화) */}
        <section className="py-12 bg-slate-900 text-white">
          <div className="px-6 mb-6 flex justify-between items-end">
             <div>
               <h2 className="text-xl font-bold text-white">제작 사례</h2>
               <p className="text-sm text-slate-400 mt-1">실제 제작된 퀄리티를 확인하세요.</p>
             </div>
             <Link href="/showcase" className="text-xs font-medium text-sky-400 underline underline-offset-4">
               더보기
             </Link>
          </div>
          
          {/* 가로 스크롤 컨테이너 */}
          <div className="flex space-x-4 overflow-x-auto pb-4 px-6 scrollbar-hide"> 
            <MobileShowcaseCard 
              category="내신 대비"
              title="OO고 1학기 기말 적중 모의고사"
              imgSrc="/images/mock-exam.png"
              href="/showcase/mock-exam"
            />
            <MobileShowcaseCard 
              category="고난도 N제"
              title="1등급을 위한 킬러 문항 모음"
              imgSrc="/images/n-set.png"
              href="/showcase/n-set"
            />
            <MobileShowcaseCard 
              category="심화 자료"
              title="최상위권 전용 시크릿 자료"
              imgSrc="/images/high-difficulty.png"
              href="/showcase/high-difficulty"
            />
          </div>
        </section>

        {/* 6. Plans Summary (간단 요약 카드) */}
        <section className="px-6 py-12 bg-white">
           <h2 className="text-xl font-bold text-slate-900 mb-6">Service Plans</h2>
           <div className="space-y-4">
             <Link href="/basic-service" className="block p-5 rounded-2xl border border-slate-200 bg-white shadow-sm active:scale-[0.99] transition-transform">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase">Basic Plan</span>
                    <h3 className="text-lg font-bold text-slate-900">월 99,000원</h3>
                  </div>
                  <div className="p-1.5 bg-slate-100 rounded-full">
                    <ChevronRightIcon className="w-4 h-4 text-slate-400"/>
                  </div>
                </div>
                <p className="text-sm text-slate-600">합리적인 가격의 기본 문제은행 서비스</p>
             </Link>

             <Link href="/premium-service" className="block p-5 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white shadow-sm ring-1 ring-sky-500/20 active:scale-[0.99] transition-transform relative overflow-hidden">
                <div className="absolute top-0 right-0 px-3 py-1 bg-sky-600 text-[10px] font-bold text-white rounded-bl-xl">
                  RECOMMENDED
                </div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs font-bold text-sky-600 uppercase">Maker's Plan</span>
                    <h3 className="text-lg font-bold text-slate-900">1:1 맞춤 제작</h3>
                  </div>
                  <div className="p-1.5 bg-white rounded-full shadow-sm">
                    <ChevronRightIcon className="w-4 h-4 text-sky-600"/>
                  </div>
                </div>
                <p className="text-sm text-slate-600">자체 제작 고난도 문항 & 커스텀 서비스</p>
             </Link>
           </div>
        </section>

        {/* 7. Contact & Footer */}
        <section className="px-6 py-10 bg-slate-50 text-center mb-10">
           <p className="text-sm text-slate-500 mb-4">
             더 자세한 내용이 궁금하시다면?
           </p>
           <Link 
             href="/contact"
             className="inline-flex items-center justify-center w-full py-3.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold shadow-sm hover:bg-slate-50"
           >
             <ChatBubbleBottomCenterTextIcon className="w-4 h-4 mr-2 text-slate-400" />
             문의 남기기
           </Link>
        </section>

        {/* 8. Mobile Sticky CTA (고정 버튼) */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-lg border-t border-slate-200 z-50">
          <Link 
            href="/request"
            className="flex items-center justify-center w-full py-4 rounded-xl bg-slate-900 text-white text-base font-bold shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-transform"
          >
            <SparklesIcon className="w-5 h-5 mr-2 text-yellow-400" />
            작업 요청하기
          </Link>
        </div>
      </div>


      {/* ========================================================================
          [DESKTOP VIEW] PC 전용 뷰 (hidden md:block)
          - 기존의 화려한 그래픽, 그리드, 상세 설명 유지
      ======================================================================== */}
      <div className="hidden md:block">
        
        {/* --- 1. Hero 섹션: Deep Navy & Glow Effect --- */}
        <section className="relative overflow-hidden bg-slate-950 text-white">
          
          {/* 배경: 은은한 조명 효과 (Glow) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
            <div className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[120px] mix-blend-screen" />
            <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] mix-blend-screen" />
          </div>

          {/* 배경: 정밀함을 상징하는 격자 무늬 (Grid Pattern) */}
          <div 
            className="absolute inset-0 z-0 opacity-[0.03]" 
            style={{
              backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}
          />

          <div className="container relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 py-32 text-center">

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl"
            >
              선생님만의{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-blue-400 to-indigo-400">
                프리미엄 컨텐츠
              </span>,
              <br />
              이제 간편하게 요청하세요.
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 max-w-2xl text-lg text-slate-300 sm:text-xl leading-relaxed"
            >
              RuleMakers는 High End 자체 제작 컨텐츠와 학교별 기출 분석을 통해
              <br className="hidden sm:block" />
              선생님만의 <strong>프리미엄 커스텀 교재</strong>를 신속하게 제작합니다.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-12 flex flex-col items-center w-full"
            >
              {/* 1. 메인 버튼 그룹 (가로 배열, 높이/스타일 통일) */}
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
                
                {/* Primary Button: 문제은행 (Gradient & Glow) */}
                <Link 
                  href="/service/maker" 
                  className="group relative flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white text-lg font-bold rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-blue-900/50 ring-1 ring-white/20"
                >
                  문제은행 무료 체험
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                {/* Secondary Button: 전국 모의고사 (Glassmorphism & Pulse Dot) */}
                <Link 
                  href="/mock-exam" 
                  className="group flex items-center justify-center gap-2 px-8 py-4 bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm border border-slate-700 hover:border-slate-500 text-white text-lg font-bold rounded-xl transition-all hover:scale-[1.02]"
                >
                  <span className="relative flex h-2 w-2 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  전국 모의고사 입장
                </Link>
              </div>

              {/* 2. 보조 텍스트 링크 (하단 배치로 시선 정리) */}
              <div className="mt-8 flex items-center gap-6 text-sm font-medium text-slate-400">
                <Link href="/pricing" className="flex items-center gap-1.5 hover:text-white transition-colors border-b border-transparent hover:border-slate-400 pb-0.5">
                  <CheckCircleIcon className="w-4 h-4 text-slate-500" />
                  요금제 보러가기
                </Link>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <Link href="/showcase" className="flex items-center gap-1.5 hover:text-white transition-colors border-b border-transparent hover:border-slate-400 pb-0.5">
                  <DocumentTextIcon className="w-4 h-4 text-slate-500" />
                  샘플 컨텐츠 보러가기
                </Link>
              </div>

            </motion.div>
          </div>
        </section>

        {/* --- 2. 핵심 역량 섹션 (Clean Bento-like Grid) --- */}
        <motion.section
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="bg-white py-24 sm:py-32"
        >
          <div className="container mx-auto max-w-6xl px-6">
            <div className="text-center mb-16">
              <h2 className="text-base font-semibold uppercase tracking-wide text-sky-600">
                Core Competency
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                RuleMakers만의 차별화된 전문성
              </p>
              <p className="mt-4 text-lg text-slate-600">
                단순한 컨텐츠가 아닙니다. 서울대학교 출신 연구진이 직접 출제하고 검수합니다.
              </p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-3">
              <FeatureCard
                icon={BeakerIcon}
                title="학교별 1:1 정밀 분석"
                description="담당 학교의 교과서, 부교재, 프린트물은 물론 최신 3개년 기출 경향까지 완벽하게 분석하여 적중률 높은 컨텐츠를 설계합니다."
              />
              <FeatureCard
                icon={CpuChipIcon}
                title="3일 내의 신속한 제작"
                description="자체 개발한 '문항 데이터베이스 시스템'을 통해, 고품질의 맞춤형 교재를 업계 최단 시간인 3일 이내에 제작합니다."
              />
              <FeatureCard
                icon={DocumentTextIcon}
                title="서울대 연구진 교차 검수"
                description="서울대 사범대 출신 전문 연구진과 현직 강사로 구성된 검수팀이 교차 검수를 진행합니다."
              />
            </div>
          </div>
        </motion.section>

        {/* --- 3. 작업 방식 섹션 (Step Process) --- */}
        <motion.section
          ref={howItWorksRef}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="relative bg-slate-50 py-24 sm:py-32"
        >
          {/* 배경 장식 */}
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:20px_20px]" />

          <div className="container relative z-10 mx-auto max-w-6xl px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                3 Steps, 3 Days
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                복잡한 과정 없이, 단 3단계로 3일 이내에 선생님만의 프리미엄 컨텐츠가 완성됩니다.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 relative">
              {/* 연결선 (데스크탑 전용) */}
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-200 z-0" />
              
              <ProcessStep
                step="01"
                title="작업 요청 및 참고 자료 업로드"
                description="전용 폼을 통해 작업을 요청하고, 학교 기출문제나 참고하고 싶은 자료를 업로드합니다."
                icon={ArrowDownTrayIcon}
              />
              <ProcessStep
                step="02"
                title="분석 및 제작"
                description="요청사항에 맞춰 문항을 선별/제작하고 세밀한 검수를 진행합니다."
                icon={CpuChipIcon}
              />
              <ProcessStep
                step="03"
                title="결과물 수령"
                description="완성된 고화질 PDF 파일을 대시보드에서 즉시 다운로드합니다."
                icon={CheckCircleIcon}
              />
            </div>

            <div className="mt-16 text-center">
              <Link
                href="/request"
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-8 py-4 text-lg font-bold text-white shadow-lg transition-transform hover:-translate-y-1 hover:bg-slate-800"
              >
                지금 바로 시작하기
              </Link>
            </div>
          </div>
        </motion.section>

        {/* --- 4. 컨텐츠 샘플 섹션 (Dark Mode) --- */}
        <motion.section
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="bg-slate-900 py-24 text-white"
        >
          <div className="container mx-auto max-w-6xl px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <h2 className="text-3xl font-bold sm:text-4xl">
                  압도적인 퀄리티의 결과물
                </h2>
                <p className="mt-4 text-lg text-slate-400">
                  학생들의 성적 향상을 이끄는 프리미엄 컨텐츠를 확인해보세요.
                </p>
              </div>
              <Link 
                href="/showcase"
                className="text-sky-400 font-medium hover:text-sky-300 flex items-center gap-1 group"
              >
                전체 샘플 보기 
                <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
              </Link>
            </div>
            
            <div className="grid gap-8 md:grid-cols-3">
              <ContentSampleCard
                imgSrc="/images/mock-exam.png"
                title="학교별 실전 모의고사"
                description="최신 출제 경향과 학교별 데이터를 완벽 분석하여, 실전과 가장 유사한 난이도 및 문항 구성으로 제작됩니다."
                // [수정] href prop 추가
                href="/showcase/mock-exam"
              />
              <ContentSampleCard
                imgSrc="/images/n-set.png"
                title="학교별 내신 대비 N제"
                description="담당 학교의 교과서, 부교재, 프린트 등을 세밀하게 분석하여 내신 대비를 완성하는 학교별 맞춤형 N제입니다."
                // [수정] href prop 추가
                href="/showcase/n-set"
              />
              <ContentSampleCard
                imgSrc="/images/high-difficulty.png"
                title="고난이도 문항모음zip"
                description="상위권 변별을 위한 고난도 킬러 문항, 신유형 문항만을 선별하여 제공합니다."
                // [수정] href prop 추가
                href="/showcase/high-difficulty"
              />
            </div>
          </div>
        </motion.section>

        {/* --- 5. 서비스 플랜 섹션 --- */}
        <motion.section
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="bg-white py-24 sm:py-32"
        >
          <div className="container mx-auto max-w-5xl px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                Service Plans
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                학원 규모와 필요에 맞는 최적의 플랜을 선택하세요.
              </p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-2 items-start">
              {/* Basic Plan */}
              <ServicePlanCard
                title="Basic Plan"
                subtitle="기본 문제은행 및 내신 대비 자료"
                planType="구독형"
                originalPrice="월 199,000원"
                price="월 99,000원"
                promotionText="2025년 Early Bird 특가"
                features={[
                { text: "기본 문제은행 서비스", included: true },
                { text: "기출 분석 및 내신대비 N제 & 모의고사", included: true },
                { text: "교육청 모의고사 분석 및 유사 문항", included: true },
                { text: "주요 개념서 및 부교재 유사 문항", included: true },
                { text: "자체 개발 고난도 문항 풀", included: false },
                { text: "요청서 기반 커스텀 제작", included: false },
                { text: "교육청 대비 모의고사 + 유사 문항 모의고사", included: false },
                { text: "컨셉별 N제 / 특정 문항 유사 문항", included: false },
              ]}
                isPrimary={false}
                link="/basic-service"
              />

              {/* Premium Plan */}
              <ServicePlanCard
                title="Maker's Plan"
                subtitle="1:1 맞춤 제작 솔루션"
                planType="연간 계약"
                price="별도 문의"
                promotionText="카카오톡 채널 상담 필요"
                features={[
                { text: "프리미엄 문제은행 서비스 (자체 개발 고난도 문항 포함)", included: true },
                { text: "기출 분석 및 내신대비 N제 & 모의고사", included: true },
                { text: "교육청 모의고사 분석 및 유사 문항", included: true },
                { text: "주요 개념서 및 부교재 유사 문항", included: true },
                { text: "자체 개발 고난도 문항 풀", included: true },
                { text: "요청서 기반 커스텀 제작", included: true },
                { text: "교육청 대비 모의고사 + 유사 문항 모의고사", included: true },
                { text: "컨셉별 N제 / 특정 문항에 대한 유사 문항 제공", included: true },
              ]}
                isPrimary={true}
                link="/premium-service"
              />
            </div>
          </div>
        </motion.section>

        {/* --- 6. 최종 CTA --- */}
        <section className="bg-slate-950 py-24 text-center">
          <div className="container mx-auto max-w-4xl px-6">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              준비되셨나요?
            </h2>
            <p className="mt-4 text-xl text-slate-400">
               선생님의 첫 번째 <span className="text-sky-400 font-semibold">프리미엄 컨텐츠를</span> 지금 바로 요청해보세요.
            </p>
            <div className="mt-10">
              <Link
                href="/request"
                className="inline-block rounded-full bg-white px-10 py-4 text-lg font-bold text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-transform hover:scale-105 hover:bg-slate-100"
              >
                작업 요청 페이지로 이동
              </Link>
            </div>
          </div>
        </section>
      </div>

    </main>
  );
}

/* --- 컴포넌트 정의 (Desktop/Mobile 공용 또는 개별) --- */

/**
 * [Mobile Only] 기능 소개 리스트 아이템
 */
function MobileFeatureItem({ 
  icon: Icon, 
  title, 
  desc 
}: { 
  icon: React.ElementType; 
  title: string; 
  desc: string; 
}) {
  return (
    <div className="flex items-start p-4 rounded-lg bg-slate-50 border border-slate-100">
      <div className="flex-shrink-0 p-2 bg-white rounded-md shadow-sm mr-4">
        <Icon className="w-6 h-6 text-sky-600" />
      </div>
      <div>
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600 mt-1">{desc}</p>
      </div>
    </div>
  );
}

/**
 * [Mobile Only] 컨텐츠 카드
 * [수정] href prop 추가 및 너비(w-64) 지정
 */
function MobileContentCard({ 
  category, 
  title, 
  imgSrc,
  href 
}: { 
  category: string; 
  title: string; 
  imgSrc: string; 
  href: string; // [수정] href prop 추가
}) {
  return (
    // [수정 1] Link 컴포넌트로 감싸고 w-64 (너비 고정)를 추가
    <Link 
      href={href}
      className="flex w-64 flex-shrink-0 overflow-hidden rounded-lg bg-white shadow-md border border-slate-200 active:scale-[0.98] transition-transform"
    >
      <div className="relative w-24 h-24 flex-shrink-0 bg-slate-200">
        <Image src={imgSrc} alt={title} fill className="object-cover" />
      </div>
      <div className="flex-1 p-3 flex flex-col justify-center">
        <span className="text-xs font-semibold text-sky-600 uppercase mb-1">{category}</span>
        <h4 className="text-sm font-bold text-slate-900 line-clamp-2">{title}</h4>
      </div>
    </Link>
  );
}

/**
 * Feature Card: Clean white style with hover effect (Desktop)
 */
function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      variants={fadeInUp}
      className="group relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-100 hover:border-sky-200"
    >
      <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors duration-300">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
        {title}
      </h3>
      <p className="mt-3 text-slate-600 leading-relaxed">{description}</p>
    </motion.div>
  );
}

/**
 * Process Step: Numbered step with icon (Desktop)
 */
function ProcessStep({
  step,
  title,
  description,
  icon: Icon,
}: {
  step: string;
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <motion.div
      variants={fadeInUp}
      className="relative z-10 flex flex-col items-center text-center"
    >
      <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg ring-4 ring-slate-50">
        <Icon className="h-8 w-8 text-sky-600" />
        <span className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white border-2 border-white">
          {step}
        </span>
      </div>
      <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600 max-w-xs">{description}</p>
    </motion.div>
  );
}

/**
 * Content Sample Card: Image focused (Desktop)
 * [수정] href prop 추가 및 motion.div 대신 Link로 감싸서 전체 카드 클릭 가능하게 함
 */
function ContentSampleCard({
  imgSrc,
  title,
  description,
  href, // [수정] href prop 추가
}: {
  imgSrc: string;
  title: string;
  description: string;
  href: string; // [수정] href prop 타입 정의
}) {
  return (
    <motion.div variants={fadeInUp}>
      <Link
        href={href} // [수정] Link 컴포넌트로 감싸고 href 적용
        className="group overflow-hidden rounded-2xl bg-slate-800 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-sky-800/50 block" // block 추가하여 Link 영역 확보
      >
        <div className="relative h-56 w-full overflow-hidden bg-slate-700">
          <Image
            src={imgSrc}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-60" />
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold text-white group-hover:text-sky-400 transition-colors">
            {title}
          </h3>
          <p className="mt-2 text-sm text-slate-400 line-clamp-2">{description}</p>
        </div>
      </Link>
    </motion.div>
  );
}

/**
 * [수정됨] ServicePlanCard: 가격 및 프로모션 정보를 위한 Props 확장
 */
function ServicePlanCard({
  title,
  subtitle,
  planType,       // [신규] "구독형" or "연간 계약" 라벨
  price,          // [수정] 메인 가격 텍스트 (ex: "월 99,000원")
  originalPrice,  // [신규] 할인 전 가격 (ex: "198,000원") - 선택적
  promotionText,  // [신규] 프로모션/안내 문구 (ex: "Early Bird 특가") - 선택적
  features,
  isPrimary,
  link,
}: {
  title: string;
  subtitle: string;
  planType: string;      // 기존 price props를 용도에 맞게 분리
  price: string;         // 실제 표시될 가격
  originalPrice?: string; // 할인 전 가격 (옵션)
  promotionText?: string; // 하단 강조 문구 (옵션)
  features: { text: string; included: boolean }[];
  isPrimary: boolean;
  link: string;
}) {
  return (
    <motion.div
      variants={fadeInUp}
      className={`relative flex flex-col h-full rounded-3xl border p-8 shadow-lg transition-all hover:-translate-y-1 ${
        isPrimary
          ? "border-sky-500 bg-slate-900 text-white ring-4 ring-sky-500/10 shadow-sky-100"
          : "border-slate-200 bg-white text-slate-900"
      }`}
    >
      {isPrimary && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-1 text-sm font-bold text-white shadow-lg">
          MOST POPULAR
        </div>
      )}

      <div className="mb-8">
        {/* 1. 플랜 타이틀 & 서브타이틀 */}
        <h3 className={`text-2xl font-bold ${isPrimary ? "text-white" : "text-slate-900"}`}>
          {title}
        </h3>
        <p className={`mt-1 text-sm ${isPrimary ? "text-slate-400" : "text-slate-500"}`}>
          {subtitle}
        </p>

        {/* 2. 가격 및 정보 표시 영역 (대폭 수정됨) */}
        <div className="mt-6">
          {/* (1) 플랜 타입 (구독형/연간 계약) */}
          <span className={`inline-block rounded-md px-2 py-1 text-xs font-bold mb-2 ${
            isPrimary 
              ? "bg-slate-800 text-sky-400 border border-slate-700" 
              : "bg-slate-100 text-slate-600 border border-slate-200"
          }`}>
            {planType}
          </span>

          {/* (2) 가격 표시 */}
          <div className="flex items-baseline flex-wrap gap-x-2">
            {originalPrice && (
              <span className={`text-lg font-medium line-through ${
                isPrimary ? "text-slate-500" : "text-slate-400"
              }`}>
                {originalPrice}
              </span>
            )}
            <span className="text-4xl font-extrabold tracking-tight">{price}</span>
          </div>

          {/* (3) 프로모션/안내 문구 */}
          {promotionText && (
            <p className={`mt-2 text-sm font-bold ${
              isPrimary ? "text-sky-400" : "text-red-600"
            }`}>
              {promotionText}
            </p>
          )}
        </div>
      </div>

      {/* 기능 목록 */}
      <ul className="mb-8 flex-1 space-y-4">
        {features.map((feature, i) => (
          <li 
            key={i} 
            className={`flex items-start gap-3 ${!feature.included && !isPrimary ? "opacity-70" : ""}`}
          >
            {feature.included ? (
              <CheckCircleIcon
                className={`h-5 w-5 flex-shrink-0 ${
                  isPrimary ? "text-sky-400" : "text-sky-600"
                }`}
              />
            ) : (
              <XCircleIcon
                className={`h-5 w-5 flex-shrink-0 ${
                  isPrimary ? "text-slate-600" : "text-slate-400"
                }`}
              />
            )}
            <span className={`text-sm ${isPrimary ? "text-slate-100" : "text-slate-800"} ${!feature.included}`}>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href={link}
        className={`mt-auto block w-full rounded-xl py-3 text-center text-base font-bold transition-colors ${
          isPrimary
            ? "bg-sky-600 text-white hover:bg-sky-500 shadow-lg shadow-sky-900/20"
            : "bg-slate-100 text-slate-900 hover:bg-slate-200"
        }`}
      >
        자세히 보기
      </Link>
    </motion.div>
  );
}

/* ========================================================================
   [NEW COMPONENT DEFINITIONS FOR MOBILE]
   아래 컴포넌트들을 파일 하단에 추가하거나 교체해주세요.
   ======================================================================== */

// 1. 카드 형태로 바뀐 Feature
function MobileFeatureCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="flex items-start p-4 rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-white shadow-sm mr-4 text-sky-600">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 mt-1 leading-snug">{desc}</p>
      </div>
    </div>
  );
}

// 2. 세로 타임라인 Process Item
function MobileProcessItem({ step, title, desc, isLast }: { step: string, title: string, desc: string, isLast?: boolean }) {
  return (
    <div className="relative flex items-start pl-4">
      {/* Circle */}
      <div className="absolute left-[10px] -translate-x-1/2 bg-white p-1">
         <div className="w-5 h-5 rounded-full bg-sky-600 text-white text-[10px] font-bold flex items-center justify-center ring-4 ring-slate-50">
           {step}
         </div>
      </div>
      <div className={`ml-4 pb-8 ${isLast ? '' : 'border-b border-slate-100'}`}>
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 mt-1">{desc}</p>
      </div>
    </div>
  );
}

// 3. 비주얼이 강화된 Showcase Card
function MobileShowcaseCard({ category, title, imgSrc, href }: { category: string, title: string, imgSrc: string, href: string }) {
  return (
    <Link href={href} className="flex-shrink-0 w-[260px] group relative rounded-xl overflow-hidden shadow-lg">
      <div className="relative h-40 bg-slate-800">
        <Image src={imgSrc} alt={title} fill className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        
        <div className="absolute bottom-0 left-0 p-4 w-full">
           <span className="inline-block px-2 py-0.5 rounded bg-sky-600 text-[10px] font-bold text-white mb-2">
             {category}
           </span>
           <h4 className="text-base font-bold text-white leading-tight line-clamp-2">
             {title}
           </h4>
        </div>
      </div>
    </Link>
  );
}