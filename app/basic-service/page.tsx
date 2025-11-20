// app/basic-service/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircleIcon,
  GiftIcon,
  DocumentTextIcon,
  BeakerIcon,
  AcademicCapIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const features = [
  {
    icon: DocumentTextIcon,
    title: "기본 문제은행 서비스",
    desc: "다양한 난이도와 유형으로 구성된 방대한 문항 데이터베이스를 자유롭게 이용하세요.",
  },
  {
    icon: BeakerIcon,
    title: "기출 분석 및 내신 N제",
    desc: "담당 학교의 기출을 분석하여 학교별 내신 대비에 최적화된 N제를 제공합니다.",
  },
  {
    icon: AcademicCapIcon,
    title: "교육청 모의고사 분석 및 유사문항",
    desc: "매년 시행되는 교육청 모의고사를 발빠르게 분석하고, 고퀄리티 유사 문항을 업데이트합니다.",
  },
  {
    icon: CheckCircleIcon,
    title: "부교재 유사 문항",
    desc: "EBS 및 주요 개념서, 부교재의 핵심 문항을 선별하여 유사 유형으로 제공합니다.",
  },
];

export default function BasicServicePage() {
  // 실시간 인원 업데이트
  const seatsLeft = 30

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 1. Hero Section (Dark Theme) */}
      <section className="relative bg-gray-900 py-24 text-white sm:py-32">
        <div className="container mx-auto max-w-5xl px-6 text-center">
          <motion.p
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="text-base font-semibold uppercase tracking-wide text-blue-400"
          >
            Basic Plan
          </motion.p>
          <motion.h1
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl"
          >
            편의성과 퀄리티를 모두 잡은,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
             베이직 플랜
            </span>
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-gray-300"
          >
            선생님께서 강의에만 집중하실 수 있도록,
            <br className="hidden sm:block" />
            탄탄한 문제은행부터 학교별 내신 대비 컨텐츠까지 합리적 비용으로 만나보세요.
          </motion.p>
        </div>
      </section>

      {/* 2. Feature Grid */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="mb-12 md:text-center">
            <h2 className="text-3xl font-bold text-gray-900">주요 제공 서비스</h2>
            <p className="mt-4 text-lg text-gray-600">
              학원 운영과 수업 준비에 꼭 필요한 핵심 기능만을 담았습니다.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex gap-5 rounded-2xl bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Promotion Section (Redesigned) */}
      <section className="bg-white pb-24">
        <div className="container mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-16 text-center text-white shadow-2xl ring-1 ring-white/10 sm:px-16"
          >
            {/* 은은한 배경 조명 효과 */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl"></div>

            <div className="relative z-10">
              <GiftIcon className="mx-auto h-16 w-16 text-amber-400" />
              
              <h2 className="mt-6 text-3xl font-bold sm:text-4xl tracking-tight">
                베이직 플랜 <span className="text-amber-400">선착순 한정 프로모션</span>
              </h2>
              
              <div className="mt-6 mb-8 animate-pulse">
                 <p className="text-2xl font-bold text-red-400">
                   현재 마감까지 <span className="text-4xl text-white mx-1">{seatsLeft}</span>자리 남았습니다!
                 </p>
              </div>
              
              <p className="mt-6 text-xl text-gray-300">
                최초 도입 비용 
                <span className="mx-2 text-2xl font-bold text-gray-400 line-through decoration-red-400 decoration-4">100만원</span> 
                <span className="text-3xl font-extrabold text-amber-400">전액 면제</span>
              </p>
              
              <div className="mt-8 inline-flex items-center rounded-full bg-amber-400/10 px-4 py-1.5 text-sm font-medium text-amber-300 ring-1 ring-inset ring-amber-400/30">
                선착순 한정 혜택
              </div>

              <div className="mt-10 grid gap-6 text-left sm:grid-cols-2 sm:gap-x-12">
                <ul className="space-y-4 text-gray-300">
                  <li className="flex items-center gap-3">
                    <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-amber-500" />
                    <span>학원 홍보용 블로그 컨텐츠 제공</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-amber-500" />
                    <span>학원 블로그 개설 및 배너 제공</span>
                  </li>
                </ul>
                <ul className="space-y-4 text-gray-300">
                  <li className="flex items-center gap-3">
                    <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-amber-500" />
                    <span>학부모 상담용 가이드북 제공</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-amber-500" />
                    <span>RuleMakers 공식 인증서 발급</span>
                  </li>
                </ul>
              </div>

              <div className="mt-12">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 text-lg font-bold text-slate-900 transition-all hover:bg-gray-100 hover:scale-105"
                >
                  도입 문의하기
                  <ArrowRightIcon className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}