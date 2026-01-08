// app/(marketing)/pricing/page.tsx

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckIcon, 
  XMarkIcon, // [필요시 사용]
  QuestionMarkCircleIcon, 
  SparklesIcon,
  FireIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  AcademicCapIcon, 
  BuildingLibraryIcon,
  InformationCircleIcon // [신규] 안내 아이콘
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import Link from "next/link"; // Link 컴포넌트 추가

// --- 데이터 정의 ---
// [1] Plan 인터페이스 정의 추가
interface Plan {
  id: string;
  name: string;
  tag: string;
  originalPrice?: string; // 할인가가 없는 경우도 있으므로 optional
  price: string;
  period: string;
  desc: string;
  promotionText?: string; // [핵심] 선택적 속성으로 정의 (있을 수도 있고 없을 수도 있음)
  features: string[];
  highlight: boolean;
  buttonText: string;
  buttonStyle: string;
  notice?: string; // 오류 메시지에 notice가 보였으므로 추가 (사용하지 않는다면 제거 가능)
}
// 1. 강사/학원용 플랜 (심사 제출용 메인 상품)
const INSTRUCTOR_PLANS: Plan[] = [
  {
    id: "BASIC",
    name: "Basic Plan",
    tag: "첫 4주 무료 체험",
    price: "198,000원",
    period: "/월",
    desc: "개인 강사 및 중소형 학원을 위한 올인원 솔루션",
    promotionText: "🎁 지금 가입 시 첫 4주 100% 무료!",
    features: [
      "문제은행 무제한 이용",
      "학교별 기출 분석 데이터 제공",
      "내신 대비 모의고사 및 N제 제작",
      "학부모 발송용 주간 리포트 생성",
      "학생 성적 관리 및 분석 시스템",
    ],
    highlight: false,
    buttonText: "4주 무료로 시작하기",
    buttonStyle: "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50",
    notice: "매월 자동 결제 (언제든 해지 가능)" // [신규] 결제 주기 명시
  },
  {
    id: "MAKERS",
    name: "Maker's Plan",
    tag: "PREMIUM",
    price: "별도 문의",
    period: "",
    desc: "대형 학원 및 프랜차이즈를 위한 맞춤형 개발",
    features: [
      "Basic Plan의 모든 기능 포함",
      "RuleMakers 자체 개발 킬러 문항 제공",
      "학원 전용 커스텀 교재 제작 (PDF)",
      "전담 매니저 배정 및 기술 지원",
      "브랜드 로고 및 표지 디자인 적용",
    ],
    highlight: true,
    buttonText: "도입 상담 신청",
    buttonStyle: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/30 border-transparent",
    notice: "연간 계약 및 별도 견적"
  },
];

// 2. 학생용 플랜 (관리자 확인용, 런칭 시 숨김 처리 가능)
const STUDENT_PLANS: Plan[] = [
  {
    id: "STD_STANDARD",
    name: "내신 한 달 Plan",
    tag: "단기 완성",
    price: "49,000원",
    period: "/월",
    desc: "시험 직전, 집중적인 문제 풀이가 필요할 때",
    features: [
      "통합과학 전 단원 문제은행 무제한",
      "AI 취약점 분석 리포트",
      "실전 모의고사 10회분 제공",
      "오답 노트 자동 생성",
      "해설지 무제한 열람"
    ],
    highlight: false,
    buttonText: "한 달 이용권 구매",
    buttonStyle: "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50",
    notice: "1개월 이용 후 자동 종료"
  },
  {
    id: "STD_PREMIUM",
    name: "통합과학 연간 Plan",
    tag: "Best Value",
    price: "19,900원",
    period: "/월",
    desc: "1년 내내 1등급을 유지하는 가장 확실한 방법",
    features: [
      "월간 플랜의 모든 혜택 포함",
      "개념서 실물 교재 제공", 
      "고난도 킬러 문항 전용관 입장",
      "1:1 학습 Q&A 게시판 이용권",
      "시험 기간 시크릿 자료 제공"
    ],
    highlight: true,
    buttonText: "지금 특가로 시작하기",
    buttonStyle: "bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-teal-500/30 border-transparent",
    notice: "12개월 약정 (매월 자동 결제)"
  },
];

