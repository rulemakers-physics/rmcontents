"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import {
  ChatBubbleLeftRightIcon,
  PhoneArrowUpRightIcon,
  EnvelopeIcon,
  MapPinIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  QuestionMarkCircleIcon
} from "@heroicons/react/24/outline";

// --- Animations ---
// 👇 2. 여기에 ': Variants' 타입 명시
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: "easeOut" } 
  },
};

// 👇 3. 여기도 ': Variants' 타입 명시
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-500/20 selection:text-blue-900">
      
      {/* 1. Hero Section: Deep & Professional */}
      <section className="relative w-full py-24 md:py-32 bg-slate-950 text-white overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px]" />
          <svg className="absolute inset-0 h-full w-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
             <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
               <path d="M40 0H0V40" stroke="white" strokeWidth="0.5" fill="none"/>
             </pattern>
             <rect width="100%" height="100%" fill="url(#grid-pattern)"/>
          </svg>
        </div>

        <div className="container relative z-10 mx-auto px-6 text-center max-w-4xl">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <span className="px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-bold tracking-widest uppercase backdrop-blur-md">
                Contact Us
              </span>
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="mt-6 text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              교육의 기준을 높이는 파트너십,<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                RuleMakers와 시작하세요.
              </span>
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="mt-6 text-lg text-slate-400 leading-relaxed break-keep max-w-2xl mx-auto">
              프리미엄 컨텐츠 도입부터 학습 커리큘럼 설계까지.<br/>
              최적의 소통 채널로 빠르고 정확한 답변을 드립니다.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* 2. Main Contact Options (Cards) */}
      <section className="relative -mt-16 z-20 pb-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-8"
          >
            {/* Option 1: Kakao Channel (Primary) */}
            <motion.div variants={fadeInUp} className="group relative bg-white rounded-3xl p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden hover:border-yellow-400/50 transition-colors duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="h-14 w-14 bg-[#FEE500] rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                  <ChatBubbleLeftRightIcon className="h-7 w-7 text-[#191919]" />
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900 mb-2">카카오톡 채널 상담</h3>
                <p className="text-slate-500 mb-8 break-keep">
                  가장 빠른 응답을 받으실 수 있습니다. 궁금한 점을 남겨주시면 담당자가 실시간으로 확인합니다.
                </p>

                <div className="mt-auto bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center gap-6">
                  <div className="relative h-24 w-24 flex-shrink-0 bg-white p-1 rounded-lg border border-slate-200">
                     {/* QR Code Image */}
                    <Image
                      src="/images/qr.png" // ⚠️ 실제 경로 확인
                      alt="Kakao QR"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-3">모바일로 스캔하거나 클릭하세요</p>
                    <Link
                      href="http://pf.kakao.com/_rxgPmn"
                      target="_blank"
                      className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 border-b-2 border-[#FEE500] hover:bg-[#FEE500]/20 transition-colors py-1"
                    >
                      채널 바로가기 <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Option 2: Call Back Request (Secondary) */}
            <motion.div variants={fadeInUp} className="group relative bg-white rounded-3xl p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden hover:border-blue-100 transition-colors duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 shadow-sm border border-blue-100">
                  <PhoneArrowUpRightIcon className="h-7 w-7" />
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900 mb-2">유선 상담 예약</h3>
                <p className="text-slate-500 mb-8 break-keep">
                  상세한 문의가 필요하신가요? 
                  <br />연락처를 남겨주시면 
                  <span className="font-bold text-slate-900"> 전문 컨설턴트</span>가 직접 연락드립니다.
                </p>

                <div className="mt-auto bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <div className="flex items-start gap-3 text-sm text-slate-600 mb-4">
                    <CheckCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>학원/강의 현황에 맞는 맞춤형 커리큘럼 제안</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-slate-600 mb-6">
                    <CheckCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>대규모 도입 및 B2B 계약 관련 상세 안내</span>
                  </div>
                  
                  <Link 
                    href="http://pf.kakao.com/_rxgPmn" 
                    target="_blank"
                    className="block w-full text-center py-3 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors"
                  >
                    상담 예약 남기기 (카카오톡)
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 3. Partnership Process (Visualizing Steps) */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Partnership Process</h2>
            <p className="text-slate-500 mt-3">체계적인 프로세스를 통해 최적의 교육 환경을 구축합니다.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-8 left-[12%] right-[12%] h-0.5 bg-slate-200 -z-0" />

            {[
              { icon: DocumentTextIcon, title: "01. 문의 접수", desc: "카카오톡 채널을 통해\n도입 문의 및 니즈 확인" },
              { icon: ChatBubbleLeftRightIcon, title: "02. 인터뷰/진단", desc: "학원 현황 분석 및\n맞춤형 솔루션 설계" },
              { icon: CheckCircleIcon, title: "03. 제안 및 계약", desc: "견적서 발송 및\n최종 서비스 계약 체결" },
              { icon: ArrowRightIcon, title: "04. 서비스 도입", desc: "컨텐츠 제공 및\n강사/관리자 온보딩" },
            ].map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative z-10 bg-white p-6 rounded-2xl border border-slate-100 text-center shadow-sm"
              >
                <div className="h-16 w-16 mx-auto bg-white border-4 border-slate-50 rounded-full flex items-center justify-center mb-4 shadow-sm text-blue-600">
                  <step.icon className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 whitespace-pre-line leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FAQ & Info */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="grid md:grid-cols-2 gap-16">
            
            {/* Company Info */}
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <MapPinIcon className="h-6 w-6 text-slate-400" />
                Location & Info
              </h3>
              <ul className="space-y-6 text-slate-600">
                <li className="flex items-start gap-4">
                  <span className="font-semibold text-slate-900 min-w-[80px]">Address</span>
                  <span>서울특별시 관악구 솔밭로 19-1</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="font-semibold text-slate-900 min-w-[80px]">Email</span>
                  <span className="underline decoration-slate-300 underline-offset-4">contact@rulemakers.co.kr</span> {/* ⚠️ 실제 이메일로 변경 */}
                </li>
                <li className="flex items-start gap-4">
                  <span className="font-semibold text-slate-900 min-w-[80px]">Business</span>
                  <span>665-86-02814 (주) 룰메이커스</span>
                </li>
              </ul>
            </div>

            {/* Simple FAQ */}
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <QuestionMarkCircleIcon className="h-6 w-6 text-slate-400" />
                FAQ
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 text-sm mb-1">Q. 개인 강사도 구매 가능한가요?</h4>
                  <p className="text-sm text-slate-500">학원 대상의 B2B 계약뿐 아니라, 개인 강사 계약도 다수 진행 및 운영중입니다.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 text-sm mb-1">Q. 샘플 자료를 받아볼 수 있나요?</h4>
                  <p className="text-sm text-slate-500">카카오톡 채널로 문의주시면 샘플 PDF를 확인하실 수 있습니다.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 text-sm mb-1">Q. 베이직 플랜은 구독료 외의 도입비용이 있나요?</h4>
                  <p className="text-sm text-slate-500">현재 신규 런칭 프로모션으로 도입 비용 100만원이 전액 면제되며, 
                  <span className="text-blue-600 font-bold ml-1">첫 4주는 무료</span>로 이용하실 수 있습니다. (이후 월 198,000원)</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

    </main>
  );
}