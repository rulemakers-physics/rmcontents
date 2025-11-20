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
} from "@heroicons/react/24/solid";
import { motion, Variants } from "framer-motion";

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
          [MOBILE VIEW] 모바일 전용 뷰 (md:hidden)
          - 핵심 내용 위주, 세로 스크롤 최적화, 하단 고정 버튼
      ======================================================================== */}
      <div className="block md:hidden pb-24 bg-white">
        {/* 1. Mobile Hero */}
        <section className="relative bg-slate-950 px-6 py-16 text-center overflow-hidden">
           {/* 배경 장식 */}
           <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-sky-500/20 rounded-full blur-[80px]" />
           
           <div className="relative z-10">
             <h1 className="text-3xl font-bold text-white leading-tight">
               선생님만을 위한<br />
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-blue-400">
                 단 하나의 프리미엄 컨텐츠
               </span>
             </h1>
             <p className="mt-4 text-sm text-slate-300 leading-relaxed">
               학교별 기출 분석부터 고난도 문항 제작까지,<br/>
               RuleMakers 전문가에게 맡기세요.
             </p>
           </div>
        </section>

        {/* 2. Mobile Quick Features (아이콘 리스트) */}
        <section className="px-6 py-10 bg-white">
          <h2 className="text-lg font-bold text-slate-900 mb-6">왜 RuleMakers인가요?</h2>
          <div className="space-y-4">
            <MobileFeatureItem 
              icon={BeakerIcon} 
              title="학교별 1:1 분석" 
              desc="교과서, 프린트, 기출 경향 완벽 반영" 
            />
            <MobileFeatureItem 
              icon={BoltIcon} 
              title="3일 완성" 
              desc="업계 최단 시간, 급한 수업 준비 해결" 
            />
            <MobileFeatureItem 
              icon={AcademicCapIcon} 
              title="서울대 연구진 검수" 
              desc="오류 없는 무결점 고퀄리티 문항" 
            />
          </div>
        </section>

        {/* 3. Mobile Showcase Preview (간략화) */}
        <section className="px-6 py-10 bg-slate-50 border-t border-slate-100">
          <div className="flex justify-between items-end mb-4">
             <h2 className="text-lg font-bold text-slate-900">제작 사례 미리보기</h2>
             <Link href="/showcase" className="text-xs font-medium text-sky-600 underline">
               전체보기
             </Link>
          </div>
          
          {/* [수정 시작] Mobile Showcase Preview 컨테이너 수정 */}
          <div className="flex space-x-4 overflow-x-auto pb-2 -mx-6 px-6"> 
             {/* 1. flex: 카드를 가로로 배치
                 2. space-x-4: 카드 사이의 간격
                 3. overflow-x-auto: 가로 스크롤 활성화
                 4. -mx-6 px-6: 컨테이너 좌우 패딩을 제거하고 내부 요소에 패딩을 줘서 스크롤 시 화면 밖으로 나가도록 처리
             */}
            <MobileContentCard 
              category="실전 모의고사"
              title="OO고 1학기 기말 대비"
              imgSrc="/images/mock-exam.png"
              href="/showcase/mock-exam"
            />
            <MobileContentCard 
              category="고난도 N제"
              title="1등급 킬러 문항 모음"
              imgSrc="/images/high-difficulty.png"
              href="/showcase/n-set"
            />
            {/* [수정 1] 세 번째 카드 추가 */}
            <MobileContentCard 
              category="고난도 문항모음zip"
              title="최상위권 킬러 문항 모음"
              imgSrc="/images/high-difficulty.png" // 적절한 이미지로 변경 가능
              href="/showcase/high-difficulty"
            />
          </div>
          {/* [수정 끝] */}
        </section>

        {/* 4. Mobile Contact Info */}
        <section className="px-6 py-10 bg-white text-center">
           <p className="text-sm text-slate-500 mb-4">
             궁금한 점이 있으신가요?
           </p>
           <Link 
             href="/contact"
             className="inline-flex items-center justify-center w-full py-3 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50"
           >
             <ChatBubbleBottomCenterTextIcon className="w-4 h-4 mr-2 text-slate-400" />
             문의 남기기
           </Link>
        </section>

        {/* 5. Mobile Sticky CTA (하단 고정 버튼) */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-50">
          <Link 
            href="/request"
            className="flex items-center justify-center w-full py-3.5 rounded-xl bg-sky-600 text-white text-base font-bold shadow-lg active:scale-[0.98] transition-transform"
          >
            지금 바로 작업 요청하기
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
              className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
            >
              {/* Primary CTA Button */}
              <button
                onClick={handleScrollToWorks}
                className="group relative rounded-lg bg-sky-600 px-8 py-4 text-base font-bold text-white shadow-[0_0_20px_rgba(14,165,233,0.3)] transition-all hover:bg-sky-500 hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] hover:-translate-y-0.5 cursor-pointer"
              >
                <span className="relative z-10 ">지금 작업 요청하기</span>
                {/* Inner Glow Effect */}
                <div className="absolute inset-0 -z-0 rounded-lg bg-gradient-to-t from-black/10 to-white/20 opacity-0 transition-transform group-hover:opacity-100" />
              </button>
              
              {/* Secondary CTA Button */}
              <Link
                href="/showcase"
                className="group rounded-lg border border-slate-600 bg-slate-800/50 px-8 py-4 text-base font-medium text-slate-200 backdrop-blur-sm transition-all hover:border-slate-500 hover:bg-slate-800 hover:text-white"
              >
                컨텐츠 샘플 보기 <span className="ml-1 inline-block transition-transform group-hover:translate-x-1">&rarr;</span>
              </Link>
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
                3 Step, 3 Days
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
               선생님의 첫 번째 <span className="text-sky-400 font-semibold">프리미엄 컨텐츠를</span>지금 바로 요청해보세요.
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