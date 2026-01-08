// app/basic-service/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircleIcon,
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
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-10 flex justify-center gap-4"
          >
            <Link
              href="/contact"
              className="rounded-lg bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              도입 문의하기
            </Link>
            <Link
              href="/showcase"
              className="group flex items-center gap-2 rounded-lg border border-gray-600 px-8 py-3.5 text-base font-semibold text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
            >
              샘플 확인하기
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
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

      {/* ▼▼▼ [추가] 직접 만들기 CTA 섹션 ▼▼▼ */}
    <section className="py-16 bg-blue-50 border-y border-blue-100">
      <div className="container mx-auto max-w-4xl px-6 text-center">
        <h3 className="text-2xl font-bold text-slate-900 mb-4">
          지금 바로 나만의 시험지를 만들어보세요
        </h3>
        <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
          Basic Plan의 방대한 문항 데이터를 활용하여, 클릭 몇 번으로 원하는 구성의 PDF 시험지를 제작할 수 있습니다.
        </p>
        <Link 
          href="/service/maker"
          target="_blank"
          className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          문제은행 바로가기
        </Link>
      </div>
    </section>
    {/* ▲▲▲ [추가] ▲▲▲ */}
    </div>
  );
}