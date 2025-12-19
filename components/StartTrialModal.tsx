// components/StartTrialModal.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { XMarkIcon, SparklesIcon, CalendarDaysIcon, CreditCardIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function StartTrialModal({ isOpen, onClose }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleStartTrial = async () => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    setIsLoading(true);
    try {
      // [핵심] 여기서 체험 시작일 기록
      await updateDoc(doc(db, "users", user.uid), {
        trialStartDate: serverTimestamp(),
        subscriptionStatus: "TRIAL",
        plan: "BASIC" // 체험 기간 동안 BASIC 플랜 적용
      });

      toast.success("무료 체험이 시작되었습니다! 🎉");
      onClose();
      router.push("/service/maker"); // 문제은행으로 이동
    } catch (error) {
      console.error(error);
      toast.error("오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="p-8 text-center">
          
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3">
            RuleMakers 컨텐츠 서비스 무료 체험 시작
          </h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            지금부터 <span className="text-indigo-600 font-bold">총 4주간</span> 무료로 이용해보세요.<br/>
            언제든 위약금 없이 해지하실 수 있습니다.
          </p>

          {/* 타임라인 안내 */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-left space-y-4 mb-8">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">1</div>
                <div className="h-full w-0.5 bg-blue-100 my-1"></div>
              </div>
              <div className="pb-4">
                <h4 className="font-bold text-slate-800 text-sm">지금 즉시 시작 (Today)</h4>
                <p className="text-xs text-slate-500 mt-1">카드 등록 없이 <strong>14일간 무제한</strong> 무료 이용</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">2</div>
                <div className="h-full w-0.5 bg-slate-100 my-1"></div>
              </div>
              <div className="pb-4">
                <h4 className="font-bold text-slate-800 text-sm">15일 차 (추가 혜택)</h4>
                <p className="text-xs text-slate-500 mt-1">결제 수단 등록 시 <strong>+14일 추가 무료</strong> 연장</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold">3</div>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">29일 차 (유료 전환)</h4>
                <p className="text-xs text-slate-500 mt-1">첫 결제 시작 (월 199,000원 / 언제든 해지 가능)</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleStartTrial}
            disabled={isLoading}
            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-70"
          >
            {isLoading ? "처리 중..." : "동의하고 무료 체험 시작하기"}
          </button>
          <p className="text-xs text-slate-400 mt-4">
            위 내용을 확인하였으며, 서비스 이용 약관에 동의합니다.
          </p>
        </div>
      </div>
    </div>
  );
}