// app/payment/subscribe/page.tsx

"use client";

import { useSearchParams } from "next/navigation";
import { loadTossPayments } from "@tosspayments/payment-sdk";
import { useAuth } from "@/context/AuthContext";
import { CreditCardIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "test_ck_YOUR_KEY";

export default function SubscribePage() {
  const { user, userData } = useAuth();
  const searchParams = useSearchParams();
  const planName = searchParams.get("plan") || "Basic Plan";

  // 다음 결제일 계산 (예: 오늘로부터 30일 뒤, 혹은 무료체험 종료일)
  // 실제로는 DB의 trialStartDate를 기준으로 계산해야 정확하지만, 여기선 UX상 표시용
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 14); // 예시: 남은 14일 뒤
  const nextPaymentDateStr = trialEndDate.toLocaleDateString();

  const handleCardRegistration = async () => {
    if (!user) return alert("로그인이 필요합니다.");

    try {
      const tossPayments = await loadTossPayments(CLIENT_KEY);
      
      // '카드 자동결제' 등록 요청
      await tossPayments.requestBillingAuth("카드", {
        customerKey: user.uid,
        successUrl: `${window.location.origin}/payment/callback?plan=${encodeURIComponent(planName)}&isTrialExtension=true`, 
        // isTrialExtension 파라미터를 추가하여 백엔드에서 0원 결제 처리 구분 가능
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (error) {
      console.error("카드 등록창 호출 실패:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* 상단 헤더 */}
        <div className="bg-slate-900 p-8 text-center text-white">
          <h1 className="text-2xl font-bold mb-2">무료 체험 연장하기</h1>
          <p className="text-slate-300 text-sm">
            카드를 등록하고 남은 기간도 <span className="text-yellow-400 font-bold">무료</span>로 이용하세요.
          </p>
        </div>

        <div className="p-8">
          {/* 요금 정보 박스 */}
          <div className="flex justify-between items-center bg-blue-50 p-5 rounded-2xl border border-blue-100 mb-6">
            <div>
              <p className="text-xs text-blue-600 font-bold uppercase">Today's Payment</p>
              <p className="text-2xl font-black text-slate-900">0원</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-medium">첫 결제 예정일</p>
              <p className="text-sm font-bold text-slate-700">{nextPaymentDateStr} 부터</p>
              <p className="text-xs text-slate-400">매월 199,000원</p>
            </div>
          </div>

          <ul className="space-y-4 mb-8 text-sm text-slate-600">
            <li className="flex gap-3">
              <ShieldCheckIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span>오늘 <strong>어떤 비용도 청구되지 않습니다.</strong></span>
            </li>
            <li className="flex gap-3">
              <CreditCardIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <span>등록된 카드로 무료 체험 종료 후 정기 결제가 시작됩니다.</span>
            </li>
            <li className="flex gap-3">
              <ShieldCheckIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <span>언제든지 위약금 없이 해지 가능합니다.</span>
            </li>
          </ul>

          <button
            onClick={handleCardRegistration}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            카드 등록하고 계속 이용하기
          </button>
          
          <p className="text-xs text-center text-slate-400 mt-4">
            안전한 결제를 위해 Toss Payments 시스템을 이용합니다.
          </p>
        </div>
      </div>
    </div>
  );
}