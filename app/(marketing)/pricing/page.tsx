// app/pricing/page.tsx

"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckIcon, 
  XMarkIcon, 
  QuestionMarkCircleIcon, 
  SparklesIcon,
  FireIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ChevronDownIcon
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

// --- 데이터 정의 ---
const PLANS = [
  {
    id: "BASIC",
    name: "Basic Plan",
    tag: "Early Bird 특가",
    originalPrice: "198,000",
    price: "129,000",
    period: "/월",
    desc: "합리적인 가격으로 시작하는 스마트한 내신 대비",
    features: [
      "기본 문제은행 무제한 이용",
      "학교별 기출 분석 및 내신 N제",
      "교육청 모의고사 분석/유사 문항",
      "주요 개념서/부교재 유사 문항",
      "PDF 시험지 생성 및 정답지 제공",
    ],
    highlight: false,
    buttonText: "지금 시작하기",
    buttonStyle: "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50",
  },
  {
    id: "MAKERS",
    name: "Maker's Plan",
    tag: "Premium Solution",
    price: "별도 문의",
    period: "",
    desc: "상위 1%를 위한 자체 제작 킬러 문항과 1:1 맞춤 솔루션",
    features: [
      "Basic Plan의 모든 기능 포함",
      "RuleMakers 자체 개발 킬러/고난도 문항",
      "요청서 기반 1:1 커스텀 교재 제작 (월 3회)",
      "전담 매니저 배정 및 밀착 케어",
      "학원 로고 삽입 및 커스텀 표지 디자인",
    ],
    highlight: true,
    buttonText: "도입 상담 신청",
    buttonStyle: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/30 border-transparent",
  },
];

const COMPARISON_ROWS = [
  { category: "컨텐츠 제공", name: "기본 문항 데이터베이스", basic: true, makers: true },
  { category: "컨텐츠 제공", name: "학교별 기출 분석 리포트", basic: true, makers: true },
  { category: "컨텐츠 제공", name: "교육청/EBS/부교재 유사 문항", basic: true, makers: true },
  { category: "컨텐츠 제공", name: "RM 자체 개발 킬러/고난도 문항", basic: false, makers: true },
  { category: "제작 서비스", name: "PDF 시험지 생성/출력", basic: true, makers: true },
  { category: "제작 서비스", name: "1:1 맞춤 교재 제작 요청 (Coin)", basic: false, makers: "월 3회 제공" },
  { category: "브랜딩 & 케어", name: "전담 매니저 배정", basic: false, makers: true },
  { category: "브랜딩 & 케어", name: "학원 로고/커스텀 표지", basic: false, makers: true },
];

const FAQS = [
  {
    q: "Basic Plan의 'Early Bird 특가'는 언제까지인가요?",
    a: "현재 런칭 기념 프로모션으로 선착순 한정 제공되고 있습니다. 프로모션 종료 시 정상가(월 199,000원)로 전환될 수 있습니다."
  },
  {
    q: "Maker's Plan의 '1:1 맞춤 교재 제작'은 어떻게 진행되나요?",
    a: "전용 요청서를 통해 학교, 범위, 난이도, 특정 유형 등을 상세히 적어주시면, 전문 연구진이 직접 문항을 선별 및 검수하여 완성된 교재(PDF)를 제공해드립니다."
  },
  {
    q: "결제 후 바로 이용 가능한가요?",
    a: "Basic Plan은 결제 즉시 모든 기능을 이용하실 수 있습니다. Maker's Plan은 담당자와의 상담 및 계약 체결 후 계정이 활성화됩니다."
  },
  {
    q: "세금계산서 발행이 가능한가요?",
    a: "네, 가능합니다. 마이페이지 > 결제 관리에서 사업자 정보를 입력해주시면 매월 자동으로 발행됩니다."
  }
];

