"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import { 
  AcademicCapIcon, 
  BeakerIcon, 
  CpuChipIcon, 
  BuildingOffice2Icon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
  MapPinIcon,
  PhoneIcon,
  // ▼▼▼ [추가된 아이콘] ▼▼▼
  UserGroupIcon,       // 팀 아이콘
  CommandLineIcon,     // 개발 아이콘
  DocumentTextIcon,    // 컨텐츠 아이콘
  TrophyIcon,           // 뱃지용
  ChatBubbleLeftRightIcon, // [추가] CS팀 아이콘
  ServerIcon,       // [추가] 인프라/서버 아이콘
  ShareIcon,        // [추가] 그래프/네트워크 아이콘
  Square3Stack3DIcon // [추가] 레이어/구조 아이콘
} from "@heroicons/react/24/outline";
import BranchMap3D from "@/components/BranchMap3D";

// --- Animation Variants ---
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

// ▼▼▼ [1] 위치 데이터 배열 추가 (이 부분을 수정해서 내용을 채우세요) ▼▼▼
const BRANCH_LIST = [
  {
    id: 1,
    name: "샤인학원 고등 본관",
    address: "서울 동작구 여의대방로 200",
    phone: "02-6268-8262",
    type: "Academy", // 뱃지 표시용
  },
  {
    id: 2,
    name: "샤인수학과학학원",
    address: "서울 영등포구 여의대방로 79 2층, 3층",
    phone: "02-842-3504",
    type: "Academy",
  },
  {
    id: 3,
    name: "샤인학원 초중등관",
    address: "서울 동작구 대방동길 86",
    phone: "02-815-6877",
    type: "Academy",
  },
  {
    id: 4,
    name: "EG학원 금천관",
    address: "서울 금천구 남부순환로 1372 2층 EG학원",
    phone: "02-0000-0000",
    type: "Academy",
  },
  {
    id: 5,
    name: "EG학원 난곡관",
    address: "서울 관악구 남부순환로 1495 2-3층",
    phone: "02-0000-0000",
    type: "Academy",
  },
  {
    id: 6,
    name: "샤인독서실 동작 본관",
    address: "주소를 입력해주세요",
    phone: "02-0000-0000",
    type: "Study Center",
  },
];