// [수정] 런칭 서비스 기준 FAQ (심사 필수 항목 반영)
const FAQS = [
  {
    q: "정기 결제는 언제 진행되나요?",
    a: "Basic Plan은 최초 카드 등록 시 '0원'으로 결제되며, 4주(28일) 간의 무료 체험 기간이 끝난 후부터 매월 등록된 카드로 198,000원이 자동 결제됩니다."
  },
  {
    q: "서비스 제공 기간은 어떻게 되나요?",
    a: "결제일로부터 1개월간 서비스를 무제한으로 이용하실 수 있으며, 정기 결제를 유지하는 동안 서비스 이용 권한이 자동으로 갱신됩니다."
  },
  {
    q: "중도 해지 및 환불 규정이 궁금합니다.",
    a: "서비스 이용 중 언제든지 '프로필 > 결제 관리'에서 해지 예약이 가능합니다. 결제일로부터 7일 이내이며 컨텐츠를 사용하지 않은 경우 전액 환불이 가능하며, 이후에는 이용 약관에 따라 차등 환불됩니다."
  },
  {
    q: "세금계산서 발행이 가능한가요?",
    a: "네, 가능합니다. 결제 후 '프로필 > 결제 관리' 메뉴에서 사업자 정보를 등록하시면 매월 결제일에 맞춰 전자세금계산서가 자동 발행됩니다."
  }
];

