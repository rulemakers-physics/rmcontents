// app/contact/page.tsx

"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ChatBubbleOvalLeftEllipsisIcon,
  PhoneIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 1. Hero Section */}
      <section className="relative bg-gray-900 py-24 text-white sm:py-32">
        <div className="container mx-auto max-w-3xl px-6 text-center">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <span className="text-base font-semibold uppercase tracking-wide text-blue-400">
              Contact Us
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">
              도입 문의하기
            </h1>
            <p className="mt-6 text-lg text-gray-300">
              RuleMakers의 프리미엄 컨텐츠 도입을 고민 중이신가요?
              <br />
              편하신 방법으로 문의주시면 담당자가 친절하게 안내해 드리겠습니다.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 2. Contact Options */}
      <section className="py-20">
        <div className="container mx-auto max-w-4xl px-6">
          <div className="grid gap-8 md:grid-cols-2">
            
            {/* Option 1: 카카오톡 채널 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-200 transition-shadow hover:shadow-lg"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
                <ChatBubbleOvalLeftEllipsisIcon className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">카카오톡 채널</h3>
              <p className="mt-3 text-gray-600">
                가장 빠르고 간편하게 상담하실 수 있습니다.
                <br />
                채널을 추가하고 메시지를 남겨주세요.
              </p>
              
              {/* [수정] QR 코드 섹션 디자인 개선 */}
              <div className="mt-8 flex flex-col items-center">
                <div className="relative h-36 w-36 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 p-4 shadow-inner">
                  <Image
                    src="/images/qr.png"
                    alt="카카오톡 채널 QR코드"
                    fill
                    className="object-contain mix-blend-multiply" // 흰색 배경 자연스럽게 처리
                  />
                </div>
                <p className="mt-3 text-xs font-medium text-gray-400">
                  스마트폰 카메라로 QR코드를 스캔하세요
                </p>
              </div>

              <div className="mt-8">
                <Link
                  href="http://pf.kakao.com/_rxgPmn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#FEE500] px-6 py-3 text-base font-semibold text-[#191919] hover:bg-[#FDD835] transition-colors"
                >
                  채널 바로가기
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>

            {/* Option 2: 전화 상담 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-200 transition-shadow hover:shadow-lg"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <PhoneIcon className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">전화 상담</h3>
              <p className="mt-3 text-gray-600">
                전문 상담원과 직접 통화하며
                <br />
                상세한 안내를 받으실 수 있습니다.
              </p>
              <div className="mt-8">
                {/* 전화번호가 미정일 때의 UI 처리 */}
                <span className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-6 py-3 text-base font-semibold text-gray-500 cursor-not-allowed">
                  <PhoneIcon className="h-4 w-4" />
                  번호 준비중
                </span>
                <p className="mt-2 text-xs text-gray-400">
                  (평일 10:00 - 18:00 운영 예정)
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>
    </div>
  );
}