export default function PricingPage() {
  const { user, userData } = useAuth();
  
  // FAQ 인터랙션을 위한 상태 추가
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleUpgrade = async (planId: string) => {
    if (!user) return toast.error("로그인이 필요한 서비스입니다.");
    
    const confirmMsg = planId === 'MAKERS' 
      ? "Maker's Plan 도입 상담을 신청하시겠습니까? (테스트: 즉시 플랜 적용)" 
      : "Basic Plan(월 129,000원)을 구독하시겠습니까?";

    if (confirm(confirmMsg)) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          plan: planId,
          updatedAt: new Date(),
          coins: planId === 'MAKERS' ? 3 : 0 
        });
        toast.success(`${planId} 플랜이 성공적으로 적용되었습니다!`);
        window.location.reload();
      } catch (e) {
        console.error(e);
        toast.error("처리 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      
      {/* 1. Hero Header */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden bg-white border-b border-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative max-w-4xl mx-auto text-center z-10"
        >
          <span className="inline-block py-1 px-3 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-4 border border-blue-100">
            Pricing Plans
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
            학원 성장의 파트너,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              가장 확실한 투자
            </span>를 시작하세요.
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            단순한 문제은행을 넘어, 선생님의 시간을 아껴드리고<br className="hidden md:block"/> 
            수업의 질을 높이는 <strong>RuleMakers</strong>의 프리미엄 솔루션입니다.
          </p>
        </motion.div>
      </section>

      {/* 2. Pricing Cards */}
      <section className="py-24 px-6 -mt-10 relative z-20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            {PLANS.map((plan, idx) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className={`relative flex flex-col p-8 md:p-10 rounded-3xl transition-all duration-300 ${
                  plan.highlight
                    ? "bg-slate-900 text-white shadow-2xl shadow-blue-900/20 ring-1 ring-white/10 scale-[1.02]"
                    : "bg-white text-slate-900 border border-slate-200 shadow-xl shadow-slate-200/50"
                }`}
              >
                {/* Badge */}
                <div className="flex justify-between items-start mb-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                    plan.highlight 
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg" 
                      : "bg-red-50 text-red-600 border border-red-100"
                  }`}>
                    {plan.tag}
                  </span>
                  {plan.highlight && <SparklesIcon className="w-6 h-6 text-yellow-400" />}
                </div>

                {/* Title & Price */}
                <h3 className={`text-2xl font-bold mb-2 ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-8 h-10 ${plan.highlight ? "text-slate-400" : "text-slate-500"}`}>
                  {plan.desc}
                </p>

                <div className="flex items-baseline gap-2 mb-8">
                  {plan.originalPrice && (
                    <span className={`text-lg line-through decoration-red-500 decoration-2 ${plan.highlight ? "text-slate-500" : "text-slate-400"}`}>
                      {plan.originalPrice}
                    </span>
                  )}
                  <span className="text-5xl font-extrabold tracking-tight">{plan.price}</span>
                  <span className={`text-lg ${plan.highlight ? "text-slate-400" : "text-slate-500"}`}>{plan.period}</span>
                </div>

                {/* Button - cursor-pointer 추가됨 */}
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  className={`w-full py-4 rounded-xl font-bold text-base transition-all mb-10 border cursor-pointer active:scale-95 ${plan.buttonStyle}`}
                >
                  {userData?.plan === plan.id ? "현재 이용 중" : plan.buttonText}
                </button>

                {/* Features List */}
                <div className="mt-auto">
                  <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${plan.highlight ? "text-slate-500" : "text-slate-400"}`}>
                    WHAT'S INCLUDED
                  </p>
                  <ul className="space-y-4">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm font-medium">
                        <div className={`p-0.5 rounded-full ${plan.highlight ? "bg-blue-500/20 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                          <CheckIcon className="w-4 h-4" />
                        </div>
                        <span className={plan.highlight ? "text-slate-200" : "text-slate-700"}>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Value Proposition (Marketing) */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">왜 Maker's Plan인가요?</h2>
            <p className="text-slate-500 mt-2">단순 구독 그 이상의 가치를 제공합니다.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                <FireIcon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">대체 불가능한 킬러 문항</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                시중 교재 어디에도 없는 RuleMakers 자체 제작 고난도 문항으로 상위권 변별력을 확보하세요.
              </p>
            </div>
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors duration-300">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
                <CurrencyDollarIcon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">인건비 절감 효과</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                교재 제작 조교 1명 고용 비용의 1/10도 안 되는 비용으로, 서울대 연구진 퀄리티의 자료를 받으세요.
              </p>
            </div>
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:border-purple-200 transition-colors duration-300">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-4">
                <ShieldCheckIcon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">학원 브랜드 강화</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                학원 로고와 전용 표지 디자인을 적용하여, 학원만의 독자적인 프리미엄 교재 브랜딩을 완성합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Detailed Comparison Table */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="container mx-auto max-w-4xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900">기능 상세 비교</h2>
          </div>
          
          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-white">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-5 px-6 w-1/2">기능</th>
                  <th className="py-5 px-6 text-center w-1/4 text-slate-600">Basic Plan</th>
                  <th className="py-5 px-6 text-center w-1/4 text-blue-600 bg-blue-50/50">Maker's Plan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {COMPARISON_ROWS.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <span className="block text-xs text-slate-400 mb-0.5">{item.category}</span>
                      <span className="font-medium text-slate-700">{item.name}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {item.basic ? (
                        <CheckIcon className="w-5 h-5 text-slate-900 mx-auto" />
                      ) : (
                        <XMarkIcon className="w-5 h-5 text-slate-300 mx-auto" />
                      )}
                    </td>
                    <td className="py-4 px-6 text-center font-bold text-blue-600 bg-blue-50/30">
                      {item.makers === true ? (
                        <CheckIcon className="w-5 h-5 text-blue-600 mx-auto" />
                      ) : (
                        <span>{item.makers}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. FAQ Section (Accordion Style with Cursors) */}
      <section className="py-24 bg-white">
        <div className="container mx-auto max-w-3xl px-6">
          <div className="flex flex-col items-center justify-center gap-2 mb-12">
            <QuestionMarkCircleIcon className="w-8 h-8 text-blue-500" />
            <h2 className="text-3xl font-bold text-slate-900">자주 묻는 질문</h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div 
                key={i} 
                className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden transition-all hover:border-blue-200"
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full flex items-center justify-between p-6 text-left cursor-pointer focus:outline-none"
                >
                  <h3 className="font-bold text-slate-900 flex items-start gap-3">
                    <span className="text-blue-600 shrink-0">Q.</span> {faq.q}
                  </h3>
                  <ChevronDownIcon 
                    className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
                      openFaqIndex === i ? "rotate-180" : ""
                    }`} 
                  />
                </button>
                
                <AnimatePresence>
                  {openFaqIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-6 pl-12 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Bottom CTA */}
      <section className="py-24 bg-slate-900 text-white text-center">
        <div className="container mx-auto px-6">
          <SparklesIcon className="w-12 h-12 text-yellow-400 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            아직 고민되시나요?
          </h2>
          <p className="text-slate-400 mb-10 text-lg">
            무료 샘플을 먼저 받아보시고 결정하세요.<br/>
            회원가입만 하셔도 <strong>맛보기 PDF</strong>를 즉시 다운로드하실 수 있습니다.
          </p>
          <button 
            onClick={() => window.location.href = '/showcase'}
            className="px-10 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-blue-50 transition-all hover:scale-105 shadow-xl shadow-white/10 cursor-pointer"
          >
            샘플 자료 보러가기
          </button>
        </div>
      </section>

    </div>
  );
}