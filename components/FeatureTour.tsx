// components/FeatureTour.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  XMarkIcon, 
  ChevronRightIcon, 
  SparklesIcon, 
  BeakerIcon, 
  BellIcon 
} from "@heroicons/react/24/solid";

const TOUR_STEPS = [
  {
    title: "새로워진 대시보드",
    desc: "선생님의 작업 현황과 잔여 코인을 한눈에 확인하세요.",
    icon: <SparklesIcon className="w-6 h-6 text-yellow-400" />
  },
  {
    title: "문제은행 (Maker)",
    desc: "원하는 문제를 직접 골라 나만의 시험지를 만들어보세요. (BETA)",
    icon: <BeakerIcon className="w-6 h-6 text-blue-400" />
  },
  {
    title: "알림 센터 통합",
    desc: "작업 완료 소식과 중요 공지사항을 우측 상단 종 모양 아이콘에서 확인하세요.",
    icon: <BellIcon className="w-6 h-6 text-red-400" />
  },
  {
    title: "준비 되셨나요?",
    desc: "지금 바로 첫 번째 시험지를 만들어보세요!",
    icon: "🚀"
  }
];

export default function FeatureTour() {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 로컬스토리지 체크 (v2로 버전 업)
    const hasSeen = localStorage.getItem("hasSeenDashboardTour_v2");
    if (!hasSeen) {
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("hasSeenDashboardTour_v2", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-end justify-center sm:justify-end sm:items-end p-6">
      {/* 가이드 카드 (Pointer Events Auto로 설정하여 클릭 가능하게) */}
      <div className="pointer-events-auto w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-500">
        
        {/* Progress Bar */}
        <div className="h-1 bg-slate-100 w-full">
          <div 
            className="h-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${((step + 1) / TOUR_STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-slate-50 rounded-xl">
               {typeof TOUR_STEPS[step].icon === 'string' 
                 ? <span className="text-xl">{TOUR_STEPS[step].icon}</span>
                 : TOUR_STEPS[step].icon
               }
            </div>
            <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-2">
            {TOUR_STEPS[step].title}
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed mb-6 h-10">
            {TOUR_STEPS[step].desc}
          </p>

          <div className="flex justify-between items-center">
            <div className="flex gap-1">
              {TOUR_STEPS.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-blue-600' : 'bg-slate-200'}`} 
                />
              ))}
            </div>
            <button 
              onClick={handleNext}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all active:scale-95"
            >
              {step === TOUR_STEPS.length - 1 ? "시작하기" : "다음"}
              {step < TOUR_STEPS.length - 1 && <ChevronRightIcon className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}