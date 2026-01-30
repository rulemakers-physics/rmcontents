// app/(marketing)/showcase/high-difficulty/page.tsx

"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { 
  SparklesIcon,
  BoltIcon,
  AcademicCapIcon,
  BeakerIcon,
  FireIcon,
  DocumentCheckIcon,
  ScaleIcon,
  PuzzlePieceIcon,
  UserGroupIcon,
  TrophyIcon
} from "@heroicons/react/24/solid";

// [수정] 새로 만든 HighLevelPdfViewer를 동적 로드합니다.
const HighLevelPdfViewer = dynamic(
  () => import("@/components/HighLevelPdfViewer"), 
  { 
    ssr: false, 
    loading: () => (
      <div className="h-[600px] flex items-center justify-center bg-slate-50 text-slate-400 rounded-2xl border border-slate-200">
        <div className="animate-pulse">고난이도 샘플 로딩 중...</div>
      </div>
    ) 
  }
);

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 }
};

export default function HighDifficultyPage() {
  return (
    <main className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* 1. Hero Section */}
      <section className="relative bg-slate-900 text-white overflow-hidden">
        {/* 배경 효과: 딥 퍼플 & 인디고 */}
        <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none -translate-x-1/3 -translate-y-1/4" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none translate-x-1/4 translate-y-1/4" />
        
        <div className="container mx-auto max-w-5xl px-6 py-24 text-center relative z-10">
          <motion.div {...fadeInUp}>
            {/* [수정] Badge: Gold/Amber 컬러로 교체하여 프리미엄 느낌 강조 */}
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/40 text-amber-300 text-xs font-bold mb-6 tracking-wide uppercase shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                <TrophyIcon className="w-4 h-4 text-amber-400" /> Maker's Plan Exclusive
              </span>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              1등급을 결정짓는<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
                High-End 킬러 문항 모음
              </span>
            </h1>
            {/* [수정] Description: 멤버십 언급 추가 */}
              <p className="max-w-2xl mx-auto text-lg text-slate-400 leading-relaxed mb-10 break-keep">
                시중 문제집으로는 대비할 수 없는 상위권 변별력.<br/>
                <strong>Maker's Plan</strong>전용으로 제공되는 연구소 자체 제작 킬러 문항으로<br/>
                최상위권 도약을 완성하세요.
              </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {/* [수정] CTA: 플랜 업그레이드 유도 */}
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. PDF Viewer Section */}
      <section className="py-20 bg-slate-100 border-b border-slate-200">
        <div className="container mx-auto max-w-4xl px-6">
          <motion.div {...fadeInUp} className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">교재 미리보기</h2>
            <p className="text-slate-500 mt-2">RuleMakers 연구소 자체 제작 킬러 문항 샘플</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <HighLevelPdfViewer />
          </motion.div>
        </div>
      </section>

      {/* 3. Key Features */}
      <section className="py-24 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-indigo-600 font-bold tracking-widest text-xs uppercase">Why High Difficulty?</span>
            <h2 className="text-3xl font-bold text-slate-900 mt-3">
              단순히 어렵기만 한 문제는 아닙니다
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={BeakerIcon}
              title="연구소 자체 제작 문항"
              desc="시중 기출 짜깁기가 아닙니다. RuleMakers 연구진이 직접 설계하고 검수한, 어디서도 볼 수 없는 오리지널 문항입니다."
            />
            <FeatureCard 
              icon={ScaleIcon}
              title="특정 단원 집중 공략"
              desc="'운동과 충돌', '산화와 환원', '중화 반응' 등 등급 컷을 가르는 핵심 킬러 단원만 골라 집중적으로 구성해 드립니다."
            />
            <FeatureCard 
              icon={PuzzlePieceIcon}
              title="복합 추론 능력 강화"
              desc="단순 암기나 계산이 아닌, 자료 해석과 논리적 추론이 필요한 문항들로 구성하여 수능형 사고력을 길러줍니다."
            />
            <FeatureCard 
              icon={DocumentCheckIcon}
              title="상세한 해설지 제공"
              desc="고난도 문항일수록 해설이 중요합니다. 출제 의도와 접근법, 함정 피하기 등 연구진의 노하우가 담긴 해설을 제공합니다."
            />
             <FeatureCard 
              icon={FireIcon}
              title="최신 트렌드 완벽 반영"
              desc="최근 교육청 및 평가원의 신유형 트렌드를 적극 반영한 문항을 발 빠르게 제공합니다."
            />
            <FeatureCard 
              icon={BoltIcon}
              title="상위 교과 완벽 연계"
              desc="통합과학 범위 내에서 물리학I(역학), 화학I(양적관계) 등의 논리를 자연스럽게 녹여내어 심화 학습을 유도합니다."
            />
          </div>
        </div>
      </section>

      {/* 4. Deep Dive Section (Concept) */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="container mx-auto max-w-5xl px-6">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              킬러 단원 완전 정복
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              학생들이 가장 어려워하는 단원, <br/>
              RuleMakers의 고난도 문항으로 확실한 우위를 점하세요.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <LevelCard 
                subject="물리학 (Physics)"
                title="역학 시스템 (운동과 충돌)"
                desc="운동량과 충격량, 역학적 에너지 보존 법칙을 연계한 복합 계산 문항. 물리학I의 역학 킬러 로직을 통합과학 수준으로 최적화했습니다."
                badgeColor="bg-blue-100 text-blue-700"
                progress={25}
             />
             <LevelCard 
                subject="화학 (Chemistry)"
                title="화학 변화 (산화·환원 / 중화 반응)"
                desc="전자 이동의 양적 관계, 중화 반응의 이온 수 변화 그래프 해석 등 화학I 킬러 문항의 자료 해석 능력을 요구합니다."
                badgeColor="bg-purple-100 text-purple-700"
                progress={50}
             />
             <LevelCard 
                subject="생명과학 (Biology)"
                title="유전 정보의 흐름"
                desc="전사, 번역 과정의 코돈 추론 및 염기 서열 분석 등 생명과학I의 유전 파트 논리를 적용한 고난도 추론 문항입니다."
                badgeColor="bg-emerald-100 text-emerald-700"
                progress={75}
             />
             <LevelCard 
                subject="지구과학 (Earth Science)"
                title="엘니뇨와 기후 변화"
                desc="다양한 관측 자료(수온, 기압 편차 등)를 제시하고 종합적인 해석을 요구하는 수능형 자료 분석 문항입니다."
                badgeColor="bg-orange-100 text-orange-700"
                progress={100}
             />
          </div>
        </div>
      </section>

      {/* 5. Usage Scenarios (활용 가이드) */}
      <section className="py-24 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">상위권 수업을 위한 활용 전략</h2>
            <p className="text-slate-500 mt-2">일반 수업과는 차별화된 컨텐츠가 필요할 때 활용하세요.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <ScenarioCard 
               icon={TrophyIcon}
               iconColor="text-yellow-500"
               bgClass="bg-yellow-50"
               title="🏆 최상위권 전용 클리닉"
               target="전교 1등 목표 / 의치한 대비반"
               features={[
                 "일반 N제로는 만족하지 못하는 최상위권 학생용",
                 "사고력을 요하는 'Thinking' 중심의 문항 배치",
                 "만점을 방지하는 학교 내신 킬러 문항 완벽 대비"
               ]}
            />
            
            <ScenarioCard 
               icon={UserGroupIcon}
               iconColor="text-indigo-500"
               bgClass="bg-indigo-50"
               title="👨‍🏫 방학 특강 심화 교재"
               target="선행 학습 / 심화 특강"
               features={[
                 "방학 기간 동안 '물화생지I' 연계 개념 심화 학습",
                 "고2 과탐 과목에 대한 진입 장벽을 낮추는 징검다리",
                 "강사의 전문성을 보여주는 고퀄리티 자체 교재 제작"
               ]}
            />
          </div>
        </div>
      </section>

      {/* 6. CTA */}
      <section className="py-24 bg-gradient-to-br from-slate-900 to-indigo-900 text-center text-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-6">압도적인 퀄리티를 경험하세요</h2>
          <p className="text-indigo-200 mb-10 max-w-xl mx-auto leading-relaxed">
            원하시는 킬러 단원과 난이도를 말씀해 주세요.<br/> 
            RuleMakers 연구소가 선생님의 수업을 위한 비밀 병기를 보내드립니다.
          </p>
          <Link 
            href="/request"
            className="inline-flex items-center justify-center px-10 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-all hover:scale-105 shadow-xl shadow-indigo-900/50"
          >
            고난이도 문항모음zip 제작 요청하기
          </Link>
        </div>
      </section>

      {/* 7. 다른 샘플 보기 */}
      <section className="bg-white py-24">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              다른 컨텐츠 샘플
            </h2>
            <Link
              href="/showcase"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              모든 샘플 보기 &rarr;
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            <OtherSampleCard
              title="학교별 실전 모의고사"
              description="학교별 최신 기출을 완벽 분석하여 제작된 고품질 모의고사입니다."
              link="/showcase/mock-exam"
              imgSrc="/images/mock-exam.png"
            />
            <OtherSampleCard
              title="학교별 내신 대비 N제"
              description="특정 주제나 유형을 집중 공략할 수 있도록 설계된 문항 N제입니다."
              link="/showcase/n-set"
              imgSrc="/images/n-set.png"
            />
          </div>
        </div>
      </section>

    </main>
  );
}

