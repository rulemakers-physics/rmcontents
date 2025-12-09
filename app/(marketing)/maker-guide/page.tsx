// app/(marketing)/maker-guide/page.tsx

"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  AdjustmentsHorizontalIcon, 
  QueueListIcon, 
  PrinterIcon, 
  ArrowPathIcon,
  CheckBadgeIcon
} from "@heroicons/react/24/outline";

export default function MakerGuidePage() {
  return (
    <main className="min-h-screen bg-white font-sans">
      
      {/* 1. Hero Section */}
      <section className="relative py-24 bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-slate-900" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase mb-6">
            PASS Question Bank
          </span>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            원하는 문제만 골라 담는<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              가장 완벽한 시험지 빌더
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            단원, 난이도, 유형별 정밀 필터링부터<br className="md:hidden"/> 간편한 편집까지.<br />
            클릭 몇 번으로 수업 자료 준비를 끝내세요.
          </p>
          <div className="flex justify-center gap-4">
            <Link 
              href="/service/maker" 
              className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-slate-900 bg-white rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-blue-500/20"
            >
              지금 바로 만들기
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Key Features Grid */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6 max-w-6xl">
          
          {/* Feature 1: Filtering */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <div className="order-2 md:order-1">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <AdjustmentsHorizontalIcon className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">초정밀 문항 필터링</h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                대단원, 중단원은 물론 <strong>난이도(기본/하/중/상/킬러)</strong>와 <strong>문항 유형(객관식/서술형)</strong>까지.
                선생님이 원하는 조건에 딱 맞는 문제들만 AI가 즉시 선별하여 추천해 드립니다.
              </p>
              <ul className="space-y-3 text-sm text-slate-500">
                <li className="flex items-center gap-3">
                  <CheckBadgeIcon className="w-5 h-5 text-blue-500" />
                  <span>22개정 교육과정 완벽 반영</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckBadgeIcon className="w-5 h-5 text-blue-500" />
                  <span>출제된 적 없는 문항 선별 기능</span>
                </li>
              </ul>
            </div>
            <div className="order-1 md:order-2 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 transform md:rotate-2 transition-transform hover:rotate-0">
              <div className="aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden relative">
                 <Image src="/images/filterfeature.png" alt="Filtering UI" fill className="object-cover object-left-top" />
              </div>
            </div>
          </div>

          {/* Feature 2: Drag & Drop */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-3 transform md:-rotate-2 transition-transform hover:rotate-0">
              <div className="aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden relative">
                 <Image src="/images/dndfeature.png" alt="Editor UI" fill className="object-cover object-top" />
              </div>
            </div>
            <div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-6">
                <QueueListIcon className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">자유로운 문항 배치 & 편집</h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                마우스 드래그로 문항 순서를 자유롭게 변경하세요.
                <br/>마음에 들지 않는 문제는 <strong>'유사 문항 교체'</strong> 버튼 하나로
                <br/>동일한 유형과 난이도의 다른 문제로 즉시 변경할 수 있습니다.
              </p>
              <ul className="space-y-3 text-sm text-slate-500">
                <li className="flex items-center gap-3">
                  <CheckBadgeIcon className="w-5 h-5 text-emerald-500" />
                  <span>직관적인 Drag & Drop 인터페이스</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckBadgeIcon className="w-5 h-5 text-emerald-500" />
                  <span>AI 기반 유사 문항 무제한 교체</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 3: Print Layout */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                <PrinterIcon className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">완벽한 인쇄 레이아웃</h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                더 이상 문서 작업으로 낭비되는 시간은 없습니다.
                <br/><strong>다단 편집(2단/4단)</strong>부터 문제 간격 조절까지,
                <br/>원하시는 시험지 양식을 자동으로 생성해 드립니다.
              </p>
              <ul className="space-y-3 text-sm text-slate-500">
                <li className="flex items-center gap-3">
                  <CheckBadgeIcon className="w-5 h-5 text-indigo-500" />
                  <span>문제지 / 정답표 / 해설지 자동 분리 인쇄</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckBadgeIcon className="w-5 h-5 text-indigo-500" />
                  <span>문제지 상단 학원 로고 삽입 기능</span>
                </li>
              </ul>
            </div>
            <div className="order-1 md:order-2 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 transform md:rotate-2 transition-transform hover:rotate-0">
              <div className="aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden relative">
                 <Image src="/images/layoutfeature.png" alt="Print Preview" fill className="object-cover" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. CTA */}
      <section className="py-24 bg-slate-900 text-center">
        <h2 className="text-3xl font-bold text-white mb-6">
          지금 바로 체험해보세요
        </h2>
        <p className="text-slate-400 mb-10">
          가입 즉시 무료로 문제를 만들어보실 수 있습니다.
        </p>
        <Link 
          href="/service/maker"
          className="inline-flex items-center justify-center px-10 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-all hover:scale-105 shadow-xl"
        >
          PASS 문제은행 시작하기
        </Link>
      </section>
    </main>
  );
}