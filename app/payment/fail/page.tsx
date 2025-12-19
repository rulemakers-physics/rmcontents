"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function PaymentFailPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const message = searchParams.get("message");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 font-sans">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-xl border border-slate-100 text-center">
        
        {/* 아이콘 */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-50 p-4 ring-1 ring-red-100">
            <XCircleIcon className="h-16 w-16 text-red-500" />
          </div>
        </div>
        
        {/* 제목 & 설명 */}
        <h2 className="mb-2 text-2xl font-extrabold text-slate-900">결제에 실패했습니다</h2>
        <p className="mb-8 text-slate-500 leading-relaxed">
          결제 진행 중 문제가 발생하여 중단되었습니다.<br />
          아래 실패 사유를 확인해 주세요.
        </p>

        {/* 에러 상세 정보 박스 */}
        <div className="mb-8 rounded-2xl bg-slate-50 p-5 text-left text-sm border border-slate-200">
          <div className="flex items-start gap-3 mb-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="block font-bold text-slate-800 mb-1">에러 코드</span>
              <span className="text-slate-600 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-xs">
                {code}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 flex-shrink-0" /> {/* Indent spacer */}
            <div>
              <span className="block font-bold text-slate-800 mb-1">실패 사유</span>
              <span className="text-slate-600">{message}</span>
            </div>
          </div>
        </div>

        {/* 버튼 그룹 */}
        <div className="flex flex-col gap-3">
          <Link 
            href="/pricing" 
            className="w-full rounded-xl bg-slate-900 py-4 text-base font-bold text-white transition-all hover:bg-slate-800 hover:shadow-lg active:scale-[0.98]"
          >
            다시 시도하기
          </Link>
          <Link 
            href="/contact" 
            className="w-full rounded-xl border border-slate-200 bg-white py-4 text-base font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            고객센터 문의하기
          </Link>
        </div>

      </div>
    </div>
  );
}