"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  AcademicCapIcon, 
  BeakerIcon, 
  CpuChipIcon, 
  BuildingOffice2Icon 
} from "@heroicons/react/24/outline";

// 애니메이션 변수
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 }
};

export default function CompanyPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      
      {/* 1. Hero Section: Identity */}
      <section className="relative overflow-hidden bg-slate-900 py-32 text-center text-white">
        <div className="absolute inset-0 opacity-20">
          {/* 배경 패턴용 그리드 (선택 사항) */}
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 40L40 0H20L0 20M40 40V20L20 40" stroke="white" strokeWidth="1" fill="none"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)"/>
          </svg>
        </div>
        
        <div className="container relative mx-auto px-6">
          <motion.div {...fadeInUp}>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              RuleMakers
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 font-light max-w-2xl mx-auto">
              교육에 기준을 제시하는 전문가들이 모인 집단
            </p>
          </motion.div>
        </div>
      </section>

      {/* 2. Mission, Vision, Identity (이미지 내용 반영) */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Mission */}
            <motion.div 
              {...fadeInUp}
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
            >
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6 text-blue-600">
                <AcademicCapIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Mission</h3>
              <p className="text-slate-600 leading-relaxed">
                최적화된 학습 경험을 제공하는 것.<br/>
                단순한 지식 전달을 넘어, 학습의 본질적인 가치를 전달합니다.
              </p>
            </motion.div>

            {/* Vision */}
            <motion.div 
              {...fadeInUp}
              transition={{ delay: 0.1 }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
            >
              <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6 text-indigo-600">
                <BeakerIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Vision</h3>
              <p className="text-slate-600 leading-relaxed">
                구체적인 목표를 설정하고 이를 달성하기 위한 최적의 경로를 제시하는 서비스를 만드는 것.
              </p>
            </motion.div>

            {/* Identity */}
            <motion.div 
              {...fadeInUp}
              transition={{ delay: 0.2 }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
            >
              <div className="h-12 w-12 bg-sky-100 rounded-lg flex items-center justify-center mb-6 text-sky-600">
                <BuildingOffice2Icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Identity</h3>
              <p className="text-slate-600 leading-relaxed">
                교육 현장의 목소리와 기술적 전문성을 결합하여 교육의 새로운 기준(Standard)을 제시합니다.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. CEO Message & Profile */}
      <section className="py-24">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            
            {/* CEO Message */}
            <motion.div {...fadeInUp}>
              <h2 className="text-3xl font-bold text-slate-900 mb-8">
                CEO 인사말
              </h2>
              <div className="prose prose-lg text-slate-600 leading-relaxed">
                <p>
                  안녕하세요, <strong>RuleMakers 대표 이승용</strong>입니다.
                </p>
                <p>
                  저는 서울대학교 화학교육과를 졸업하고 시대인재 컨텐츠팀에서의 출제 경험을 거쳐, 
                  현재는 서울 관악/동작/금천 지역에서 6개의 학원과 독서실을 직접 운영하고 있습니다.
                </p>
                <p>
                  수많은 학생들과 호흡하고 강사님들을 지원하며 느낀 점은 명확했습니다.
                  <strong> "좋은 컨텐츠가 강사의 경쟁력이자, 학생의 성적이다."</strong>
                </p>
                <p>
                  하지만 현장의 강사님들이 수업 준비와 행정 업무 속에서 
                  자신만의 고퀄리티 컨텐츠를 제작하는 것은 현실적으로 매우 어렵습니다.
                  RuleMakers의 컨텐츠 시스템은 이러한 문제를 해결하기 위해 시작되었습니다.
                </p>
                <p>
                  저희는 단순한 양산형 문항을 제공하지 않습니다. <strong>현장 경험</strong>이 녹아있는 기획력과 <strong>자체 개발 AI 기술</strong>을 통해,
                  선생님만의 철학이 담긴 High-End 맞춤형 솔루션을 제공하겠습니다.
                </p>
                <p className="mt-6 font-medium text-slate-900">
                  RuleMakers와 함께 교육의 새로운 기준을 만들어 가시길 바랍니다.
                </p>
              </div>
            </motion.div>

            {/* CEO Profile Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-slate-50 p-8 rounded-3xl border border-slate-200"
            >
              <h3 className="text-xl font-bold mb-6 border-b pb-4 border-slate-200">Profile</h3>
              
              {/* 학력/경력 */}
              <div className="mb-8">
                <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-3">Education & Experience</h4>
                <ul className="space-y-3 text-sm text-slate-700">
                  <li className="flex gap-3"><span className="font-bold min-w-[60px]">2017</span> 서울대학교 화학교육과 입학</li>
                  <li className="flex gap-3"><span className="font-bold min-w-[60px]">2018</span> 시대인재 컨텐츠팀 출제위원</li>
                  <li className="flex gap-3"><span className="font-bold min-w-[60px]">2019~</span> RuleBreakers Contents Team 창립</li>
                  <li className="flex gap-3"><span className="font-bold min-w-[60px]">2021~</span> (주)RuleBreakersBooks 법인 설립</li>
                  <li className="flex gap-3"><span className="font-bold min-w-[60px]">2023~</span> RuleMakers 설립</li>
                </ul>
              </div>

              {/* 현재 직책 */}
              <div>
                <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-3">Current Roles</h4>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="font-bold text-slate-900 pb-1">대표 (CEO)</li>
                    <li>• RuleMakers / RuleBreakersBooks</li>
                    <li>• 샤인학원 (고등본관 / 대방관 / 보라매관)</li>
                    <li>• EG학원 (금천 고등관 / 중등관 / 난곡 고등관 / 중등관)</li>
                    <li>• 샤인독서실 (동작 본점)</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. Technology & R&D Section (신규 추가) */}
      <section className="py-20 bg-slate-900 text-white overflow-hidden">
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <span className="text-blue-400 font-semibold tracking-wider text-sm uppercase">Technology</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3">Data & AI Driven Solution</h2>
            <p className="text-slate-400 mt-4 max-w-2xl mx-auto">
              RuleMakers의 연구팀은 전문 연구진의 문항 분석 능력에
              자체 개발한 AI 알고리즘을 더해 독보적인 퀄리티를 만들어냅니다.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
             <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-2xl">
                <CpuChipIcon className="h-10 w-10 text-blue-400 mb-4" />
                <h3 className="text-xl font-bold mb-2">AI Modeling</h3>
                <p className="text-sm text-slate-400">
                  자체 개발한 딥러닝/머신러닝 모델과 문항 분석 기술을 활용하여 문항의 난이도, 유형, 개념 요소를 정밀하게 분석하고 분류합니다.
                </p>
             </div>
             <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-2xl">
                <BeakerIcon className="h-10 w-10 text-indigo-400 mb-4" />
                <h3 className="text-xl font-bold mb-2">Deep Analysis</h3>
                <p className="text-sm text-slate-400">
                  15개정 및 22개정 교육과정을 완벽하게 분해하여 개념 구조와 출제 경향을 DB화했습니다. (교과서 및 문항 전수 분석)
                </p>
             </div>
             <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-2xl">
                <AcademicCapIcon className="h-10 w-10 text-sky-400 mb-4" />
                <h3 className="text-xl font-bold mb-2">Premium DB</h3>
                <p className="text-sm text-slate-400">
                  단순 양산형 문항이 아닌, 엄선된 프리미엄 문항 데이터베이스를 바탕으로 강사님께 최적의 자료를 제공합니다.
                </p>
             </div>
          </div>
        </div>
      </section>

      {/* 5. History (Timeline 재구성) */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-16">
             <h2 className="text-3xl font-bold text-slate-900">RuleMakers History</h2>
             <p className="text-slate-500 mt-2">끊임없는 도전과 연구로 교육의 길을 만들어왔습니다.</p>
          </div>

          <div className="relative border-l-2 border-slate-200 pl-8 ml-4 md:ml-8 space-y-16">
            
            {/* 2025 */}
            <div className="relative">
              <span className="absolute -left-[43px] top-1 h-6 w-6 rounded-full border-4 border-white bg-blue-600 shadow-lg"></span>
              <h3 className="text-2xl font-bold text-blue-600 mb-4">2025</h3>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 space-y-2">
                <p className="font-bold text-slate-800">• RuleMakers 서비스 공식 런칭</p>
                <p className="text-slate-600">• 22개정 과학 탐구 컨텐츠 개발 및 분석 완료</p>
                <p className="text-slate-600">• 자체 개발 AI(머신러닝, 딥러닝)모델 기반 문항 분석 연구 및 DB화</p>
                <p className="text-slate-600">• 학습 커리큘럼 설계 및 서비스 운영</p>
                <p className="text-slate-600">• 일반 선택 교과서 및 개념 구조 방법론 연구</p>
              </div>
            </div>

            {/* 2024 */}
            <div className="relative">
              <span className="absolute -left-[43px] top-1 h-6 w-6 rounded-full border-4 border-white bg-slate-400"></span>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">2024</h3>
              <div className="space-y-2 text-slate-600">
                <p><strong className="text-slate-800">• 관악/동작 6개 학원 및 독서실 확장 운영</strong></p>
                <p>• 22개정 과학 탐구(통합과학) 교과서 분석 연구</p>
                <p>• 15 & 22개정 개념 구조 및 교육 방법론 정립</p>
              </div>
            </div>

            {/* 2023 */}
            <div className="relative">
              <span className="absolute -left-[43px] top-1 h-6 w-6 rounded-full border-4 border-white bg-slate-300"></span>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">2023</h3>
              <div className="space-y-2 text-slate-600">
                <p><strong className="text-slate-800">• RuleMakers 창업</strong></p>
                <p>• 연구팀(R&D) 신설</p>
                <p>• 15개정 과학 탐구 교과서 및 문항 데이터베이스 구축 시작</p>
              </div>
            </div>

            {/* 2017~2021 (Foundation) */}
            <div className="relative">
              <span className="absolute -left-[43px] top-1 h-6 w-6 rounded-full border-4 border-white bg-slate-200"></span>
              <h3 className="text-xl font-bold text-slate-500 mb-4">Foundation (2017 ~ 2021)</h3>
              <div className="space-y-3 text-sm text-slate-500">
                <div className="flex gap-4">
                  <span className="font-bold w-12">2021</span>
                  <span>RuleBreakersBooks 출판 법인 설립</span>
                </div>
                <div className="flex gap-4">
                  <span className="font-bold w-12">2019</span>
                  <span>RuleBreakers Contents Team 결성</span>
                </div>
                <div className="flex gap-4">
                  <span className="font-bold w-12">2018</span>
                  <span>시대인재 컨텐츠팀 출제 위원 활동</span>
                </div>
                <div className="flex gap-4">
                  <span className="font-bold w-12">2017</span>
                  <span>서울대학교 화학교육과 입학</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}