export default function PricingPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  
  // 관리자가 아니면 무조건 강사용 플랜만 보이도록 설정
  const isInstructor = userData?.role === 'instructor';
  const [target, setTarget] = useState<'instructor' | 'student'>('instructor');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleUpgrade = async (planId: string) => {
    if (!user) {
      toast.error("로그인이 필요한 서비스입니다.");
      router.push("/login");
      return;
    }

    if (isInstructor) {
      toast("결제 권한이 없습니다. 원장님께 문의해주세요.", { icon: "🔒" });
      return;
    }
  
    let planName = "";
    if (planId === "BASIC") {
      planName = "Basic Plan";
    } else if (planId === "MAKERS") {
      window.location.href = "/contact"; 
      return;
    } else if (planId === "STD_PREMIUM") {
      planName = "Student Premium Plan";
    }

    router.push(`/payment/subscribe?plan=${encodeURIComponent(planName)}`);
  };

  const currentPlans = target === 'instructor' ? INSTRUCTOR_PLANS : STUDENT_PLANS;

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
            합리적인 가격으로 만나는<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              프리미엄 교육 솔루션
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            수업 준비 시간은 줄이고, 퀄리티는 높이세요.<br/>
            선생님께 꼭 필요한 기능만 담아 부담 없이 시작할 수 있습니다.
          </p>
        </motion.div>
      </section>

      {/* 2. Pricing Section */}
      <section className="py-16 px-6 -mt-10 relative z-20">
        <div className="container mx-auto max-w-6xl">
          
          {/* 관리자 전용 토글 (일반 유저에게는 안 보임) */}
          {user?.isAdmin && (
            <div className="flex justify-center mb-12">
              <div className="bg-white p-1.5 rounded-full flex shadow-md border border-slate-200">
                <button 
                  onClick={() => setTarget('instructor')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all ${
                    target === 'instructor' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <BuildingLibraryIcon className="w-4 h-4" /> 강사/학원용
                </button>
                <button 
                  onClick={() => setTarget('student')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all ${
                    target === 'student' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <AcademicCapIcon className="w-4 h-4" /> 학생용 (Admin)
                </button>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            {currentPlans.map((plan, idx) => (
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
                <p className={`text-sm mb-6 h-10 ${plan.highlight ? "text-slate-400" : "text-slate-500"}`}>
                  {plan.desc}
                </p>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                  <span className={`text-lg ${plan.highlight ? "text-slate-400" : "text-slate-500"}`}>{plan.period}</span>
                </div>
                
                {/* [신규] 결제 주기 및 부가세 안내 */}
                <p className={`text-xs mb-8 ${plan.highlight ? "text-slate-500" : "text-slate-400"}`}>
                  * VAT 포함 · {plan.notice}
                </p>

                {/* Promotion Text */}
                {plan.promotionText && (
                   <div className={`mb-6 text-sm font-bold p-3 rounded-lg text-center ${
                     plan.highlight 
                       ? "bg-white/10 text-sky-300" 
                       : "bg-red-50 text-red-600 border border-red-100"
                   }`}>
                     {plan.promotionText}
                   </div>
                )}

                {/* Button */}
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isInstructor}
                  className={`w-full py-4 rounded-xl font-bold text-base transition-all mb-10 border 
                    ${isInstructor 
                      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" 
                      : "cursor-pointer active:scale-95 " + plan.buttonStyle 
                    }`}
                >
                  {isInstructor 
                    ? "원장님 플랜을 따릅니다" 
                    : (userData?.plan === plan.id ? "현재 이용 중" : plan.buttonText)
                  }
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
                        <span className={plan.highlight ? "text-slate-200" : "text-slate-700"}>
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>

          {/* [신규] 하단 환불 및 서비스 규정 안내 */}
          <div className="mt-12 p-6 bg-slate-100 rounded-2xl border border-slate-200 text-slate-500 text-xs leading-relaxed">
            <div className="flex items-center gap-2 font-bold text-slate-700 mb-2">
              <InformationCircleIcon className="w-4 h-4" /> 서비스 이용 및 환불 안내
            </div>
            <ul className="list-disc pl-4 space-y-1">
              <li>모든 플랜은 부가가치세(V.A.T)가 포함된 가격입니다.</li>
              <li>무료 체험 기간(4주)이 종료 후 등록된 결제 수단으로 정상 요금이 자동 결제됩니다.</li>
              <li>Basic Plan은 매월 결제되는 구독형 상품이며, 결제 시점으로부터 1개월간 서비스 이용 권한이 제공됩니다.</li>
              <li>결제 후 7일 이내 미사용 시 전액 환불이 가능하며, 이후에는 '이용약관' 및 '환불 정책'에 따라 환불됩니다.</li>
              <li>Maker's Plan은 별도 계약을 통해 진행되며, 제작 착수 이후에는 환불이 제한될 수 있습니다.</li>
            </ul>
          </div>

        </div>
      </section>

      {/* 3. Value Proposition */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Why RuleMakers?</h2>
            <p className="text-slate-500 mt-2">단순 구독 그 이상의 가치를 제공합니다.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                <FireIcon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">검증된 문항</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                서울대 사범대 출신 연구진이 직접 제작한 문항으로 상위권 변별력을 확보하세요.
              </p>
            </div>
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
                <CurrencyDollarIcon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">최고의 가성비</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                합리적인 가격으로 높은 퀄리티의 컨텐츠와 관리 시스템을 누리세요.
              </p>
            </div>
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:border-purple-200 transition-colors">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-4">
                <ShieldCheckIcon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">확실한 성적 향상</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                취약점 분석부터 실전 대비까지, 점수가 오를 수밖에 없는 시스템입니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FAQ Section (Updated) */}
      <section className="py-24 bg-white border-t border-slate-100">
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

      {/* 5. Bottom CTA (Updated) */}
      <section className="py-24 bg-slate-900 text-white text-center">
        <div className="container mx-auto px-6">
          <SparklesIcon className="w-12 h-12 text-yellow-400 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            고민할 필요 없이, 일단 써보세요
          </h2>
          <p className="text-slate-400 mb-10 text-lg">
            Basic Plan 무료 체험을 통해 <br/>
            <strong>문제은행, 기출분석, 성적관리</strong> 기능을 모두 경험하실 수 있습니다.
          </p>
          <button 
            onClick={() => handleUpgrade("BASIC")}
            className="px-10 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-blue-50 transition-all hover:scale-105 shadow-xl shadow-white/10 cursor-pointer"
          >
            4주 무료 체험 시작하기
          </button>
          <p className="mt-4 text-xs text-slate-500">
            * 체험 종료 전 해지 시 요금이 청구되지 않습니다.
          </p>
        </div>
      </section>

    </div>
  );
}