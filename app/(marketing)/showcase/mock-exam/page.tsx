// app/(marketing)/showcase/mock-exam/page.tsx

"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import dynamic from "next/dynamic"; // Dynamic import 추가
import { 
  CheckCircleIcon, 
  SparklesIcon, 
  DocumentMagnifyingGlassIcon, 
  ChartBarSquareIcon,
  ClockIcon,
  DocumentTextIcon,
  SwatchIcon,
  CpuChipIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "@heroicons/react/24/solid";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { Document, Page, pdfjs } from "react-pdf";

// [수정] PDF Viewer를 SSR 없이 동적으로 로드합니다.
const MockExamPdfViewer = dynamic(
  () => import("@/components/MockExamPdfViewer"), 
  { 
    ssr: false,
    loading: () => (
      <div className="h-[600px] flex items-center justify-center bg-slate-50 text-slate-400 rounded-2xl border border-slate-200">
        <p>PDF 뷰어를 준비 중입니다...</p>
      </div>
    )
  }
);
// 애니메이션 설정
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 }
};

export default function MockExamPage() {
  return (
    <main className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* 1. Hero Section */}
      <section className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="container mx-auto max-w-5xl px-6 py-24 text-center relative z-10">
          <motion.div {...fadeInUp}>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              실전보다 더 실전 같은<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-sky-300">
                내신 대비 실전 모의고사
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-slate-400 leading-relaxed mb-10 break-keep">
              실제 내신 기출의 문항 구성 및 출제 경향성을 완벽하게 반영했습니다.<br/>
              단순한 문제 풀이를 넘어, 학생들의 실전 감각을 극대화하는 최고의 컨텐츠입니다.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/request"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-slate-900 bg-white rounded-xl hover:bg-slate-100 transition-all shadow-lg hover:shadow-indigo-500/20"
              >
                제작 요청하기
              </Link>
              <Link
                href="/service/maker"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-all"
              >
                직접 만들어보기
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. Secure PDF Viewer Section (Client Side Only) */}
      <section className="py-20 bg-slate-100 border-b border-slate-200">
        <div className="container mx-auto max-w-4xl px-6">
          <motion.div {...fadeInUp} className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">모의고사 미리보기</h2>
            <p className="text-slate-500 mt-2">RuleMakers에서 실제 제작한 모의고사를 확인해보세요</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {/* 동적으로 로드된 PDF 뷰어 컴포넌트 사용 */}
            <MockExamPdfViewer />
          </motion.div>
        </div>
      </section>

      {/* 3. Key Features */}
      <section className="py-24 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-indigo-600 font-bold tracking-widest text-xs uppercase">Key Features</span>
            <h2 className="text-3xl font-bold text-slate-900 mt-3">
              RuleMakers 모의고사만의 차별점
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={DocumentMagnifyingGlassIcon}
              title="완벽한 시험 범위 반영"
              desc="물/화/생/지 과목별 선생님들의 각기 다른 진도와 범위를 완벽하게 반영합니다. 시험 범위와 기출 문항만 주시면 즉시 구성 가능합니다."
            />
            <FeatureCard 
              icon={ChartBarSquareIcon}
              title="기출과 유사한 문항 구성"
              desc="단순한 문항 수집이 아닌, 정교한 태깅 시스템을 통해 문항 성격을 정의하고 기출 분석 결과(난이도, 자료 유형, 배점 등)를 그대로 구현합니다."
            />
            <FeatureCard 
              icon={ClockIcon}
              title="내신 문항 배치 순서 반영"
              desc="실제 내신 시험의 출제 동향(물/화/생/지 순서 등)을 그대로 반영하여, 학생들이 실전에서의 시간 배분 감각을 익힐 수 있도록 설계했습니다."
            />
            <FeatureCard 
              icon={CpuChipIcon}
              title="문항 중복 방지 (AI)"
              desc="RuleMakers 고유의 AI 분석 모델로 유사 자료나 중복 개념 문항을 철저히 필터링하여, 제한된 문항 수 내에서 다채로운 개념 학습을 돕습니다."
            />
            <FeatureCard 
              icon={DocumentTextIcon}
              title="실전 모의고사 서식"
              desc="수능 및 전국연합학력평가 수준의 정갈한 서식을 사용하여 학생들에게 실전 같은 긴장감을 부여하고 강사의 전문성을 증명합니다."
            />
             <FeatureCard 
              icon={SwatchIcon}
              title="맞춤형 디자인 적용"
              desc="학원 로고, 강사명, 시험지 타이틀 등을 자유롭게 커스터마이징하여 우리 학원만의 고유한 브랜드 가치를 높여드립니다."
            />
          </div>
        </div>
      </section>

      {/* 4. 적중 사례 (Visual Grid) */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="container mx-auto max-w-5xl px-6">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              높은 내신 적중률
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              동일 자료, 동일 개념, 유사 선지까지.<br/>
              RuleMakers의 데이터 분석이 만들어낸 놀라운 적중 결과를 확인하세요.
            </p>
          </motion.div>

          {/* [수정] 2열(grid-cols-2) -> 1열(grid-cols-1)로 변경하여 크게 배치 */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 gap-12"
          >
            {HIT_CASES.map((item, idx) => (
              <HitMatchCard key={idx} data={item} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* 5. Usage Scenarios */}
      <section className="py-24 bg-white">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">100% 활용 가이드</h2>
            <p className="text-slate-500 mt-2">수업 목적에 맞춰 최적의 형태로 제공해드립니다.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Scenario 1 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-sm"
            >
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                <span className="text-2xl">📆</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">주간 모의고사</h3>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <div>
                  <span className="font-bold text-slate-800 block mb-1">활용 방식</span>
                  매주 주간 과제물로 배부하거나, 수업 전후 형성 평가 형태로 활용할 수 있습니다.
                </div>
                <div>
                  <span className="font-bold text-slate-800 block mb-1">기대 효과</span>
                  주차별 성취도를 정밀하게 점검하고, 실전 문항 노출 빈도를 높여 시험에 대한 심리적 장벽을 낮춥니다. 약점을 조기에 파악하는 강력한 지표가 됩니다.
                </div>
              </div>
            </motion.div>

            {/* Scenario 2 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl text-white"
            >
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6">
                <span className="text-2xl">⛳</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">직전 보강 모의고사</h3>
              <div className="space-y-4 text-slate-300 leading-relaxed">
                <div>
                  <span className="font-bold text-white block mb-1">활용 방식</span>
                  학교 시험과 동일한 시간 제한을 두고, 실제 시험장과 유사한 분위기 속에서 모의고사 풀이를 진행합니다.
                </div>
                <div>
                  <span className="font-bold text-white block mb-1">기대 효과</span>
                  타임 어택 상황에서의 심리적 압박감을 극복하고, 문항별 시간 배분 전략을 체계화합니다. 시험 당일 학생들의 긴장감을 획기적으로 낮춰줍니다.
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6. CTA */}
      <section className="py-24 bg-gradient-to-br from-indigo-900 to-slate-900 text-center text-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-6">지금 바로 시작하세요</h2>
          <p className="text-slate-300 mb-10 max-w-xl mx-auto">
            원하는 모의고사 수준이나 기출 문항을 보내주시면,<br/> 
            빠른 분석과 구성을 통해 최적의 모의고사를 제공해드립니다.
          </p>
          <Link 
            href="/request"
            className="inline-flex items-center justify-center px-10 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-all hover:scale-105 shadow-xl"
          >
            모의고사 제작 요청하기
          </Link>
        </div>
      </section>

      {/* 4. 다른 샘플 보기 */}
      <section className="bg-gray-50 py-24">
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
              title="학교별 내신 대비 N제"
              description="특정 주제나 유형을 집중 공략할 수 있도록 설계된 문항 N제입니다."
              link="/showcase/n-set"
              imgSrc="/images/n-set.png"
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
    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow">
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

// [수정] 적중 사례 카드 컴포넌트
function HitMatchCard({ data }: { data: typeof HIT_CASES[0] }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
      
      {/* 헤더 */}
      <div className="bg-slate-50 px-8 py-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <span className="text-xs font-bold text-slate-500 mb-1 block uppercase tracking-wide">
            {data.title}
          </span>
          <h3 className="text-lg font-bold text-slate-900 leading-tight">
            {data.description}
          </h3>
        </div>
        <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-bold border border-blue-200 shadow-sm whitespace-nowrap">
          {data.tag}
        </span>
      </div>

      <div className="p-8">
        {/* 높이 조절: md:h-[600px] (약 600픽셀) */}
        <div className="flex flex-col md:flex-row gap-8 md:h-[600px]">
          
          {/* 1. RuleMakers 모의고사 */}
          <div className="flex-1 flex flex-col h-full">
            <span className="text-sm font-bold text-indigo-600 mb-3 block text-center bg-indigo-50 py-2 rounded-lg border border-indigo-100">
              RuleMakers 모의고사
            </span>
            {/* [변경] bg-indigo-50/30 -> bg-white 로 변경 */}
            <div className="flex-1 bg-white rounded-2xl flex items-center justify-center relative overflow-hidden border-2 border-indigo-100 shadow-inner group">
               {data.mockImg ? (
                 <Image 
                   src={data.mockImg} 
                   alt="Mock Question" 
                   fill 
                   className="object-contain p-4 transition-transform duration-500 group-hover:scale-105" 
                 />
               ) : (
                 <>
                    <div className="absolute inset-0 bg-indigo-50/10" /> 
                    <span className="relative text-sm text-indigo-400 font-medium">Mock Exam Q.{data.qNum}</span>
                 </>
               )}
            </div>
          </div>
          
          {/* 화살표 아이콘 */}
          <div className="flex items-center justify-center text-slate-300 py-2 md:py-0">
             <ArrowRightIcon className="hidden md:block w-8 h-8 text-indigo-300" />
             <div className="md:hidden rotate-90">
               <ArrowRightIcon className="w-6 h-6 text-indigo-300" />
             </div>
          </div>

          {/* 2. 실제 기출 문제 */}
          <div className="flex-1 flex flex-col h-full">
            <span className="text-sm font-bold text-slate-600 mb-3 block text-center bg-slate-100 py-2 rounded-lg border border-slate-200">
              실제 기출 문제
            </span>
            {/* [변경] bg-slate-50 -> bg-white 로 변경 */}
            <div className="flex-1 bg-white rounded-2xl flex items-center justify-center relative overflow-hidden border-2 border-slate-200 shadow-inner group">
               {data.realImg ? (
                 <Image 
                   src={data.realImg} 
                   alt="Real Question" 
                   fill 
                   className="object-contain p-4 transition-transform duration-500 group-hover:scale-105" 
                 />
               ) : (
                 <>
                   <div className="absolute inset-0 bg-slate-50" />
                   <span className="relative text-sm text-slate-400 font-medium">Actual Exam Q.{data.realQNum}</span>
                 </>
               )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// [업데이트] 적중 사례 데이터 (이미지 경로 필드 추가됨)
const HIT_CASES = [
  {
    title: "2025 ◇◇고 2학기 중간",
    tag: "동일 자료",
    qNum: "12",
    realQNum: "6",
    description: "동일 자료, 유사 선지",
    mockImg: "/images/hits/mock_1.png", // 실제 파일 경로로 변경 필요
    realImg: "/images/hits/real_1.png", 
  },
  {
    title: "2025 OO고 1학기 기말",
    tag: "동일 자료, 동일 개념, 선지 유사",
    qNum: "20",
    realQNum: "7",
    description: "자료 형태와 물어보는 핵심 개념이 동일",
    mockImg: "/images/hits/mock_2.png",
    realImg: "/images/hits/real_2.png",
  },
  {
    title: "2025 ㅁㅁ고 2학기 중간",
    tag: "동일 자료, 동일 개념",
    qNum: "8",
    realQNum: "8",
    description: "보기 ㄱ, ㄴ, ㄷ의 함정 요소까지 완벽 예측",
    mockImg: "/images/hits/mock_3.png",
    realImg: "/images/hits/real_3.png",
  },
  {
    title: "2025 ☆☆고 2학기 중간",
    tag: "유사 자료, 동일 개념",
    qNum: "15",
    realQNum: "25",
    description: "교과서 특이 자료 변형 문항 적중",
    mockImg: "/images/hits/mock_4.png",
    realImg: "/images/hits/real_4.png",
  }
];