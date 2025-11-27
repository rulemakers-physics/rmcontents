// app/pricing/page.tsx

"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { 
  CheckIcon, 
  XMarkIcon, 
  QuestionMarkCircleIcon, 
  SparklesIcon 
} from "@heroicons/react/24/outline";

// --- 데이터 정의 ---
const PLANS = [
  {
    id: "BASIC",
    name: "Basic Plan",
    price: "99,000",
    period: "/월",
    desc: "내신 대비와 기본 문제은행이 필요한 선생님",
    features: [
      "기본 문제은행 무제한 이용",
      "학교별 기출 분석 리포트",
      "내신 대비 N제 (시험 4주 전 제공)",
      "교육청 모의고사 변형 문제",
    ],
    isPopular: false,
    buttonColor: "bg-white text-slate-900 border-2 border-slate-200 hover:bg-slate-50",
  },
  {
    id: "MAKERS",
    name: "Maker's Plan",
    price: "별도 문의",
    period: "",
    desc: "나만의 킬러 문항과 1:1 맞춤 제작이 필요한 선생님",
    features: [
      "Basic Plan의 모든 기능 포함",
      "자체 제작 킬러/고난도 문항 무제한",
      "1:1 맞춤형 교재 제작 요청권 (월 3회)",
      "전담 매니저 배정 및 우선 피드백",
      "학원 로고 삽입 및 커스텀 표지",
    ],
    isPopular: true,
    buttonColor: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30",
  },
];

const COMPARISON_FEATURES = [
  { name: "기본 문항 데이터베이스", basic: true, makers: true },
  { name: "학교별 기출 분석", basic: true, makers: true },
  { name: "PDF 시험지 생성/출력", basic: true, makers: true },
  { name: "정답지/해설지 제공", basic: true, makers: true },
  { name: "고난도(킬러) 자체 제작 문항", basic: false, makers: true },
  { name: "1:1 맞춤 교재 제작 요청", basic: false, makers: "월 3회 제공" },
  { name: "전담 매니저 배정", basic: false, makers: true },
  { name: "커스텀 브랜딩 (로고/표지)", basic: false, makers: true },
];

const FAQS = [
  {
    q: "결제 후 바로 이용 가능한가요?",
    a: "네, Basic Plan은 결제 즉시 모든 기능을 이용하실 수 있습니다. Maker's Plan은 담당자 상담 후 계정이 활성화됩니다."
  },
  {
    q: "요청서 코인(Coins)은 무엇인가요?",
    a: "Maker's Plan 회원에게만 제공되는 '제작 요청 권한'입니다. 코인 1개당 1건의 맞춤형 교재 제작을 의뢰하실 수 있습니다."
  },
  {
    q: "중도 해지 시 환불 규정은 어떻게 되나요?",
    a: "서비스 이용 내역이 없는 경우 7일 이내 전액 환불 가능합니다. 디지털 컨텐츠 특성상 파일 다운로드 이후에는 환불이 불가합니다."
  },
  {
    q: "세금계산서 발행이 가능한가요?",
    a: "네, 가능합니다. 마이페이지 > 결제 관리에서 사업자 정보를 입력해주시면 매월 자동으로 발행됩니다."
  }
];

export default function PricingPage() {
  const { user, userData } = useAuth();

  const handleUpgrade = async (planId: string) => {
    if (!user) return alert("로그인이 필요합니다.");
    
    const confirmMsg = planId === 'MAKERS' 
      ? "Maker's Plan 도입 상담을 신청하시겠습니까? (테스트: 즉시 업그레이드)" 
      : "Basic Plan(월 99,000원)을 구독하시겠습니까?";

    if (confirm(confirmMsg)) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          plan: planId,
          updatedAt: new Date(),
          coins: planId === 'MAKERS' ? 3 : 0 
        });
        alert(`${planId} 플랜이 적용되었습니다!`);
        window.location.reload();
      } catch (e) {
        console.error(e);
        alert("처리 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* 1. Hero Header */}
      <section className="pt-24 pb-12 px-6 text-center bg-white border-b border-slate-200">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
            학원 성장을 위한 <br className="md:hidden"/>최고의 투자
          </h1>
          <p className="text-lg text-slate-500">
            단순한 문제은행을 넘어, 선생님의 시간을 아껴드리는 파트너가 되겠습니다.
          </p>
        </motion.div>
      </section>

      {/* 2. Pricing Cards */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {PLANS.map((plan, idx) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className={`relative p-8 rounded-3xl border transition-all duration-300 ${
                  plan.isPopular 
                    ? "bg-slate-900 text-white border-slate-800 shadow-2xl scale-105 z-10" 
                    : "bg-white text-slate-900 border-slate-200 shadow-sm hover:shadow-md"
                }`}
              >
                {plan.isPopular && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    MOST POPULAR
                  </span>
                )}

                <h3 className={`text-xl font-bold mb-2 ${plan.isPopular ? "text-blue-400" : "text-slate-900"}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                  <span className={`text-sm ${plan.isPopular ? "text-slate-400" : "text-slate-500"}`}>{plan.period}</span>
                </div>
                <p className={`text-sm mb-8 ${plan.isPopular ? "text-slate-300" : "text-slate-500"}`}>
                  {plan.desc}
                </p>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <CheckIcon className={`w-5 h-5 flex-shrink-0 ${plan.isPopular ? "text-blue-400" : "text-blue-600"}`} />
                      <span className={plan.isPopular ? "text-slate-200" : "text-slate-700"}>{feat}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  className={`w-full py-4 rounded-xl font-bold text-sm transition-all ${plan.buttonColor}`}
                >
                  {userData?.plan === plan.id ? "현재 이용 중" : (plan.id === 'MAKERS' ? "도입 문의하기" : "지금 시작하기")}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Detailed Comparison Table */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="container mx-auto max-w-4xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900">기능 상세 비교</h2>
          </div>
          
          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-900 font-bold">
                <tr>
                  <th className="py-4 px-6">기능</th>
                  <th className="py-4 px-6 text-center w-1/4">Basic</th>
                  <th className="py-4 px-6 text-center w-1/4 text-blue-600">Maker's</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {COMPARISON_FEATURES.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6 font-medium text-slate-700">{item.name}</td>
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

      {/* 4. FAQ Section */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="container mx-auto max-w-3xl px-6">
          <div className="flex items-center justify-center gap-2 mb-10">
            <QuestionMarkCircleIcon className="w-6 h-6 text-slate-400" />
            <h2 className="text-2xl font-bold text-slate-900">자주 묻는 질문</h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-2 flex items-start gap-2">
                  <span className="text-blue-500">Q.</span> {faq.q}
                </h3>
                <p className="text-slate-600 text-sm pl-6 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Bottom CTA */}
      <section className="py-20 bg-slate-900 text-white text-center">
        <div className="container mx-auto px-6">
          <SparklesIcon className="w-10 h-10 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-6">아직 고민되시나요?</h2>
          <p className="text-slate-400 mb-8">
            무료 샘플을 먼저 받아보시고 결정하세요.<br/>
            회원가입만 하셔도 맛보기 PDF를 다운로드하실 수 있습니다.
          </p>
          <button 
            onClick={() => window.location.href = '/showcase'}
            className="px-8 py-3 bg-white text-slate-900 rounded-full font-bold hover:bg-slate-100 transition-colors"
          >
            샘플 자료 보러가기
          </button>
        </div>
      </section>

    </div>
  );
}