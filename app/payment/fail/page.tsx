// app/payment/fail/page.tsx

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { XCircleIcon, ExclamationTriangleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

export default function PaymentFailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");
  const message = searchParams.get("message");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 font-sans">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-xl border border-slate-100 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-50 p-4 ring-8 ring-red-50/50">
            <XCircleIcon className="h-16 w-16 text-red-500" />
          </div>
        </div>
        
        <h2 className="mb-2 text-2xl font-extrabold text-slate-900">결제 요청이 실패했습니다</h2>
        <p className="mb-8 text-slate-500 leading-relaxed text-sm">
          일시적인 오류이거나 카드 정보 문제일 수 있습니다.<br />
          아래 사유를 확인 후 다시 시도해주세요.
        </p>

        <div className="mb-8 rounded-2xl bg-red-50 p-5 text-left text-sm border border-red-100">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="block font-bold text-red-800 mb-1">실패 사유 (Code: {code})</span>
              <span className="text-red-700">{message}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={() => router.back()} // 뒤로가기를 통해 다시 시도 유도
            className="w-full rounded-xl bg-slate-900 py-4 text-base font-bold text-white transition-all hover:bg-slate-800 hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <ArrowPathIcon className="w-5 h-5" /> 다시 시도하기
          </button>
          <button 
            onClick={() => router.push("/contact")} 
            className="w-full rounded-xl border border-slate-200 bg-white py-4 text-base font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            고객센터 문의하기
          </button>
        </div>

      </div>
    </div>
  );
}