export default function CompanyPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-500/20 selection:text-blue-900">
      
      {/* 1. Hero Section: Clean & Impactful */}
      <section className="relative w-full h-[85vh] flex items-center justify-center overflow-hidden bg-slate-950 text-white">
        {/* Background: Deep Tech Atmosphere */}
        <div className="absolute inset-0 z-0">
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
            
            <svg className="absolute inset-0 h-full w-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M40 0H0V40" stroke="white" strokeWidth="0.5" fill="none"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hero-grid)"/>
            </svg>
        </div>
        
        <div className="container relative z-10 mx-auto px-6 text-center">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="flex flex-col items-center"
          >
            {/* Logo Area */}
            <motion.div variants={fadeInUp} className="mb-10 relative flex justify-center">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-blue-500/20 rounded-full blur-2xl" />
              <img 
                src="/images/logo.png"
                alt="RuleMakers Symbol"
                className="relative h-16 md:h-20 w-auto object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
              />
            </motion.div>

            {/* Main Title */}
            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 leading-tight text-white">
              About <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-sky-400 pr-2">
                RuleMakers
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p variants={fadeInUp} className="text-lg md:text-2xl text-slate-400 font-light max-w-2xl mx-auto leading-relaxed break-keep">
              교육에 기준을 제시하는 전문가들이 모인 집단.<br/>
              데이터와 기술, 그리고 현장의 경험으로 학습의 본질을 설계합니다.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* 2. Philosophy Section */}
      <section className="py-24 bg-white border-b border-slate-100">
        <div className="container mx-auto px-6 max-w-7xl">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Card 1: Mission */}
            <motion.div variants={fadeInUp} className="group p-8 rounded-2xl bg-white border border-slate-200 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-1">
              <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <AcademicCapIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Mission</h3>
              <p className="text-slate-600 leading-relaxed break-keep">
                <strong>교육을 최적화하는 것</strong><br/>
                학습자의 상태와 학습 목표를 바탕으로 최적의 학습 경험을 설계하여 <strong>효율적인 성장</strong>을 만듭니다.
              </p>
            </motion.div>

            {/* Card 2: Vision */}
            <motion.div variants={fadeInUp} className="group p-8 rounded-2xl bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-500 hover:-translate-y-1">
              <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <BeakerIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Vision</h3>
              <p className="text-slate-600 leading-relaxed break-keep">
                <strong>최고의 교육 지원 솔루션</strong><br/>
                교수자가 학습자를 이해하는 것을 돕고, 의도한 대로 교육을 제공할 수 있도록 지원합니다.
              </p>
            </motion.div>

            {/* Card 3: Identity */}
            <motion.div variants={fadeInUp} className="group p-8 rounded-2xl bg-white border border-slate-200 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-500/10 transition-all duration-500 hover:-translate-y-1">
              <div className="h-12 w-12 bg-sky-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <BuildingOffice2Icon className="h-6 w-6 text-sky-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Identity</h3>
              <p className="text-slate-600 leading-relaxed break-keep">
                <strong>New Standard of Education</strong><br/>
                RuleMakers는 모두의 성장을 추구하고, 가치를 만들어 나가 새로운 세상을 설계합니다.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 3. CEO Section with Improved Typography */}
      <section className="py-32 bg-slate-50 overflow-hidden">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
            
            {/* CEO Message */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="relative"
            >
              {/* Decorative Quote Mark */}
              <div className="absolute -top-10 -left-4 text-9xl font-serif text-slate-200 opacity-50 select-none font-bold">“</div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <span className="h-px w-8 bg-blue-600"></span>
                  <span className="text-blue-600 font-bold tracking-widest text-sm uppercase">CEO Message</span>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-10 leading-snug break-keep">
                  에듀테크,<br/>
                  <span className="bg-blue-100/50 px-1">기술이 아니라 교육입니다.</span>
                </h2>
                
                <div className="prose prose-lg text-slate-600 leading-loose space-y-6 break-keep font-light">

                  <div className="bg-white p-6 rounded-xl border-l-4 border-blue-600 shadow-sm text-slate-800">
                    <p className="font-bold mb-4 not-italic">
                      "기술자가 아닌 교육자의 관점으로 선생님들의 고민과 아이디어가 온전히 구현될 수 있도록, 룰메이커스가 지원하겠습니다."
                    </p>
                    <ul className="list-disc pl-5 space-y-2 m-0 text-base">
                      <li>학생을 깊이 있게 이해하는 <strong>데이터 (Data)</strong></li>
                      <li>더 나은 교육 환경을 구축하는 <strong>기술 (Tech)</strong></li>
                      <li>교육자의 의도를 온전히 담아내는 <strong>컨텐츠 (Content)</strong></li>
                    </ul>
                  </div>
                
                  
                  <p className="pt-4 font-bold text-slate-900 flex items-center gap-2">
                    RuleMakers 대표이사 <span className="font-serif text-xl">이 승 용</span>
                  </p>
                </div>
              </div>
            </motion.div>

            {/* CEO Profile Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="relative"
            >
              {/* Background Blob */}
              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-60 h-60 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full opacity-30 blur-3xl" />
              
              <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 relative z-10">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900">이 승 용</h3>
                        <p className="text-blue-600 font-medium text-sm mt-1">대표이사, 창업자</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                         <img 
                        src="/images/logo.png"
                        alt="RuleMakers Symbol"/>
                    </div>
                </div>
                
                {/* History List */}
                <div className="mb-10">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                    <ClockIcon className="w-4 h-4" />
                    History
                  </h4>
                  <div className="space-y-4 relative pl-2">
                    {/* Timeline Line */}
                    <div className="absolute left-[6px] top-2 bottom-2 w-0.5 bg-slate-100"></div>
                    
                    {[
                      { year: "2023~", desc: "(주) RuleMakers 설립" },
                      { year: "2021~", desc: "(주) RuleBreakersBooks 법인 설립" },
                      { year: "2019~", desc: "RuleBreakers Contents Team 설립" },
                      { year: "2018", desc: "시대인재 컨텐츠팀 출제위원" },
                      { year: "2017", desc: "서울대학교 화학교육과 입학" }, 
                    ].map((item, i) => (
                      <div key={i} className="relative pl-6 text-sm flex flex-col sm:flex-row sm:gap-4">
                        <span className="absolute left-0 top-1.5 w-3 h-3 bg-white border-2 border-blue-400 rounded-full z-10"></span>
                        <span className="font-bold text-slate-900 min-w-[60px]">{item.year}</span>
                        <span className="text-slate-600">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Current Roles */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4" />
                    Current Roles
                  </h4>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="font-bold text-slate-900 pb-2 mb-2 border-b border-slate-200 block">대표이사 (CEO)</li>
                      <li>• RuleMakers / RuleBreakersBooks</li>
                      <li>• 샤인학원 (고등 본관 / 수학과학관 / 초중등관)</li>
                      <li>• EG학원 (금천관 / 난곡관)</li>
                      <li>• 샤인독서실 (동작 본관)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3.5. Organization & Expertise Section */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <span className="text-blue-600 font-bold tracking-widest text-xs uppercase flex items-center justify-center gap-2">
              <UserGroupIcon className="w-4 h-4" /> Organization
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 text-slate-900 leading-snug">
              각 분야 전문가들이 만드는<br />
              <span className="text-slate-500">교육의 새로운 기준</span>
            </h2>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-6" // [수정] 3열 -> 2열 그리드
          >
            {/* 1. R&D Team */}
            <motion.div variants={fadeInUp} className="relative group h-full">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white border border-slate-200 p-8 rounded-2xl h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700">
                    <AcademicCapIcon className="w-8 h-8" />
                  </div>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-600/5 text-blue-700 text-xs font-bold uppercase border border-blue-600/10">
                    <TrophyIcon className="w-3 h-3" /> Research
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">연구팀</h3>
                <p className="text-base text-slate-600 leading-relaxed break-keep mb-6">
                  서울대학교 사범대학 출신 연구진이 교육과정의 본질을 분석하고,
                  <br />최적의 학습 경험(LX)을 설계합니다.
                </p>
                <ul className="space-y-2 mt-auto pt-4 border-t border-slate-100">
                  <li className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-blue-500" /> 교육과정/교과서 심층 분석
                  </li>
                  <li className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-blue-500" /> 문항 난이도 및 위상 설계
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* 2. Contents Team */}
            <motion.div variants={fadeInUp} className="relative group h-full">
              <div className="absolute inset-0 bg-gradient-to-b from-sky-50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white border border-slate-200 p-8 rounded-2xl h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700">
                    <DocumentTextIcon className="w-8 h-8" />
                  </div>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-sky-600/5 text-sky-700 text-xs font-bold uppercase border border-sky-600/10">
                    <TrophyIcon className="w-3 h-3" /> Contents
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">컨텐츠팀</h3>
                <p className="text-base text-slate-600 leading-relaxed break-keep mb-6">
                  시대인재 컨텐츠팀 RuleBreakers 대표 및 서울대학교 출신으로 구성된
                  <br />RuleMakers 컨텐츠팀이
                  <br /> 직접 제작 및 검수하여 압도적인 퀄리티의 문항을 생산합니다.
                </p>
                <ul className="space-y-2 mt-auto pt-4 border-t border-slate-100">
                  <li className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-sky-500" /> High-End 킬러 문항 제작
                  </li>
                  <li className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-sky-500" /> 최신 수능/내신 트렌드 반영
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* 3. Dev Team */}
            <motion.div variants={fadeInUp} className="relative group h-full">
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white border border-slate-200 p-8 rounded-2xl h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700">
                    <CommandLineIcon className="w-8 h-8" />
                  </div>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-600/5 text-indigo-700 text-xs font-bold uppercase border border-indigo-600/10">
                    <TrophyIcon className="w-3 h-3" /> Dev
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">플랫폼 개발팀</h3>
                <p className="text-base text-slate-600 leading-relaxed break-keep mb-6">
                  SKY 출신 개발진이 프론트엔드&백엔드 및 알고리즘과 AI 모델을 책임지며,
                  <br />최고의 사용자 경험을 위한 안정적이고 혁신적인 기술 환경을 구축합니다.
                </p>
                <ul className="space-y-2 mt-auto pt-4 border-t border-slate-100">
                  <li className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-indigo-500" /> 자체 AI 모델 및 알고리즘 개발
                  </li>
                  <li className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-indigo-500" /> 데이터베이스 및 서비스 최적화
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* 4. CS & Solution Team [NEW] */}
            <motion.div variants={fadeInUp} className="relative group h-full">
              <div className="absolute inset-0 bg-gradient-to-b from-teal-50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white border border-slate-200 p-8 rounded-2xl h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700">
                    <ChatBubbleLeftRightIcon className="w-8 h-8" />
                  </div>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-teal-600/5 text-teal-700 text-xs font-bold uppercase border border-teal-600/10">
                    <TrophyIcon className="w-3 h-3" /> Solution & CS
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">교육 솔루션&CS팀</h3>
                <p className="text-base text-slate-600 leading-relaxed break-keep mb-6">
                  단순한 고객 응대가 아닙니다.
                  현장 경험이 풍부한
                  <br /><strong> 서울대학교 사범대학 및 서울교육대학교 출신 교육 전문가</strong>가
                  <br />직접 선생님과 학원에 최적화된 솔루션을 제안하고 밀착 관리합니다.
                </p>
                <ul className="space-y-2 mt-auto pt-4 border-t border-slate-100">
                  <li className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-teal-500" /> 1:1 맞춤형 컨설팅
                  </li>
                  <li className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-teal-500" /> 전담 매니저 밀착 케어
                  </li>
                </ul>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* 4. Technology Section (Updated: Bento Grid Style) */}
      <section className="py-24 bg-slate-950 text-white overflow-hidden relative">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full z-0">
           <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-900/20 rounded-full blur-[120px]" />
           <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[120px]" />
           {/* Grid Pattern Overlay */}
           <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
        </div>

        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <div className="text-center mb-20">
            <span className="text-blue-500 font-bold tracking-widest text-xs uppercase flex items-center justify-center gap-2">
                <CpuChipIcon className="w-4 h-4" /> Core Technology
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 leading-tight">
              Data-Driven,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                Research Based Solution
              </span>
            </h2>
            <p className="text-slate-400 mt-5 max-w-2xl mx-auto font-light break-keep leading-relaxed">
              RuleMakers는 단순한 문제은행이 아닙니다.<br />
              교육학적 깊이가 있는 <strong>연구</strong>와 <strong>기술</strong>의 결합으로 가장 정교한 맞춤형 컨텐츠를 구현합니다.
            </p>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             
             {/* Main Card: Knowledge Graph (Span 2 cols) */}
             <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-3xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <ShareIcon className="w-32 h-32 text-blue-400" />
                </div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6 border border-blue-500/30">
                    <ShareIcon className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Curriculum Knowledge Graph</h3>
                  <p className="text-slate-400 leading-relaxed break-keep max-w-lg">
                    15개정 및 22개정 교육과정을 초미세 단위(Micro-concept)로 분해하여
                    <br />체계적인 <strong>개념 구조</strong>를 구축했습니다.
                    <br />단순 단원 분류를 넘어 개념 간의 위계와 연계성을 완벽하게 구조화했습니다.
                  </p>
                </div>
             </div>

             {/* Card 2: AI Vector Search */}
             <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:border-blue-500/30 transition-colors group">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-6 border border-indigo-500/30">
                  <SparklesIcon className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">AI Vector Search</h3>
                <p className="text-sm text-slate-400 leading-relaxed break-keep">
                  문항의 텍스트와 수식을 <strong>벡터(Vector)화</strong>하여 분석합니다. 단순 키워드 매칭으로는 불가능한 '맥락이 같은 문항'을 찾아냅니다.
                </p>
             </div>

             {/* Card 3: Quality Control (Human-in-the-loop) */}
             <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:border-blue-500/30 transition-colors group">
                <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center mb-6 border border-teal-500/30">
                  <CheckCircleIcon className="w-6 h-6 text-teal-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Human-in-the-loop</h3>
                <p className="text-sm text-slate-400 leading-relaxed break-keep">
                  AI의 추천 결과는 서울대 연구진의 <strong>이중 검수(Double-Check)</strong>를 거쳐 최종 확정됩니다.
                  <br />이 데이터는 다시 AI 모델을 학습시키는 선순환 구조를 만듭니다.
                </p>
             </div>

             {/* Bottom Wide Card: Scalable Infra */}
             <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-3xl p-8 flex flex-col md:flex-row items-start md:items-center gap-6 relative overflow-hidden group">
                 <div className="w-12 h-12 bg-sky-500/20 rounded-xl flex items-center justify-center border border-sky-500/30 flex-shrink-0">
                    <ServerIcon className="w-6 h-6 text-sky-400" />
                 </div>
                 <div className="relative z-10">
                    <h3 className="text-xl font-bold text-white mb-2">Cloud Native Infrastructure</h3>
                    <p className="text-sm text-slate-400 break-keep">
                      Google Cloud Platform(GCP) 기반의 Serverless 아키텍처로
                      <br />대규모 트래픽에도 안정적인 서비스를 제공하며, 데이터 보안과 백업을 철저히 관리합니다.
                    </p>
                 </div>
             </div>

          </div>
        </div>
      </section>

      {/* 5. History Section (With Pulsing Animation) */}
