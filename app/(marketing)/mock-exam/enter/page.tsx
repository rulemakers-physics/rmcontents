// app/(marketing)/mock-exam/enter/page.tsx

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheckIcon, DevicePhoneMobileIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

export default function MockExamEnterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetExamId = searchParams.get("examId") || "2025_final_vol1";

  const [phone, setPhone] = useState("");
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedMarketing, setAgreedMarketing] = useState(false);

  // 전화번호 자동 하이픈 포맷팅 및 숫자만 입력 허용
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, ""); // 숫자 이외 제거
    let formatted = raw;
    
    if (raw.length > 3 && raw.length <= 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
    } else if (raw.length > 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
    }
    
    // 최대 길이 제한 (010-0000-0000 -> 13자)
    if (formatted.length <= 13) {
      setPhone(formatted);
    }
  };

  const handleStart = () => {
    if (phone.length < 12) { // 010-000-0000 (12) or 010-0000-0000 (13)
      toast.error("올바른 휴대폰 번호를 입력해주세요.");
      return;
    }
    if (!agreedPrivacy) {
      toast.error("필수 개인정보 수집 및 이용에 동의해야 합니다.");
      return;
    }

    sessionStorage.setItem("mock_user_phone", phone);
    sessionStorage.setItem("mock_marketing_agree", String(agreedMarketing));
    
    router.push(`/mock-exam/omr/${targetExamId}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-400 mb-4 border border-indigo-500/20">
            <DevicePhoneMobileIcon className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">응시자 정보 입력</h1>
          <p className="text-slate-400 text-sm">
            정확한 채점 결과 분석과<br/>추후 성적표 발송을 위해 정보를 입력해주세요.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">휴대폰 번호</label>
            {/* [수정] 배경을 흰색(bg-white)으로 변경하고 텍스트를 진한색(text-slate-900)으로 설정 */}
            <input 
              type="tel" 
              value={phone}
              onChange={handlePhoneChange}
              placeholder="010-0000-0000"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all text-center text-lg font-bold tracking-wide"
            />
          </div>

          <div className="space-y-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center pt-0.5">
                <input 
                  type="checkbox" 
                  checked={agreedPrivacy} 
                  onChange={(e) => setAgreedPrivacy(e.target.checked)}
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-600 bg-slate-800 checked:border-indigo-500 checked:bg-indigo-500 transition-all"
                />
                <ShieldCheckIcon className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100" />
              </div>
              <div className="flex-1">
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors font-medium">
                  [필수] 개인정보 수집 및 이용 동의
                </span>
                <p className="text-xs text-slate-500 mt-0.5">수집항목: 휴대폰번호 / 목적: 성적 산출 및 결과 제공</p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center pt-0.5">
                <input 
                  type="checkbox" 
                  checked={agreedMarketing} 
                  onChange={(e) => setAgreedMarketing(e.target.checked)}
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-600 bg-slate-800 checked:border-indigo-500 checked:bg-indigo-500 transition-all"
                />
                <ShieldCheckIcon className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100" />
              </div>
              <div className="flex-1">
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors font-medium">
                  [선택] 마케팅 정보 수신 동의
                </span>
                <p className="text-xs text-slate-500 mt-0.5">2차 정밀 분석 리포트 및 학습 자료 무료 발송</p>
              </div>
            </label>
          </div>

          <button 
            onClick={handleStart}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
              phone.length >= 12 && agreedPrivacy
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            채점 시작하기
            <ArrowRightIcon className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
}