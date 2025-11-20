// app/company/page.tsx

"use client";

import React from "react";
import { motion } from "framer-motion";

export default function CompanyPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header Section */}
      <section className="bg-gray-900 py-24 text-center text-white">
        <div className="container mx-auto px-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold"
          >
            RuleMakers 소개
          </motion.h1>
          <p className="mt-4 text-lg text-gray-300">
            강사님의 성장을 돕는 최고의 파트너가 되겠습니다.
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-4xl px-6 py-16">
        {/* CEO Greeting */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-blue-600 mb-6">CEO 인사말</h2>
          <div className="prose prose-lg text-gray-700 leading-relaxed">
            <p className="mb-4">
              안녕하세요, <strong>RuleMakers</strong> 대표입니다.
            </p>
            <p className="mb-4">
              우리는 강사님들이 오직 <strong>'강의'</strong>에만 집중할 수 있는 환경을 만들기 위해 설립되었습니다.
              수업 준비, 자료 제작, 행정 업무 등 강사님들의 소중한 시간을 빼앗는 수많은 업무들 중에서,
              가장 전문성이 요구되면서도 시간이 많이 소요되는 <strong>'컨텐츠 제작'</strong> 영역을 혁신하고자 합니다.
            </p>
            <p>
              시대인재 컨텐츠팀에서의 경험을 바탕으로, 단순한 문제 은행이 아닌
              강사님만의 철학이 담긴 <strong>High-End 맞춤형 교재</strong>를 제공해 드리겠습니다.
              RuleMakers와 함께 더 높이 비상하시길 바랍니다.
            </p>
          </div>
        </div>

        {/* History */}
        <div>
          <h2 className="text-3xl font-bold text-blue-600 mb-8">연혁</h2>
          <div className="relative border-l-2 border-gray-200 pl-8 space-y-10 ml-4">
            
            <div className="relative">
              <span className="absolute -left-[41px] top-1 h-5 w-5 rounded-full border-4 border-white bg-blue-600 ring-2 ring-blue-100"></span>
              <span className="block text-sm font-bold text-blue-600 mb-1">2025. 10</span>
              <h3 className="text-xl font-bold text-gray-900">RuleMakers 법인 설립</h3>
              <p className="text-gray-600 mt-1">프리미엄 컨텐츠 서비스 공식 런칭</p>
            </div>

            <div className="relative">
              <span className="absolute -left-[41px] top-1 h-5 w-5 rounded-full border-4 border-white bg-gray-300"></span>
              <span className="block text-sm font-bold text-gray-500 mb-1">2025. 01</span>
              <h3 className="text-xl font-bold text-gray-900">연구소 설립 및 팀 구성</h3>
              <p className="text-gray-600 mt-1">서울대 출신 및 시대인재 컨텐츠팀 연구진 합류</p>
            </div>

            <div className="relative">
              <span className="absolute -left-[41px] top-1 h-5 w-5 rounded-full border-4 border-white bg-gray-300"></span>
              <span className="block text-sm font-bold text-gray-500 mb-1">2024. 06</span>
              <h3 className="text-xl font-bold text-gray-900">베타 서비스 운영</h3>
              <p className="text-gray-600 mt-1">대치동 학원 대상 시범 서비스 진행 (만족도 98%)</p>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}