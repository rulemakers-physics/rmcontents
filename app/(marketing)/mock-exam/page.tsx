// app/(marketing)/mock-exam/page.tsx

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { MarketingExam } from "@/types/marketing";

// [수정] Heroicons와 Lucide 아이콘 import 분리
import { ArrowDownTrayIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { ChartBar, Monitor, FileCheck, ChevronRight, ArrowRight, PlayCircle } from "lucide-react";

export default function MockExamLandingPage() {
  const [latestExam, setLatestExam] = useState<MarketingExam | null>(null);

  // 최신 활성 시험지 조회
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const q = query(
          collection(db, "marketing_exams"), 
          orderBy("createdAt", "desc"), 
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = { id: snap.docs[0].id, ...snap.docs[0].data() } as MarketingExam;
          if (data.isActive) setLatestExam(data);
        }
      } catch (e) {
        console.error("시험 정보 로드 실패", e);
      }
    };
    fetchLatest();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      
      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen opacity-50" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] mix-blend-screen" />
          <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`, backgroundSize: '40px 40px'}} />
        </div>
        
        <div className="container relative z-10 px-6 text-center max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-bold tracking-widest uppercase backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              2025 Season RuleMakers Exam
            </span>
          </motion.div>
          
          <motion.h1 initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.6 }} className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[1.1]">
            RULEMAKERS<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-indigo-200 to-slate-400">
              {latestExam ? latestExam.title : "THE FINAL"}
            </span>
          </motion.h1>
          
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            실전과 가장 유사한 경험.<br className="hidden sm:block" />
            PDF를 다운로드하여 풀고, 즉시 채점하여 결과를 확인하세요.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-col sm:flex-row gap-5 justify-center items-center">
             
             {/* 1. PDF 다운로드 버튼 (DB 연동) */}
             {latestExam?.questionPaperUrl ? (
               <a 
                 href={latestExam.questionPaperUrl} 
                 target="_blank"
                 rel="noopener noreferrer" 
                 className="group flex items-center gap-2 px-8 py-4 border border-slate-700 bg-slate-900/50 text-slate-300 font-semibold text-lg rounded-xl hover:bg-slate-800 hover:border-slate-500 hover:text-white transition-all backdrop-blur-sm"
               >
                 <ArrowDownTrayIcon className="w-5 h-5 text-indigo-400" />
                 시험지 PDF 다운로드
               </a>
             ) : (
               <button disabled className="px-8 py-4 border border-slate-800 bg-slate-900/30 text-slate-600 font-semibold text-lg rounded-xl cursor-not-allowed">
                 시험지 준비 중
               </button>
             )}

             {/* 2. 채점하기 버튼 */}
             <Link 
              href={`/mock-exam/enter?examId=${latestExam?.id || ""}`} 
              className={`group relative flex items-center gap-3 px-8 py-4 bg-white text-slate-950 font-bold text-lg rounded-xl hover:bg-indigo-50 transition-all hover:scale-[1.02] shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] ${!latestExam ? 'opacity-50 pointer-events-none' : ''}`}
             >
               <PencilSquareIcon className="w-5 h-5" />
               정답 입력 및 채점
             </Link>
          </motion.div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-32 px-6 container mx-auto max-w-6xl relative z-10" id="details">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">압도적인 실전 감각을 위한 설계</h2>
          <p className="text-slate-400">오직 수험생의 점수 상승만을 위해 준비된 시스템</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
           {features.map((item, i) => (
             <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ delay: i * 0.15, duration: 0.5 }} className="group relative p-8 rounded-3xl bg-slate-900/40 border border-slate-800 hover:border-indigo-500/50 transition-all hover:-translate-y-1 overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="relative z-10">
                 <div className="w-14 h-14 rounded-2xl bg-indigo-900/30 flex items-center justify-center mb-6 group-hover:bg-indigo-600/20 transition-colors">
                   <item.icon className="w-7 h-7 text-indigo-400 group-hover:text-indigo-300" />
                 </div>
                 <h3 className="text-xl font-bold mb-3 text-slate-100">{item.title}</h3>
                 <p className="text-slate-400 leading-relaxed text-sm lg:text-base">{item.desc}</p>
               </div>
             </motion.div>
           ))}
        </div>
      </section>
    </div>
  );
}

const features = [
  { icon: Monitor, title: "Real-Time Scoring", desc: "답안을 입력하는 즉시 채점이 완료됩니다. 불필요한 기다림 없이 결과를 확인하세요." },
  { icon: ChartBar, title: "Deep Analytics", desc: "전체 응시자 대비 나의 위치, 문항별 정답률 등 입체적인 분석 데이터를 제공합니다." },
  { icon: FileCheck, title: "Premium Content", desc: "RuleMakers 연구팀이 직접 제작했습니다. 최신 수능 트렌드를 반영한 고퀄리티 문항입니다." }
];