// --- Helper Components ---

function FeatureCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow duration-300">
      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 leading-relaxed text-sm word-keep break-keep">
        {desc}
      </p>
    </div>
  );
}

function LevelCard({ subject, title, desc, badgeColor, progress }: { subject: string, title: string, desc: string, badgeColor: string, progress: number }) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition-colors group">
            <div>
                <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase">{subject}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${badgeColor}`}>Killer</span>
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{title}</h4>
                <p className="text-slate-600 text-sm leading-relaxed word-keep mb-4">{desc}</p>
            </div>
            {/* Visual Difficulty Indicator */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-slate-800 group-hover:bg-indigo-600 transition-colors" style={{ width: `${progress}%` }} />
            </div>
        </div>
    )
}

function ScenarioCard({ icon: Icon, iconColor, bgClass, title, target, features }: any) {
    return (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 hover:shadow-xl transition-all hover:-translate-y-1 group">
            <div className={`w-14 h-14 ${bgClass} rounded-2xl flex items-center justify-center mb-6`}>
                <Icon className={`w-7 h-7 ${iconColor}`} />
            </div>
            <div className="mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">{target}</span>
                <h3 className="text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{title}</h3>
            </div>
            <ul className="space-y-3">
                {features.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start text-slate-600 text-sm">
                        <span className={`mr-2 mt-1.5 w-1.5 h-1.5 rounded-full ${iconColor.replace('text-', 'bg-')}`} />
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    )
}

function OtherSampleCard({
  title,
  description,
  link,
  imgSrc,
}: {
  title: string;
  description: string;
  link: string;
  imgSrc: string;
}) {
  return (
    <Link
      href={link}
      className="group block rounded-lg bg-white p-6 shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1"
    >
      <div className="flex items-start gap-4">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-200">
          <Image
            src={imgSrc}
            alt={title}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600">
            {title}
          </h3>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </Link>
  );
}