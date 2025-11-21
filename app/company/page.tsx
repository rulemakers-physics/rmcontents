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
  SparklesIcon
} from "@heroicons/react/24/outline";

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
                <strong>최적화된 학습 경험을 제공하는 것.</strong><br/>
                단순한 지식 전달을 넘어, 학습자가 성취를 느끼는 본질적인 가치를 전달합니다.
              </p>
            </motion.div>

            {/* Card 2: Vision */}
            <motion.div variants={fadeInUp} className="group p-8 rounded-2xl bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-500 hover:-translate-y-1">
              <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <BeakerIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Vision</h3>
              <p className="text-slate-600 leading-relaxed break-keep">
                <strong>목표 달성을 위한 최적의 경로 제시.</strong><br/>
                구체적인 목표를 설정하고 이를 달성하기 위한 가장 확실한 로드맵을 그리는 서비스를 만듭니다.
              </p>
            </motion.div>

            {/* Card 3: Identity */}
            <motion.div variants={fadeInUp} className="group p-8 rounded-2xl bg-white border border-slate-200 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-500/10 transition-all duration-500 hover:-translate-y-1">
              <div className="h-12 w-12 bg-sky-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <BuildingOffice2Icon className="h-6 w-6 text-sky-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Identity</h3>
              <p className="text-slate-600 leading-relaxed break-keep">
                <strong>New Standard of Education.</strong><br/>
                교육 현장의 목소리와 기술적 전문성을 결합하여 교육의 새로운 기준(Standard)을 제시합니다.
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
                  좋은 컨텐츠가 강사의 경쟁력이자,<br/>
                  <span className="bg-blue-100/50 px-1">곧 학생의 성적입니다.</span>
                </h2>
                
                <div className="prose prose-lg text-slate-600 leading-loose space-y-6 break-keep font-light">
                  <p>
                    안녕하세요, <strong>RuleMakers 대표 이승용</strong>입니다.
                  </p>
                  <p>
                    저는 서울대학교 화학교육과를 졸업하고 시대인재 컨텐츠팀에서의 출제 경험을 거쳐, 
                    현재는 서울 관악/동작/금천 지역에서 6개의 학원과 독서실을 직접 운영하고 있습니다.
                  </p>
                  <p>
                    수많은 학생들과 호흡하고 강사님들을 지원하며 느낀 점은 명확했습니다.
                    현장의 강사님들이 수업 준비와 행정 업무 속에서 자신만의 고퀄리티 컨텐츠를 제작하는 것은 현실적으로 매우 어렵다는 것입니다.
                  </p>
                  <div className="bg-white p-6 rounded-xl border-l-4 border-blue-600 shadow-sm italic text-slate-800">
                    "RuleMakers의 컨텐츠 시스템은 이러한 문제를 해결하기 위해 시작되었습니다."
                  </div>
                  <p>
                    저희는 단순한 양산형 문항을 제공하지 않습니다. <strong>현장 경험</strong>이 녹아있는 기획력과 <strong>자체 개발 AI 기술</strong>을 통해,
                    선생님만을 위한 High-End 맞춤형 솔루션을 제공하겠습니다.
                  </p>
                  <p className="pt-4 font-bold text-slate-900 flex items-center gap-2">
                    RuleMakers 대표 <span className="font-serif text-xl">이 승 용</span>
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
                        <p className="text-blue-600 font-medium text-sm mt-1">Founder & CEO</p>
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
                      <li className="font-bold text-slate-900 pb-2 mb-2 border-b border-slate-200 block">대표 (CEO)</li>
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

      {/* 4. Technology Section (Deep Dark with Glassmorphism) */}
      <section className="py-24 bg-slate-950 text-white overflow-hidden relative">
        {/* Abstract Background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
             <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px]" />
             <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <div className="text-center mb-20">
            <span className="text-blue-400 font-semibold tracking-widest text-xs uppercase flex items-center justify-center gap-2">
                <SparklesIcon className="w-4 h-4" /> Technology Stacks
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mt-4">Data & AI Driven Solution</h2>
            <p className="text-slate-400 mt-4 max-w-2xl mx-auto font-light break-keep">
              전문 연구진의 분석 능력에 자체 개발 AI 모델과 알고리즘이 더해져<br className="hidden md:block"/>
              독보적인 퀄리티의 컨텐츠를 생산합니다.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
             {[
                {
                  icon: CpuChipIcon, 
                  title: "AI Modeling", 
                  desc: "자체 개발한 딥러닝/머신러닝 모델과 문항 분석 기술을 활용하여 문항의 난이도, 유형, 개념 요소를 정밀하게 분석하고 분류합니다."
                },
                {
                  icon: BeakerIcon, 
                  title: "Deep Analysis", 
                  desc: "15개정 및 22개정 교육과정을 완벽하게 분해하여 개념 구조와 출제 경향을 DB화했습니다. (교과서 및 문항 전수 분석)"
                },
                {
                  icon: AcademicCapIcon, 
                  title: "Premium DB", 
                  desc: "단순 양산형 문항이 아닌, 엄선된 프리미엄 문항 데이터베이스를 바탕으로 강사님께 최적의 자료를 제공합니다."
                }
             ].map((feature, idx) => (
               <div key={idx} className="group bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-2">
                  <div className="mb-6 inline-block p-3 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                    <feature.icon className="h-8 w-8 text-blue-400 group-hover:text-blue-300" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white group-hover:text-blue-100">{feature.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed break-keep group-hover:text-slate-300">
                    {feature.desc}
                  </p>
               </div>
             ))}
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
          <ul className="space-y-3 text-slate-600 text-sm md:text-base">
            {/* 1. 일반 항목 */}
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
              <span className="font-medium text-slate-700">22개정 교육과정 교과서 및 개념 구조 연구</span>
            </li>

            {/* 2. AI 연구 */}
            <li>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                <span className="font-medium text-slate-700">자체 개발 AI 모델 기반 문항 분석 및 DB화</span>
              </div>
              <ul className="mt-1 space-y-1">
                <li className="flex items-start gap-2 pl-5 text-slate-500 text-sm">
                  <span className="text-slate-300 mt-2 h-px w-2 bg-slate-300 flex-shrink-0"></span>
                  위상 분석 기반 문항 유사도 및 특성 분석 알고리즘
                </li>
              </ul>
            </li>

            {/* 3. 컨텐츠 */}
            <li>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                <span className="font-medium text-slate-700">22개정 과학 탐구 컨텐츠 개발</span>
              </div>
              <ul className="mt-1 space-y-1">
                <li className="flex items-start gap-2 pl-5 text-slate-500 text-sm">
                  <span className="text-slate-300 mt-2 h-px w-2 bg-slate-300 flex-shrink-0"></span>
                  과학탐구 개념 학습 앱 "하루과학" 런칭
                </li>
                <li className="flex items-start gap-2 pl-5 text-slate-500 text-sm">
                  <span className="text-slate-300 mt-2 h-px w-2 bg-slate-300 flex-shrink-0"></span>
                  PASS 통합과학 개념서 집필 (Perfect Answer for Studying Science)
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
          <span className="text-xl font-bold text-slate-600">(주) RuleMakers 설립</span>
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
          <p className="text-sm text-slate-400">RuleMakers의 기반이 된 태동기 (2017 ~ 2021)</p>
        </div>
        
        {/* Timeline style items */}
        <div className="grid gap-6 border-l border-slate-200 ml-1 pl-6 py-2">
          <div className="relative group">
             <span className="absolute -left-[31px] top-2 h-2.5 w-2.5 rounded-full bg-slate-300 border-2 border-white group-hover:bg-blue-400 transition-colors"></span>
             <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
               <span className="font-bold text-slate-700 text-lg w-12">2021</span>
               <span className="text-slate-600 font-medium">(주) RuleBreakersBooks 법인 설립</span>
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
          <div className="relative group">
             <span className="absolute -left-[31px] top-2 h-2.5 w-2.5 rounded-full bg-slate-300 border-2 border-white group-hover:bg-blue-400 transition-colors"></span>
             <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
               <span className="font-bold text-slate-700 text-lg w-12">2017</span>
               <span className="text-slate-600">서울대학교 화학교육과 입학</span>
             </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</section>
    </main>
  );
}