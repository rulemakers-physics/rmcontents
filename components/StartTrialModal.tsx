// components/StartTrialModal.tsx

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // [추가] 링크 이동용
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { 
  XMarkIcon, 
  GiftIcon, // [변경] 아이콘 교체
  CheckCircleIcon, 
  CalendarDaysIcon, 
  CreditCardIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function StartTrialModal({ isOpen, onClose }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false); // [신규] 동의 체크 상태

  // [로직] 오늘 날짜 + 14일 (1차 체험 종료일) 계산
  const firstTrialEndDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];

    return `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;
  }, []);

  if (!isOpen) return null;

  const handleStartTrial = async () => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    // [체크] 동의 여부 확인
    if (!isAgreed) {
      toast.error("서비스 이용약관에 동의해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      // 1. 유저 정보 업데이트 (체험 시작)
      await updateDoc(doc(db, "users", user.uid), {
        trialStartDate: serverTimestamp(),
        subscriptionStatus: "TRIAL",
        plan: "BASIC" 
      });

      toast.success("14일 무료 체험이 시작되었습니다! 🎉");
      onClose();
      router.push("/service/maker"); 
    } catch (error) {
      console.error(error);
      toast.error("오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden relative transform transition-all scale-100">
        
        {/* 닫기 버튼 */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-black/10 rounded-full text-white/90 hover:text-white transition-colors z-10"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {/* [디자인] 상단 헤더: 선물/혜택 느낌 강조 (그라데이션) */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white text-center relative overflow-hidden">
          {/* 배경 패턴 */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          
          {/* 아이콘 */}
          <div className="inline-flex p-3 bg-white/20 rounded-2xl mb-4 backdrop-blur-md shadow-inner border border-white/10">
            <GiftIcon className="w-10 h-10 text-yellow-300" />
          </div>
          
          <h2 className="text-2xl font-extrabold mb-2 leading-tight">
            Basic Plan 무료 체험
          </h2>
          <p className="text-indigo-100 text-sm font-medium opacity-90">
            카드 등록 없이 14일, 등록 시 14일 더!<br/>총 4주(14+14)의 혜택을 놓치지 마세요!
          </p>
        </div>

        <div className="p-7">
          
          {/* [핵심] 14+14 타임라인 디자인 */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 mb-6 relative">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
              Benefit Timeline
            </h3>
            
            <div className="space-y-6 relative pl-2">
              {/* 타임라인 연결선 */}
              <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-200 -z-0"></div>

              {/* Step 1: 현재 (14일) */}
              <div className="flex gap-4 items-start z-10 relative">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-md ring-4 ring-white">
                  1
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800 text-sm">지금 즉시 시작 (Today)</h4>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      카드 X
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    결제 정보 없이 <strong className="text-indigo-600">14일간</strong> Basic Plan의 모든 기능을 제한 없이 이용합니다.
                  </p>
                  <p className="text-xs text-slate-400 mt-1 font-medium bg-white px-2 py-1 rounded border border-slate-100 inline-block">
                    ~ {firstTrialEndDate} 까지
                  </p>
                </div>
              </div>
              
              {/* Step 2: 추가 혜택 (+14일) */}
              <div className="flex gap-4 items-start z-10 relative">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-300 text-slate-400 flex items-center justify-center text-xs font-bold shadow-sm ring-4 ring-white">
                  2
                </div>
                <div className="flex-1 opacity-80">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-700 text-sm">체험 기간 중 카드 등록 시</h4>
                    <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      +14일 추가
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    종료 전 카드를 등록하면 <strong className="text-indigo-600">2주 추가 무료</strong> 혜택이 자동 적용됩니다. (총 4주)
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* 혜택 요약 (아이콘 그리드) */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <BenefitItem text="문제은행 무제한" />
            <BenefitItem text="PDF 시험지 저장" />
            <BenefitItem text="학교별 기출 분석" />
            <BenefitItem text="오답 클리닉 생성" />
          </div>
          {/* [변경] 동의 체크박스 & 약관 링크 (버튼 위로 배치) */}
          <label className="flex items-start gap-3 p-3 -mx-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors mb-4 group select-none">
            <div className="relative flex items-center mt-0.5">
              <input 
                type="checkbox" 
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-slate-300 shadow-sm checked:border-indigo-600 checked:bg-indigo-600 transition-all"
              />
              <CheckCircleIcon className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
            </div>
            <div className="text-sm text-slate-600 leading-snug">
              <span className={`font-bold transition-colors ${isAgreed ? 'text-indigo-600' : 'text-slate-800'}`}>
                아래 약관을 확인하였으며 동의합니다.
              </span>
              <div className="text-xs text-slate-400 mt-1 flex gap-1">
                <Link href="/terms" target="_blank" className="underline hover:text-slate-600" onClick={(e) => e.stopPropagation()}>이용약관</Link>
                <span>및</span>
                <Link href="/privacy" target="_blank" className="underline hover:text-slate-600" onClick={(e) => e.stopPropagation()}>개인정보처리방침</Link>
              </div>
            </div>
          </label>

          {/* 액션 버튼 (체크 안하면 비활성화) */}
          <button
            onClick={handleStartTrial}
            disabled={isLoading || !isAgreed}
            className={`w-full py-4 rounded-xl text-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-[0.98]
              ${isAgreed 
                ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200" 
                : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                설정 중...
              </span>
            ) : (
              <>
                <CalendarDaysIcon className="w-5 h-5" />
                무료 체험 시작하기
              </>
            )}
          </button>
          
          <div className="mt-4 flex justify-center items-center gap-1 text-xs text-slate-400">
            <ShieldCheckIcon className="w-3.5 h-3.5" />
            <span>언제든 위약금 없이 해지 가능합니다.</span>
          </div>

        </div>
      </div>
    </div>
  );
}

// 혜택 아이템 컴포넌트
function BenefitItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-white px-3 py-2 rounded-lg border border-slate-100 shadow-sm">
      <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
      {text}
    </div>
  );
}