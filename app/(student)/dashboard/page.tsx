// app/(student)/dashboard/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FireIcon, 
  ChevronRightIcon, 
  BellIcon,
  PlayCircleIcon
} from "@heroicons/react/24/solid";
import { 
  ClockIcon, 
  CheckCircleIcon 
} from "@heroicons/react/24/outline";

export default function StudentDashboard() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  
  // D-Day 예시 데이터 (실제로는 DB에서 가져오거나 설정 가능)
  const dDayTitle = "1학기 중간고사";
  const dDayDate = new Date("2025-04-28");
  const today = new Date();
  const diffTime = Math.abs(dDayDate.getTime() - today.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  useEffect(() => {
    if (!loading && (!user || userData?.role !== 'student')) {
      // 학생이 아니면 메인으로 튕겨냄 (보안)
      // router.push("/"); 
    }
  }, [user, userData, loading, router]);

  if (loading) return <div className="p-8 text-center text-teal-600">로딩 중...</div>;

  return (
    <div className="px-6 py-8">
      
      {/* 1. Header & Welcome */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-sm text-slate-500 mb-1">오늘도 파이팅! 🔥</p>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {userData?.name || "학생"}님,<br />
            <span className="text-teal-600">1등급</span>까지 {diffDays}일 남았어요
          </h1>
        </div>
        <button className="p-2 bg-white border border-slate-100 rounded-full shadow-sm relative">
          <BellIcon className="w-6 h-6 text-slate-400" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
      </div>

      {/* 2. D-Day Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-lg mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        
        <div className="flex justify-between items-center mb-6">
          <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-teal-300 border border-white/10">
            Target
          </span>
          <span className="text-sm font-medium text-slate-300">{dDayTitle}</span>
        </div>
        
        <div className="flex items-end gap-2 mb-2">
          <span className="text-5xl font-black tracking-tight">D-{diffDays}</span>
        </div>
        <p className="text-slate-400 text-sm">
          {dDayDate.toLocaleDateString()} 까지
        </p>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>목표 달성률</span>
            <span>65%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 w-[65%]" />
          </div>
        </div>
      </div>

      {/* 3. Quick Actions (Study Modes) */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link 
          href="/student/study/daily"
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm active:scale-95 transition-transform flex flex-col justify-between h-32"
        >
          <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 mb-2">
            <ClockIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">매일 10분</h3>
            <p className="text-xs text-slate-500">가볍게 몸풀기</p>
          </div>
        </Link>
        
        <Link 
          href="/student/study/weakness"
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm active:scale-95 transition-transform flex flex-col justify-between h-32"
        >
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500 mb-2">
            <FireIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">취약점 공략</h3>
            <p className="text-xs text-slate-500">오답 집중 케어</p>
          </div>
        </Link>
      </div>

      {/* 4. Recent Activity */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-900">최근 학습 기록</h2>
          <Link href="/student/report" className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center">
            전체보기 <ChevronRightIcon className="w-3 h-3 ml-1" />
          </Link>
        </div>
        
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${i === 1 ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-400'}`}>
                  {i === 1 ? <PlayCircleIcon className="w-6 h-6" /> : <CheckCircleIcon className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">통합과학 1단원 모의고사</h4>
                  <p className="text-xs text-slate-500 mt-0.5">20문제 • 85점</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-400">2시간 전</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}