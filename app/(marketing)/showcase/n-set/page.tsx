"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { 
  AdjustmentsHorizontalIcon,
  SwatchIcon,
  CpuChipIcon,
  ClipboardDocumentCheckIcon,
  BookOpenIcon,
  TagIcon,
  ClockIcon,
  ChartBarIcon,
  PencilSquareIcon,
  UserGroupIcon
} from "@heroicons/react/24/solid";

// [변경] N제 전용 뷰어 컴포넌트를 import 합니다.
const NSetPdfViewer = dynamic(
  () => import("@/components/NSetPdfViewer"), 
  { 
    ssr: false, 
    loading: () => (
      <div className="h-[600px] flex items-center justify-center bg-slate-50 text-slate-400 rounded-2xl border border-slate-200">
        <div className="animate-pulse">N제 뷰어 준비 중...</div>
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

export default function NSetPage() {
  return (
    <main className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* 1. Hero Section */}
      <section className="relative bg-slate-900 text-white overflow-hidden">
        {/* 배경 효과: 딥 블루 */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none translate-x-1/3 -translate-y-1/4" />
        
        <div className="container mx-auto max-w-5xl px-6 py-24 text-center relative z-10">
          <motion.div {...fadeInUp}>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              우리 학교 진도에 딱 맞춘<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">
                내신 만점 대비 Final N제
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-slate-400 leading-relaxed mb-10 break-keep">
              학교마다 천차만별인 시험 범위와 난이도 때문에 고민이신가요?<br/>
              필요한 단원과 문항 수만 말씀해 주세요. 즉시 수업 가능한 최적의 교재를 구성해 드립니다.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/request" className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-slate-900 bg-white rounded-xl hover:bg-slate-100 transition-all shadow-lg hover:shadow-blue-500/20">
                N제 제작 요청하기
              </Link>
              <Link href="/service/maker" className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-all">
                직접 만들어보기
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. PDF Viewer Section */}
      <section className="py-20 bg-slate-100 border-b border-slate-200">
        <div className="container mx-auto max-w-4xl px-6">
          <motion.div {...fadeInUp} className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">교재 미리보기</h2>
            <p className="text-slate-500 mt-2">2025년 2학기 중간 대비 룰메고 Final N제 샘플</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {/* 파일 경로를 props로 전달하거나 내부적으로 처리 */}
            <NSetPdfViewer />
          </motion.div>
        </div>
      </section>

      {/* 3. Key Features */}
      <section className="py-24 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-blue-600 font-bold tracking-widest text-xs uppercase">Why RuleMakers N-Set?</span>
            <h2 className="text-3xl font-bold text-slate-900 mt-3">
              강사의 불편함을 해결하는 디테일
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={AdjustmentsHorizontalIcon}
              title="간편한 단원 구성"
              desc="물/화/생/지 선생님들이 나누어 수업하는 복잡한 학교 진도도 문제없습니다. 필요한 단원만 골라주시면 즉시 N제로 구성해 드립니다."
            />
            <FeatureCard 
              icon={TagIcon}
              title="상세한 문항 태깅"
              desc="단순 난이도 분류가 아닙니다. '지엽', '교과 외', '단원 융합' 등 문항 상단에 상세 속성을 표기하여 학습 효율을 높입니다."
            />
            <FeatureCard 
              icon={CpuChipIcon}
              title="AI 중복 방지 & 다양성"
              desc="AI 분석 모델을 통해 유사한 자료나 선지의 중복을 최소화합니다. 학생들이 지루함 없이 다양한 유형을 경험할 수 있습니다."
            />
            <FeatureCard 
              icon={BookOpenIcon}
              title="단계별 난이도 배치"
              desc="각 단원 내에서 쉬운 문제부터 어려운 문제 순으로 배치하여, 학생들의 학습 참여율을 높이고 성취감을 고취합니다."
            />
            <FeatureCard 
              icon={SwatchIcon}
              title="최신 트렌드 디자인"
              desc="불필요한 장식을 배제한 깔끔한 서식과 가독성 높은 폰트를 사용하여, 강사님의 교재 퀄리티와 브랜드 가치를 높여드립니다."
            />
             <FeatureCard 
              icon={ClipboardDocumentCheckIcon}
              title="철저한 교재 검수"
              desc="오류 없는 교재를 위해 철저한 검수 과정을 거칩니다. 학생이 풀이에만 집중할 수 있는 무결점 교재를 지향합니다."
            />
          </div>
        </div>
      </section>

      {/* 4. Tagging System Visualization (Deep Dive) */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="container mx-auto max-w-5xl px-6">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              정교한 문항 태깅 시스템
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              RuleMakers는 문항의 성격을 데이터로 정의합니다.<br/>
              원하는 난이도와 유형 비율만 말씀해 주세요.
            </p>
          </motion.div>

          {/* Level Guide Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <LevelCard 
                level="일반 (General)"
                score="RM 1.0 ~ 2.0"
                desc="학교 교과서 수준의 기본 문항입니다. 개념 확인 및 기초 유형 숙달에 적합합니다."
                badgeColor="bg-slate-100 text-slate-600"
             />
             <LevelCard 
                level="자료 강화 (Data+)"
                score="RM 1.5 ~ 2.5"
                desc="교과서 외 자료가 혼합된 형태입니다. 자료 해석 능력을 요구하는 심화 유형을 포함합니다."
                badgeColor="bg-blue-100 text-blue-600"
             />
             <LevelCard 
                level="고난도 (Hard)"
                score="RM 3.0 +"
                desc="1등급 변별을 위한 킬러 문항입니다. 복합적 사고가 필요하며 수능형 논리를 요구합니다."
                badgeColor="bg-indigo-100 text-indigo-600"
             />
             <LevelCard 
                level="서술형 (Writing)"
                score="All Range"
                desc="논리적 서술 능력을 평가합니다. 교과서 핵심 개념을 묻거나 풀이 과정을 요구합니다."
                badgeColor="bg-emerald-100 text-emerald-600"
             />
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 bg-white inline-block px-4 py-2 rounded-full border border-slate-200 shadow-sm">
              💡 학교 출제 경향에 따라 위 가이드의 비율을 자유롭게 조정(ex. 자료 강화 70%, 서술형 제외 등)할 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Usage Scenarios (활용 가이드) */}
      <section className="py-24 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">4가지 맞춤형 활용 가이드</h2>
            <p className="text-slate-500 mt-2">수업 목적에 따라 N제의 컨셉을 선택하세요.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Scenario 1: 타임어택 */}
            <ScenarioCard 
               icon={ClockIcon}
               iconColor="text-orange-500"
               bgClass="bg-orange-50"
               title="⌛ 타임어택 최적화 N제"
               target="중하위권 / 실수 방지"
               features={[
                 "난이도 1.0~2.0 일반 문항 대량 구성",
                 "풀이 속도와 정확도 훈련에 최적화",
                 "쉬운 문제에서 실수를 줄이고 시간 확보 연습"
               ]}
            />
            
            {/* Scenario 2: 고난도/자료해석 */}
            <ScenarioCard 
               icon={ChartBarIcon}
               iconColor="text-indigo-500"
               bgClass="bg-indigo-50"
               title="🖼️ 자료 해석 & 고난도 훈련"
               target="상위권 / 1등급 결정"
               features={[
                 "난이도 2.5 이상 및 [자료 심화] 문항 위주",
                 "낯선 자료 분석 및 복합 추론 능력 극대화",
                 "변별력을 가르는 킬러 문항 집중 공략"
               ]}
            />

            {/* Scenario 3: 서술형 */}
            <ScenarioCard 
               icon={PencilSquareIcon}
               iconColor="text-emerald-500"
               bgClass="bg-emerald-50"
               title="✍️ 무결점 서술형 집중 대비"
               target="감점 방지 / 수행평가"
               features={[
                 "학교별 출제 스타일을 반영한 서술형 엄선",
                 "논리적 인과관계 서술 및 답안 완성도 훈련",
                 "강사의 개별 첨삭 수업 보조 교재로 활용"
               ]}
            />

            {/* Scenario 4: 직전 보강 */}
            <ScenarioCard 
               icon={UserGroupIcon}
               iconColor="text-blue-500"
               bgClass="bg-blue-50"
               title="⛳ 개인별 약점 보완 직보"
               target="파이널 / 개인 맞춤"
               features={[
                 "학생별 오답률 높은 단원/유형만 선별",
                 "학습 공백을 메우는 1:1 맞춤형 교재 제공",
                 "강사의 세심한 관리 역량을 증명하는 자료"
               ]}
            />
          </div>
        </div>
      </section>

      {/* 6. CTA */}
      <section className="py-24 bg-gradient-to-br from-blue-900 to-slate-900 text-center text-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-6">지금 바로 수업에 활용하세요</h2>
          <p className="text-slate-300 mb-10 max-w-xl mx-auto">
            원하는 단원과 난이도만 알려주세요.<br/> 
            3일 이내 바로 사용하실 수 있는 고퀄리티 N제를 보내드립니다.
          </p>
          <Link 
            href="/request"
            className="inline-flex items-center justify-center px-10 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-all hover:scale-105 shadow-xl"
          >
            N제 제작 요청하기
          </Link>
        </div>
      </section>
      {/* 3. 다른 샘플 보기 */}
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
              title="고난이도 문항모음zip"
              description="상위권 변별을 위한 고난도 킬러 문항, 신유형 문항만을 선별하여 제공합니다."
              link="/showcase/high-difficulty"
              imgSrc="/images/high-difficulty.png"
            />
          </div>
        </div>
      </section>
    </main>
  );
}

// --- Components ---

function FeatureCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow duration-300">
      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed break-keep">
        {desc}
      </p>
    </div>
  );
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
      className="group block rounded-lg bg-gray-50 p-6 shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1"
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

function LevelCard({ level, score, desc, badgeColor }: { level: string, score: string, desc: string, badgeColor: string }) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-colors">
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-lg font-bold text-slate-900">{level}</h4>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${badgeColor}`}>{score}</span>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed word-keep">{desc}</p>
            </div>
            {/* Visual Indicator (Optional) */}
            <div className="w-full bg-slate-100 h-1.5 mt-4 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${level.includes('일반') ? 'w-1/3 bg-slate-400' : level.includes('자료') ? 'w-2/3 bg-blue-500' : level.includes('고난도') ? 'w-full bg-indigo-600' : 'w-full bg-emerald-500'}`} 
                />
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
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Target: {target}</span>
                <h3 className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{title}</h3>
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