"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Timer } from "lucide-react";

export default function MockExamEnterPage() {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-6">
      
      {/* 배경 그리드 (통일감 유지) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]" 
             style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 max-w-2xl w-full bg-slate-900/60 border border-slate-800 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-2xl"
      >
        
        {/* 헤더 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold tracking-wider uppercase mb-4 border border-indigo-500/20">
            Exam Entry Zone
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            제1회 RuleMakers 전국 단위 모의고사
          </h1>
          <p className="text-slate-400">
            본 시험은 실제 수능과 동일한 시간 제한 및 규정이 적용됩니다.
          </p>
        </div>

        {/* 체크리스트 박스 */}
        <div className="space-y-4 mb-10">
          <CheckItem 
            icon={Timer} 
            title="시간 제한 엄수" 
            desc="시험이 시작되면 타이머가 작동하며, 종료 시 자동 제출됩니다." 
          />
          <CheckItem 
            icon={ShieldCheck} 
            title="부정행위 방지" 
            desc="다른 브라우저 탭 이동 시 경고가 발생할 수 있습니다." 
          />
          <CheckItem 
            icon={AlertTriangle} 
            title="네트워크 환경" 
            desc="안정적인 인터넷 환경에서 응시해 주세요. 중간 저장 기능이 지원됩니다." 
            color="text-yellow-500"
          />
        </div>

        {/* 동의 및 시작 버튼 */}
        <div className="space-y-6">
          <label className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors">
            <input 
              type="checkbox" 
              className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span className="text-sm text-slate-300 select-none">
              위 유의사항을 모두 확인하였으며, 성실히 시험에 응시하겠습니다.
            </span>
          </label>

          <Link href="/mock-exam/test/1" className={`block w-full transition-all ${!agreed ? 'pointer-events-none' : ''}`}>
            <button 
              disabled={!agreed}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300
                ${agreed 
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transform hover:-translate-y-0.5' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
            >
              시험 시작하기
              <ArrowRight className={`w-5 h-5 ${agreed ? 'animate-pulse' : ''}`} />
            </button>
          </Link>
        </div>

      </motion.div>
    </div>
  );
}

// 재사용 컴포넌트
function CheckItem({ icon: Icon, title, desc, color = "text-indigo-400" }: any) {
  return (
    <div className="flex gap-4 items-start p-4 rounded-xl bg-white/5 border border-white/5">
      <div className={`mt-1 p-2 rounded-lg bg-slate-950 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-200 mb-1">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}