<section className="py-24 bg-white">
  <div className="container mx-auto px-6 max-w-5xl">
    <div className="mb-16 pl-4 md:pl-0">
      <h2 className="text-3xl font-bold text-slate-900">RuleMakers History</h2>
      <p className="text-slate-500 mt-2">끊임없는 도전과 연구로 교육의 새로운 길을 만들어왔습니다.</p>
    </div>

    {/* Timeline Container */}
    <div className="relative border-l-2 border-slate-100 ml-4 md:ml-8 space-y-20 pb-12">
      
      {/* 2025 (Service Launch) */}
      <div className="relative pl-8 md:pl-12 group">
        {/* Pulsing Dot Effect */}
        <span className="absolute -left-[9px] top-2 h-4 w-4 rounded-full border-4 border-white bg-blue-600 shadow-md z-10"></span>
        <span className="absolute -left-[9px] top-2 h-4 w-4 rounded-full bg-blue-600 animate-ping opacity-75"></span>
        
        {/* Header: Year + Theme */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
          <h3 className="text-3xl font-bold text-blue-600 flex items-center gap-3">
            2025
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-bold uppercase tracking-wide">Now</span>
          </h3>
          <span className="hidden sm:block text-slate-300">|</span>
          <span className="text-xl font-bold text-slate-800">연구 및 대외 서비스 확장</span>
        </div>

        {/* Content Box */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
          <ul className="space-y-4 text-slate-600 text-sm md:text-base">
            
            {/* 1. 15개정 컨텐츠 개발 */}
            <li>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                <span className="font-medium text-slate-700">15개정 물리학I, 화학I, 생명과학I, 지구과학I 컨텐츠 개발</span>
              </div>
              <ul className="mt-1 space-y-1">
                <li className="flex items-start gap-2 pl-5 text-slate-500 text-sm">
                  <span className="text-slate-300 mt-2 h-px w-2 bg-slate-300 flex-shrink-0"></span>
                  <strong>ShineRoad 한 손에 잡히는 수능 개념노트</strong> 물리학1, 화학1, 생명과학1 (15개정) 출판
                </li>
                <li className="flex items-start gap-2 pl-5 text-slate-500 text-sm">
                  <span className="text-slate-300 mt-2 h-px w-2 bg-slate-300 flex-shrink-0"></span>
                  교과서 기반으로 15개정 평가원, 교육청 기출 전문항 심층 분석
                </li>
                <li className="flex items-start gap-2 pl-5 text-slate-500 text-sm">
                  <span className="text-slate-300 mt-2 h-px w-2 bg-slate-300 flex-shrink-0"></span>
                  고난도 기출 문항을 풀기 위한 단계 별 학습 문항 물리학I, 화학I, 생명과학I 약 5,000제 개발
                </li>
              </ul>
            </li>

            {/* 2. 22개정 교과서 연구 */}
            <li>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                <span className="font-medium text-slate-700">22개정 교육과정 교과서 및 개념 구조 연구</span>
              </div>
              <ul className="mt-1 space-y-1">
                <li className="flex items-start gap-2 pl-5 text-slate-500 text-sm">
                  <span className="text-slate-300 mt-2 h-px w-2 bg-slate-300 flex-shrink-0"></span>
                  22개정 통합과학 1, 2 5종 교과서 문장 단위 분석
                </li>
                <li className="flex items-start gap-2 pl-5 text-slate-500 text-sm">
                  <span className="text-slate-300 mt-2 h-px w-2 bg-slate-300 flex-shrink-0"></span>
                  22개정 일반선택(물리, 화학, 생명, 지구) 각 4종 교과서 문장 단위 분석
                </li>
                <li className="flex items-start gap-2 pl-5 text-slate-500 text-sm">
                  <span className="text-slate-300 mt-2 h-px w-2 bg-slate-300 flex-shrink-0"></span>
                  일반선택 개념서 집필을 위한 연구
                </li>
              </ul>
            </li>

            {/* 3. 22개정 통합과학 컨텐츠 */}
            <li>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                <span className="font-medium text-slate-700">22개정 통합과학 컨텐츠 개발</span>
              </div>
              <ul className="mt-1 space-y-1">
                <li className="flex items-start gap-2 pl-5 text-slate-500 text-sm">
                  <span className="text-slate-300 mt-2 h-px w-2 bg-slate-300 flex-shrink-0"></span>
                  개념 진단 문항 약 7,000개 개발 ("하루과학" 앱에서 학습 가능)
                </li>
                <li className="flex items-start gap-2 pl-5 text-slate-500 text-sm">
                  <span className="text-slate-300 mt-2 h-px w-2 bg-slate-300 flex-shrink-0"></span>
                  통합과학 자체제작 고난도 문항 약 3,500제 개발
                </li>
                <li className="flex items-start gap-2 pl-5 text-slate-500 text-sm">
                  <span className="text-slate-300 mt-2 h-px w-2 bg-slate-300 flex-shrink-0"></span>
                  <strong>PASS</strong> 통합과학 1, 2 개념서 집필 (Perfect Answer for Studying Science)
                </li>
                <li className="flex items-start gap-2 pl-5 text-slate-500 text-sm">
                  <span className="text-slate-300 mt-2 h-px w-2 bg-slate-300 flex-shrink-0"></span>
                  <strong>PASS</strong> 통합과학 1, 2 300제 집필
                </li>
              </ul>
            </li>

            {/* 4. 22개정 일반선택 컨텐츠 */}
            <li>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                <span className="font-medium text-slate-700">22개정 일반선택(물리, 화학, 생명, 지구) 컨텐츠 개발</span>
              </div>
              <ul className="mt-1 space-y-1">
                <li className="flex items-start gap-2 pl-5 text-slate-500 text-sm">
                  <span className="text-slate-300 mt-2 h-px w-2 bg-slate-300 flex-shrink-0"></span>
                  개념 진단 문항 과목당 약 6,000제 개발 ("하루과학" 앱 내에서 학습 가능)
                </li>
                <li className="flex items-start gap-2 pl-5 text-slate-500 text-sm">
                  <span className="text-slate-300 mt-2 h-px w-2 bg-slate-300 flex-shrink-0"></span>
                  단계별 학습을 위한 징검다리 문항 개발
                </li>
              </ul>
            </li>

            {/* 5. 중등 과학 컨텐츠 */}
            <li>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                <span className="font-medium text-slate-700">중등 과학 수준 진단 및 복습 컨텐츠 개발</span>
              </div>
              <ul className="mt-1 space-y-1">
                <li className="flex items-start gap-2 pl-5 text-slate-500 text-sm">
                  <span className="text-slate-300 mt-2 h-px w-2 bg-slate-300 flex-shrink-0"></span>
                  22개정 통합과학 학습에 꼭 필요한 중등 과학 개념 선별
                </li>
                <li className="flex items-start gap-2 pl-5 text-slate-500 text-sm">
                  <span className="text-slate-300 mt-2 h-px w-2 bg-slate-300 flex-shrink-0"></span>
                  학생의 중등 과학 수준을 빈틈없이 진단하고 수준을 체크할 수 있는 진단 시스템 개발
                </li>
                <li className="flex items-start gap-2 pl-5 text-slate-500 text-sm">
                  <span className="text-slate-300 mt-2 h-px w-2 bg-slate-300 flex-shrink-0"></span>
                  필수적인 중등 과학 개념 복습을 위한 개념 복습서 집필
                </li>
              </ul>
            </li>

            {/* 6. AI 모델 및 DB화 */}
            <li>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                <span className="font-medium text-slate-700">자체 개발 AI 모델 기반 문항 분석 및 DB화</span>
              </div>
              <ul className="mt-1 space-y-1">
                <li className="flex items-start gap-2 pl-5 text-slate-500 text-sm">
                  <span className="text-slate-300 mt-2 h-px w-2 bg-slate-300 flex-shrink-0"></span>
                  자사 보유 과학탐구 문항에 대해 세분화된 태그 기반 유형 분류를 통한 DB 구축
                </li>
                <li className="flex items-start gap-2 pl-5 text-slate-500 text-sm">
                  <span className="text-slate-300 mt-2 h-px w-2 bg-slate-300 flex-shrink-0"></span>
                  위상적 접근과 AI 모델을 활용한 문항 간 의미론적 거리 측정, 유사도 및 패턴 분류
                </li>
                <li className="flex items-start gap-2 pl-5 text-slate-500 text-sm">
                  <span className="text-slate-300 mt-2 h-px w-2 bg-slate-300 flex-shrink-0"></span>
                  학생 오답 데이터에 따라, 취약점 분석과 약점 보완 문항 제공 알고리즘 개발
                </li>
              </ul>
            </li>

            {/* 7. 칼럼 */}
            <li>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                <span className="font-medium text-slate-700">학생을 위한 교육 서비스</span>
              </div>
              <ul className="mt-1 space-y-1">
                <li className="flex items-start gap-2 pl-5 text-slate-500 text-sm">
                  <span className="text-slate-300 mt-2 h-px w-2 bg-slate-300 flex-shrink-0"></span>
                  15개정 과학탐구 I과목 6, 9월 모의평가 및 수능 심층 분석 칼럼 집필
                </li>
                <li className="flex items-start gap-2 pl-5 text-slate-500 text-sm">
                  <span className="text-slate-300 mt-2 h-px w-2 bg-slate-300 flex-shrink-0"></span>
                  교육과정 변동 및 입시 제도 주요 이슈 카드뉴스 발행
                </li>
                <li className="flex items-start gap-2 pl-5 text-slate-500 text-sm">
                  <span className="text-slate-300 mt-2 h-px w-2 bg-slate-300 flex-shrink-0"></span>
                  학생들을 위한 공부법, 동기부여 칼럼 집필
                </li>
                <li className="flex items-start gap-2 pl-5 text-slate-500 text-sm">
                  <span className="text-slate-300 mt-2 h-px w-2 bg-slate-300 flex-shrink-0"></span>
                  서울 소재 약 10여개 고등학교에 대해 맞춤형 통합과학 내신대비 모의고사 무료배포
                </li>
              </ul>
            </li>
            
            {/* 8. 자사 학원 */}
            <li>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                <span className="font-medium text-slate-700">서울 소재 자사 직영 학원 컨텐츠 강화</span>
              </div>
              <ul className="mt-1 space-y-1">
                <li className="flex items-start gap-2 pl-5 text-slate-500 text-sm">
                  <span className="text-slate-300 mt-2 h-px w-2 bg-slate-300 flex-shrink-0"></span>
                  통합과학 수강반 약 10여개 학교에 대해 내신 기출 분석 진행
                </li>
                <li className="flex items-start gap-2 pl-5 text-slate-500 text-sm">
                  <span className="text-slate-300 mt-2 h-px w-2 bg-slate-300 flex-shrink-0"></span>
                  개념 진단 문항 약 7,000제를 활용하여 Daily Test 진행, 간편한 복습 지도
                </li>
                <li className="flex items-start gap-2 pl-5 text-slate-500 text-sm">
                  <span className="text-slate-300 mt-2 h-px w-2 bg-slate-300 flex-shrink-0"></span>
                  자사 문항 풀 기반 유사 문항 선별하여 학교별 맞춤형 내신 저격 모의고사 4회차분 제공
                </li>
              </ul>
            </li>

            {/* 9. 제휴 및 협업 */}
            <li>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                <span className="font-medium text-slate-700">대형 학원 및 강사와 제휴 및 협업 진행</span>
              </div>
              <ul className="mt-1 space-y-1">
                <li className="flex items-start gap-2 pl-5 text-slate-500 text-sm">
                  <span className="text-slate-300 mt-2 h-px w-2 bg-slate-300 flex-shrink-0"></span>
                  서울 소재 자사 직영 학원을 위한 자체 제작 맞춤형 통합과학 및 수능 I과목 컨텐츠 공급
                </li>
                <li className="flex items-start gap-2 pl-5 text-slate-500 text-sm">
                  <span className="text-slate-300 mt-2 h-px w-2 bg-slate-300 flex-shrink-0"></span>
                  외부 강사의 개별 요청에 따른 통합과학 맞춤형 학습지, N제, 실전 모의고사 공급
                </li>
              </ul>
            </li>

            {/* 10. 멘토링 */}
            <li>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                <span className="font-medium text-slate-700">멘토링 서비스 개발 및 시범 도입</span>
              </div>
              <ul className="mt-1 space-y-1">
                <li className="flex items-start gap-2 pl-5 text-slate-500 text-sm">
                  <span className="text-slate-300 mt-2 h-px w-2 bg-slate-300 flex-shrink-0"></span>
                  상세한 매뉴얼과 체계적인 컨텐츠 기반, 학생 수준별 멘토링 서비스 개발 및 자사 직영 학원 대상 시범 운영
                </li>
              </ul>
            </li>

          </ul>
        </div>
      </div>

      {/* 2024 (Expansion) */}
      <div className="relative pl-8 md:pl-12 group">
        <span className="absolute -left-[9px] top-2 h-4 w-4 rounded-full border-4 border-white bg-slate-400 shadow-md group-hover:scale-125 transition-transform"></span>
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
          <h3 className="text-3xl font-bold text-slate-400">2024</h3>
          <span className="hidden sm:block text-slate-300">|</span>
          <span className="text-xl font-bold text-slate-700">인프라 확장 및 교육론 정립</span>
        </div>

        <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-100">
          <ul className="space-y-2 text-slate-600 text-sm">
            <li className="flex gap-2">
              <span className="mt-2 h-1 w-1 rounded-full bg-slate-400"></span>
              관악/동작 6개 학원 및 독서실 확장 운영
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1 w-1 rounded-full bg-slate-400"></span>
              15개정 교육과정 과학 탐구 교과서 심층 분석
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1 w-1 rounded-full bg-slate-400"></span>
              개념 구조화 및 교육 방법론 체계 정립
            </li>
          </ul>
        </div>
      </div>

      {/* 2023 (Establishment) */}
      <div className="relative pl-8 md:pl-12 group">
        <span className="absolute -left-[9px] top-2 h-4 w-4 rounded-full border-4 border-white bg-slate-300 shadow-md group-hover:scale-125 transition-transform"></span>
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
          <h3 className="text-3xl font-bold text-slate-300">2023</h3>
          <span className="hidden sm:block text-slate-300">|</span>
          <span className="text-xl font-bold text-slate-600">RuleMakers 설립</span>
        </div>

        <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-100">
          <ul className="space-y-2 text-slate-600 text-sm">
            <li className="flex gap-2">
              <span className="mt-2 h-1 w-1 rounded-full bg-slate-400"></span>
              연구팀(R&D) 신설 및 연구 착수
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1 w-1 rounded-full bg-slate-400"></span>
              과학 탐구 문항 데이터베이스 구축 시작
            </li>
          </ul>
        </div>
      </div>

      {/* Foundation (The Origin) */}
      <div className="relative pl-8 md:pl-12">
        <span className="absolute -left-[9px] top-2 h-4 w-4 rounded-full border-4 border-white bg-slate-200 shadow-md"></span>
        
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-400 uppercase tracking-wider">The Origin</h3>
          <p className="text-sm text-slate-400">RuleMakers 설립 이전 (2017 ~ 2021)</p>
        </div>
        
        {/* Timeline style items */}
        <div className="grid gap-6 border-l border-slate-200 ml-1 pl-6 py-2">
          <div className="relative group">
             <span className="absolute -left-[31px] top-2 h-2.5 w-2.5 rounded-full bg-slate-300 border-2 border-white group-hover:bg-blue-400 transition-colors"></span>
             <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
               <span className="font-bold text-slate-700 text-lg w-12">2021</span>
               <span className="text-slate-600 font-medium">RuleBreakersBooks 법인 설립</span>
             </div>
          </div>
          <div className="relative group">
             <span className="absolute -left-[31px] top-2 h-2.5 w-2.5 rounded-full bg-slate-300 border-2 border-white group-hover:bg-blue-400 transition-colors"></span>
             <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
               <span className="font-bold text-slate-700 text-lg w-12">2019</span>
               <span className="text-slate-600">RuleBreakers Contents Team 결성</span>
             </div>
          </div>
          <div className="relative group">
             <span className="absolute -left-[31px] top-2 h-2.5 w-2.5 rounded-full bg-slate-300 border-2 border-white group-hover:bg-blue-400 transition-colors"></span>
             <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
               <span className="font-bold text-slate-700 text-lg w-12">2018</span>
               <span className="text-slate-600">시대인재 컨텐츠팀 출제 위원 활동</span>
             </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</section>
      {/* [신규] 3D Location Map Section */}
      <section className="bg-slate-950 py-0 overflow-hidden border-y border-slate-800">
        <div className="container mx-auto px-6 pt-20 text-center">
           <motion.div 
             initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
             className="mb-10"
           >
             <span className="text-blue-500 font-bold tracking-widest text-xs uppercase">Our Locations</span>
             <h2 className="text-3xl md:text-4xl font-bold text-white mt-3">
               RuleMakers in Seoul
             </h2>
             <p className="text-slate-400 mt-4">
               관악, 동작, 금천의 교육 현장에서<br/>학생들과 가장 가까이 호흡합니다.
             </p>
           </motion.div>
        </div>
        
        {/* 3D 지도 컴포넌트 삽입 */}
        <BranchMap3D />
      </section>
{/* ▼▼▼ [2] History 섹션 바로 아래에 위치 정보 섹션 추가 ▼▼▼ */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-slate-900">Our Branches</h2>
            <p className="text-slate-500 mt-4 max-w-2xl mx-auto">
              RuleMakers는 서울 관악/동작/금천 지역을 거점으로<br />
              6개의 직영 학원 및 프리미엄 독서실을 운영하며 현장과 호흡합니다.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {BRANCH_LIST.map((branch) => (
              <motion.div
                key={branch.id}
                variants={fadeInUp}
                className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    branch.type === 'Academy' 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {branch.type}
                  </span>
                  {/* 네이버/카카오맵 아이콘 등을 넣어 링크 연결 가능 */}
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors">
                  {branch.name}
                </h3>
                
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{branch.address}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <PhoneIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <span className="font-medium">{branch.phone}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      
    </main>
  );
}