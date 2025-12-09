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
  ChartBarIcon, // [신규] 아이콘
  ClipboardDocumentCheckIcon,
  DevicePhoneMobileIcon,
  CursorArrowRaysIcon, 
  PrinterIcon, 
  SwatchIcon
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

        {/* ▼▼▼ [추가] 모바일용 PASS Question Bank 섹션 ▼▼▼ */}
        <section className="px-6 py-16 bg-white">
          <div className="mb-8">
            <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">Premium Content Tool</span>
            <h2 className="text-2xl font-bold text-slate-900 mt-2">
              PASS Question Bank<br/>
              <span className="text-slate-400 text-lg font-medium">by RuleMakers</span>
            </h2>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed">
              원하는 문제만 골라 담으면, 고퀄리티 PDF 시험지가 즉시 생성됩니다.
            </p>
          </div>
          
          <div className="space-y-4">
            <MobileFeatureCard icon={CursorArrowRaysIcon} title="클릭 한 번으로 제작" desc="단원, 난이도, 유형별 정밀 필터링" />
            <MobileFeatureCard icon={BeakerIcon} title="High-End 킬러 문항" desc="서울대 연구진이 제작한 검증된 컨텐츠" />
            <MobileFeatureCard icon={PrinterIcon} title="완벽한 인쇄 레이아웃" desc="HWP 편집 없이 바로 출력 가능한 PDF" />
          </div>
          
          <div className="mt-6">
             <Link href="/maker-guide" className="flex items-center justify-center w-full py-3 bg-blue-50 text-blue-700 font-bold rounded-xl text-sm">
               문제은행 자세히 보기 <ArrowRight className="w-4 h-4 ml-1" />
             </Link>
          </div>
        </section>

        {/* ▼▼▼ [추가] 모바일용 Academy LMS 섹션 ▼▼▼ */}
        <section className="px-6 py-16 bg-slate-50 border-t border-slate-100">
          <div className="mb-8">
            <span className="text-emerald-600 font-bold text-xs uppercase tracking-wider">Academy LMS</span>
            <h2 className="text-2xl font-bold text-slate-900 mt-2">
              시험, 그 이후까지<br/>완벽하게 관리하세요.
            </h2>
          </div>

          <div className="grid gap-4">
             <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <ClipboardDocumentCheckIcon className="w-8 h-8 text-emerald-500 mb-3" />
                <h3 className="font-bold text-slate-900">자동 성적 분석</h3>
                <p className="text-xs text-slate-500 mt-1">
                  입력된 성적을 바탕으로 반 평균, 최고점, 학생별 위치를 자동으로 분석합니다.
                </p>
             </div>
             <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <ChartBarIcon className="w-8 h-8 text-indigo-500 mb-3" />
                <h3 className="font-bold text-slate-900">주간 리포트 발행</h3>
                <p className="text-xs text-slate-500 mt-1">
                  출석, 과제, 테스트 결과를 요약한 학부모 전송용 리포트가 클릭 한 번으로 완성됩니다.
                </p>
             </div>
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
                    <h3 className="text-lg font-bold text-slate-900">월 129,000원</h3>
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
              이제 간편하게 제작하세요.
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 max-w-2xl text-lg text-slate-300 sm:text-xl leading-relaxed"
            >
              직접 만드는 <strong>문제은행</strong>부터 전문가에게 맡기는 <strong>맞춤 제작</strong>까지.<br/>
              RuleMakers는 선생님의 수업 준비를 위한 가장 완벽한 파트너입니다.
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
        <TrustBanner />
         {/* --- 2. PASS Question Bank (Light Theme, Text Left - Image Right) --- */}
        <section className="py-32 bg-white relative overflow-hidden">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="flex flex-col md:flex-row items-center gap-16">
              
              {/* Left: Text Info */}
              <motion.div 
                initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
                className="flex-1"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <BeakerIcon className="w-6 h-6" />
                  </div>
                  <span className="text-blue-600 font-bold tracking-wide uppercase">Perfect Answer for Studying Science</span>
                </div>
                <h2 className="text-4xl font-extrabold text-slate-900 mb-6 leading-tight">
                  PASS 문제은행<br/>
                  <span className="text-slate-400">필요한 문제만 골라 담으세요</span>
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed mb-8 break-keep">
                  서울대 사범대 출신 연구진이 개발한 <strong>검증된 문항</strong>과 <strong>최신 기출 변형 문항</strong>을
                  선생님이 원하는 조건대로 자유롭게 골라 담으세요.
                  <br/><br/>
                  단원, 난이도, 객관식/서술형 필터링은 물론, 
                  <br/>클릭 몇 번으로완벽한 디자인의 PDF 시험지를 생성할 수 있습니다.
                </p>
                <ul className="space-y-4 mb-10">
                  {[
                    "자체 개발 문항 및 최신 기출 100% 반영",
                    "단원/난이도/유형(객관식, 서술형) 상세 필터링",
                    "유사 문항 무제한 교체 (One-Click)",
                    "학교 로고 삽입 및 다단(2단/4단) 편집 지원"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                      <CheckCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
                <Link href="/maker-guide" className="inline-flex items-center text-blue-600 font-bold hover:underline underline-offset-4 text-lg">
                  문제은행 기능 자세히 보기 &rarr;
                </Link>
              </motion.div>

              {/* Right: Visual Mockup */}
              <motion.div 
                initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}
                className="flex-1 relative"
              >
                <div className="relative rounded-2xl shadow-2xl border border-slate-200 overflow-hidden bg-slate-50 aspect-[4/3] group transform transition-transform hover:scale-[1.01] hover:shadow-blue-200/50">
                   <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent" />
                   <Image 
                     src="/images/maker.png" 
                     alt="PASS Question Bank UI" 
                     fill 
                     className="object-cover object-top"
                   />
                   {/* Floating Badges */}
                   <div className="absolute top-6 right-6 bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-lg border border-slate-100 flex items-center gap-2 animate-bounce-slow">
                      <CursorArrowRaysIcon className="w-5 h-5 text-blue-500" />
                      <span className="text-xs font-bold text-slate-700">Drag & Drop</span>
                   </div>
                   <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-lg border border-slate-100 flex items-center gap-2">
                      <PrinterIcon className="w-5 h-5 text-indigo-500" />
                      <span className="text-xs font-bold text-slate-700">Print Ready PDF</span>
                   </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ▼▼▼ [추가] 데스크탑용 All-in-One LMS 섹션 ▼▼▼ */}
        <section className="py-24 bg-slate-50">
          <div className="container mx-auto px-6 max-w-6xl text-center">
            <div className="mb-16">
              <span className="text-indigo-600 font-bold tracking-widest text-xs uppercase">All-in-One Academy LMS</span>
              <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                시험 출제부터 결과 리포트까지,<br/>하나의 흐름으로 완성됩니다.
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connecting Line */}
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-200 z-0">
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-300 to-transparent animate-pulse" />
              </div>

              {/* Step 1 */}
              <motion.div 
                variants={fadeInUp} initial="initial" whileInView="animate" viewport={{ once: true }}
                className="relative z-10 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group"
              >
                <div className="w-20 h-20 mx-auto bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
                  <DocumentTextIcon className="w-10 h-10 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">1. 시험지 생성</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  PASS 문제은행에서 학생 수준에 맞는 시험지를 생성하고, 수업에 활용합니다.
                </p>
              </motion.div>

              {/* Step 2 */}
              <motion.div 
                variants={fadeInUp} initial="initial" whileInView="animate" viewport={{ once: true }} transition={{ delay: 0.15 }}
                className="relative z-10 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group"
              >
                <div className="w-20 h-20 mx-auto bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors duration-300">
                  <ChartBarIcon className="w-10 h-10 text-indigo-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">2. 성적/출석 관리</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  채점 결과와 출석 현황을 시스템에 입력하면, AI가 자동으로 데이터를 분석합니다.
                </p>
              </motion.div>

              {/* Step 3 */}
              <motion.div 
                variants={fadeInUp} initial="initial" whileInView="animate" viewport={{ once: true }} transition={{ delay: 0.3 }}
                className="relative z-10 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group"
              >
                <div className="w-20 h-20 mx-auto bg-teal-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-teal-500 transition-colors duration-300">
                  <ClipboardDocumentCheckIcon className="w-10 h-10 text-teal-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">3. 리포트 발행</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  분석된 데이터를 바탕으로 전문적인 주간 리포트를 생성하여 학부모님께 전송합니다.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- 3. [UPDATED] All-in-One LMS Section --- */}
        <section className="py-24 bg-slate-50 overflow-hidden">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                수업 관리는 <span className="text-indigo-600">더 간편하게</span>,<br />
                분석은 <span className="text-indigo-600">더 정교하게</span>
              </h2>
              <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
                출석, 과제, 테스트 성적 관리부터 학부모 리포트 전송까지.<br />
                흩어져 있던 학원 관리 업무를 하나로 통합하였습니다.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1: Weekly Report */}
              <motion.div 
                variants={fadeInUp}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                  <SparklesIcon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">자동화된 주간 리포트</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  매주 반복되는 학부모 상담 준비, 이제 클릭 한 번이면 끝납니다. 
                  출석, 과제 수행률, 테스트 점수가 자동으로 집계되어 보기 편한 리포트로 생성됩니다.
                </p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-500">
                  <div className="flex justify-between mb-2">
                    <span>출석률</span>
                    <span className="font-bold text-blue-600">100%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-blue-500 rounded-full" />
                  </div>
                </div>
              </motion.div>

              {/* Feature 2: Mistake Note */}
              <motion.div 
                variants={fadeInUp}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                  <CheckCircleIcon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">학생별 오답 유형 분석</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  단순히 틀린 개수만 세지 않습니다. '몰라서', '실수', '시간부족' 등 
                  오답 원인을 태그하여 학생의 약점을 정밀하게 진단합니다.
                </p>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded">개념 부족</span>
                  <span className="px-2 py-1 bg-orange-50 text-orange-600 text-[10px] font-bold rounded">계산 실수</span>
                </div>
              </motion.div>

              {/* Feature 3: Student App */}
              <motion.div 
                variants={fadeInUp}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
                  <DevicePhoneMobileIcon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">자기주도 학습 학생 앱</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  학생들은 전용 대시보드에서 자신의 성적 추이를 확인하고, 
                  CBT 환경에서 문제를 풀며 즉시 채점 결과를 확인할 수 있습니다.
                </p>
                <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400 font-medium">
                  Student Dashboard UI
                </div>
              </motion.div>
            </div>
          </div>
        </section>
       {/* --- 3. [NEW] Custom Production (Dark Theme, Image Left - Text Right) --- */}
        <section className="py-32 bg-slate-900 text-white relative overflow-hidden">
          {/* Background Decorative */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-800/50 skew-x-12 translate-x-1/4 pointer-events-none" />
          
          <div className="container mx-auto px-6 max-w-6xl relative z-10">
            <div className="flex flex-col md:flex-row-reverse items-center gap-16">
              
              {/* Right: Text Info */}
              <motion.div 
                initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
                className="flex-1"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-indigo-300">
                    <SparklesIcon className="w-6 h-6" />
                  </div>
                  <span className="text-indigo-400 font-bold tracking-wide uppercase">Full Concierge Service</span>
                </div>
                <h2 className="text-4xl font-extrabold text-white mb-6 leading-tight">
                  복잡한 제작은 맡기세요<br/>
                  <span className="text-slate-400">맞춤형 제작 서비스</span>
                </h2>
                <p className="text-lg text-slate-300 leading-relaxed mb-8 break-keep">
                  시간은 부족하고, 퀄리티는 놓칠 수 없다면?<br/>
                  학교별 기출 분석부터 교재 제작까지, 전문 연구진에게 맡겨주세요.
                  요청사항을 남겨주시면 <strong>단 3일</strong> 안에 완벽한 결과물을 드립니다.
                </p>

                {/* 3 Steps Visualized in Text Area */}
                <div className="space-y-6 mb-10">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm ring-4 ring-indigo-900">1</div>
                    <div>
                      <h4 className="text-lg font-bold text-white">작업 요청 및 자료 업로드</h4>
                      <p className="text-sm text-slate-400">기출 문제, 참고 자료를 업로드하고 원하는 스타일을 알려주세요.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm ring-4 ring-slate-800">2</div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-200">전문가 분석 및 제작</h4>
                      <p className="text-sm text-slate-400">서울대 출신 연구진이 문항을 선별하고 교차 검수를 진행합니다.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm ring-4 ring-slate-800">3</div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-200">결과물 수령 (PDF)</h4>
                      <p className="text-sm text-slate-400">대시보드에서 완성된 고화질 PDF 파일을 즉시 다운로드하세요.</p>
                    </div>
                  </div>
                </div>

                <Link href="/request" className="inline-flex items-center text-indigo-400 font-bold hover:text-indigo-300 underline underline-offset-4 text-lg">
                  제작 요청하러 가기 &rarr;
                </Link>
              </motion.div>

              {/* Left: Visual Mockup */}
              <motion.div 
                initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}
                className="flex-1 relative"
              >
                <div className="relative rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden bg-slate-800 aspect-[4/3] group hover:border-indigo-500/30 transition-colors">
                   {/* Background Glow */}
                   <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent" />
                   
                   {/* Image */}
                   <Image 
                     src="/images/n-set.png" // n-set or high-difficulty image
                     alt="Custom Production Service" 
                     fill 
                     className="object-cover object-top opacity-90 transition-transform duration-700 group-hover:scale-105"
                   />
                   
                   {/* Overlay Text */}
                   <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-slate-950/90 to-transparent">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-indigo-600 text-[10px] font-bold text-white">3 Days</span>
                        <span className="px-2 py-0.5 rounded bg-slate-700 text-[10px] font-bold text-slate-300">Premium Quality</span>
                      </div>
                      <p className="text-white font-medium text-sm">전문가가 만드는 나만의 교재</p>
                   </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
        {/* --- 2. 핵심 역량 섹션 (Redesigned: Premium Dark & Glass) --- */}
        <section className="relative py-24 sm:py-32 bg-slate-950 overflow-hidden">
          
          {/* 배경 장식 1: 은은한 상단 조명 효과 */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />
          
          {/* 배경 장식 2: 정밀함을 상징하는 미세한 격자 패턴 */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] opacity-20 pointer-events-none" />

          <div className="container relative z-10 mx-auto max-w-6xl px-6">
            
            {/* 섹션 헤더 */}
            <div className="text-center mb-20">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/30 border border-indigo-700/50 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-4"
              >
                <SparklesIcon className="w-3 h-3" />
                Core Competency
              </motion.div>
              
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
              >
                RuleMakers만의 <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-sky-200 to-white">차별화된 전문성</span>
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto"
              >
                단순한 컨텐츠가 아닙니다. 서울대학교 출신 연구진이 직접 출제하고 검수합니다.
              </motion.p>
            </div>
            
            {/* 카드 그리드 영역 */}
            <div className="grid gap-8 md:grid-cols-3">
              
              {/* Card 1: 학교별 분석 */}
              <PremiumFeatureCard
                icon={BeakerIcon}
                title="학교별 1:1 정밀 분석"
                description="담당 학교의 교과서, 부교재, 프린트물은 물론 최신 3개년 기출 경향까지 완벽하게 분석하여 적중률 높은 컨텐츠를 설계합니다."
                delay={0}
                colorClass="text-sky-400 group-hover:text-sky-300"
                bgClass="group-hover:bg-sky-500/10 group-hover:border-sky-500/50"
              />

              {/* Card 2: 3일 완성 */}
              <PremiumFeatureCard
                icon={CpuChipIcon}
                title="3일 내의 신속한 제작"
                description="자체 개발한 '문항 데이터베이스 시스템'을 통해, 고품질의 맞춤형 교재를 업계 최단 시간인 3일 이내에 제작합니다."
                delay={0.1}
                colorClass="text-indigo-400 group-hover:text-indigo-300"
                bgClass="group-hover:bg-indigo-500/10 group-hover:border-indigo-500/50"
              />

              {/* Card 3: 서울대 연구진 */}
              <PremiumFeatureCard
                icon={AcademicCapIcon}
                title="서울대 연구진 교차 검수"
                description="서울대 사범대 출신 전문 연구진과 현직 강사로 구성된 검수팀이 교차 검수를 진행합니다."
                delay={0.2}
                colorClass="text-emerald-400 group-hover:text-emerald-300"
                bgClass="group-hover:bg-emerald-500/10 group-hover:border-emerald-500/50"
              />

            </div>
          </div>
        </section>

        {/* --- 3. 작업 방식 섹션 (Dark Theme: Neon Roadmap) --- */}
        <section
          ref={howItWorksRef}
          className="relative bg-slate-900 py-24 sm:py-32 overflow-hidden border-t border-slate-800"
        >
          {/* 배경 장식: 은은한 방사형 빛 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-sky-900/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="container relative z-10 mx-auto max-w-6xl px-6">
            
            {/* 섹션 헤더 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                3 Steps, 3 Days
              </h2>
              <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
                복잡한 과정 없이, 단 3단계로 <span className="text-sky-400 font-semibold">3일 이내</span>에 선생님만의 프리미엄 컨텐츠가 완성됩니다.
              </p>
            </motion.div>

            <div className="relative grid gap-12 md:grid-cols-3">
              
              {/* [데스크탑 전용] 연결선 (Gradient Neon Line) */}
              <div className="hidden md:block absolute top-10 left-[16%] right-[16%] h-1 bg-slate-800 rounded-full z-0 overflow-hidden">
                 {/* 흐르는 빛 효과 */}
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent w-1/2 animate-shimmer-slide opacity-50" />
                 {/* 고정 그라데이션 라인 */}
                 <div className="absolute inset-0 bg-gradient-to-r from-sky-900 via-indigo-500 to-sky-900 opacity-30" />
              </div>
              
              {/* Step 01 */}
              <DarkProcessStep
                step="01"
                title="작업 요청"
                subtitle="자료 업로드"
                description="전용 폼을 통해 작업을 요청하고, 학교 기출문제나 참고하고 싶은 자료를 업로드합니다."
                icon={ArrowDownTrayIcon}
                delay={0}
              />
              
              {/* Step 02 */}
              <DarkProcessStep
                step="02"
                title="분석 및 제작"
                subtitle="전문가 검수"
                description="서울대 연구진이 요청사항에 맞춰 문항을 선별/제작하고 정밀한 교차 검수를 진행합니다."
                icon={CpuChipIcon}
                delay={0.2}
              />
              
              {/* Step 03 */}
              <DarkProcessStep
                step="03"
                title="결과물 수령"
                subtitle="PDF 다운로드"
                description="완성된 고화질 PDF 파일을 대시보드에서 즉시 다운로드하여 수업에 활용하세요."
                icon={CheckCircleIcon}
                delay={0.4}
              />
            </div>

            {/* 하단 CTA 버튼 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="mt-20 text-center"
            >
              <Link
                href="/request"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-sky-900/30 transition-all hover:scale-105 hover:shadow-sky-500/40 ring-1 ring-white/10"
              >
                지금 바로 시작하기
              </Link>
            </motion.div>
          </div>
        </section>

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
                originalPrice="월 198,000원"
                price="월 129,000원"
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
  price,          // [수정] 메인 가격 텍스트 (ex: "월 129,000원")
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

/**
 * [신규 컴포넌트] 신뢰도 배너 (Infinite Marquee)
 * - 로고나 텍스트가 무한으로 흐르는 애니메이션
 */
const TrustBanner = () => {
  // 예시 데이터: 실제로는 제휴 학교명이나 학원 로고 이미지를 넣으면 더 좋습니다.
  const brands = [
    "서울대학교 사범대학 연구진",
    "샤인학원",
    "목동 C 수학",
    "서초 M 아카데미",
    "반포 H 고등관",
    "분당 E 입시센터",
    "중계 T 학원",
    "대치 K 학원",
  ];

  // 끊김 없는 무한 스크롤을 위해 배열을 2배로 복사
  const duplicatedBrands = [...brands, ...brands];

  return (
    <div className="w-full bg-slate-900 border-y border-slate-800 py-5 overflow-hidden flex relative z-20">
      <div className="container mx-auto max-w-6xl flex items-center relative">
        
        {/* 왼쪽 고정 라벨 (데스크탑 전용) */}
        <div className="hidden md:flex items-center pr-8 bg-slate-900 z-10 relative">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-widest whitespace-nowrap">
            Trusted by
          </span>
          <div className="h-4 w-[1px] bg-slate-700 ml-4"></div>
        </div>

        {/* 애니메이션 영역 */}
        <div className="flex-1 overflow-hidden relative mask-linear-fade">
          {/* 양옆 그라데이션 마스크 효과 (자연스럽게 사라짐) */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none" />

          <motion.div
            className="flex w-max"
            animate={{ x: ["0%", "-50%"] }} // 전체 길이의 절반만큼 이동 후 리셋 (무한 루프 원리)
            transition={{
              ease: "linear",
              duration: 25, // 속도 조절 (숫자가 클수록 느림)
              repeat: Infinity,
            }}
          >
            {duplicatedBrands.map((brand, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 mr-12 md:mr-16 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-default"
              >
                {/* 아이콘 (학교/학원 느낌) */}
                <AcademicCapIcon className="w-5 h-5 text-slate-400" />
                <span className="text-sm md:text-base font-bold text-slate-300 whitespace-nowrap">
                  {brand}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

/**
 * [신규 컴포넌트] Premium Dark Feature Card
 * - 다크 모드 전용, 호버 시 그라데이션 및 발광 효과
 */
function PremiumFeatureCard({
  icon: Icon,
  title,
  description,
  delay,
  colorClass,
  bgClass
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  delay: number;
  colorClass: string; // 아이콘 색상 제어
  bgClass: string;    // 호버 시 배경/테두리 색상 제어
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={`group relative h-full rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 ${bgClass}`}
    >
      {/* 호버 시 나타나는 내부 그라데이션 효과 */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />

      {/* 아이콘 영역 */}
      <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-slate-800 shadow-inner ring-1 ring-white/10 transition-colors duration-500 group-hover:bg-slate-950 ${colorClass}`}>
        <Icon className="h-7 w-7" />
      </div>

      {/* 텍스트 영역 */}
      <h3 className="mb-3 text-xl font-bold text-white transition-colors group-hover:text-white">
        {title}
      </h3>
      <p className="text-base leading-relaxed text-slate-400 transition-colors group-hover:text-slate-300">
        {description}
      </p>
    </motion.div>
  );
}
/**
 * [신규 컴포넌트] Dark Theme Process Step
 * - 어두운 배경에서 잘 보이는 네온 스타일 스텝
 */
function DarkProcessStep({
  step,
  title,
  subtitle,
  description,
  icon: Icon,
  delay
}: {
  step: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="relative z-10 flex flex-col items-center text-center group"
    >
      {/* 아이콘 원형 컨테이너 */}
      <div className="relative mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-800 shadow-xl ring-1 ring-white/10 group-hover:bg-slate-700 group-hover:scale-110 transition-all duration-300">
        <Icon className="h-9 w-9 text-sky-400 group-hover:text-white transition-colors" />
        
        {/* Step Number Badge */}
        <div className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-lg ring-2 ring-slate-900 transform rotate-12 group-hover:rotate-0 transition-transform">
          {step}
        </div>
      </div>

      {/* 텍스트 내용 */}
      <h3 className="text-xl font-bold text-white mb-1 group-hover:text-sky-400 transition-colors">
        {title}
      </h3>
      <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4 block">
        {subtitle}
      </span>
      <p className="text-sm text-slate-400 leading-relaxed max-w-xs group-hover:text-slate-300 transition-colors">
        {description}
      </p>
    </motion.div>
  );
}