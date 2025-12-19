"use client";

import { useSearchParams } from "next/navigation";
import { loadTossPayments } from "@tosspayments/payment-sdk";
import { useAuth } from "@/context/AuthContext";

const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "test_ck_YOUR_KEY";

export default function SubscribePage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const planName = searchParams.get("plan") || "Basic Plan";

  const handleCardRegistration = async () => {
    if (!user) return alert("로그인이 필요합니다.");

    try {
      const tossPayments = await loadTossPayments(CLIENT_KEY);
      
      // '카드 자동결제' 등록 요청 (결제 위젯 아님)
      await tossPayments.requestBillingAuth("카드", {
        customerKey: user.uid, // 고객 식별용 고유 ID
        successUrl: `${window.location.origin}/payment/callback?plan=${encodeURIComponent(planName)}`, // 카드 등록 성공 시 이동
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (error) {
      console.error("카드 등록창 호출 실패:", error);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-10 text-center mt-20">
      <h1 className="text-3xl font-bold mb-4">정기구독 시작하기</h1>
      <p className="text-slate-500 mb-8">
        <strong>{planName}</strong> 구독을 위해 결제 카드를 등록합니다.
      </p>

      <div className="bg-slate-50 p-6 rounded-xl mb-8 text-left border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-2">📢 안내</h3>
        <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
          <li>카드를 등록하면 <strong>즉시 첫 달 요금이 결제</strong>됩니다.</li>
          <li>이후 매월 동일한 날짜에 자동 결제됩니다.</li>
          <li>등록된 카드는 암호화되어 안전하게 관리됩니다.</li>
        </ul>
      </div>

      <button
        onClick={handleCardRegistration}
        className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
      >
        카드 등록하고 구독하기
      </button>
    </div>
  );
}