// app/(student)/student/report/page.tsx

"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore";
import Link from "next/link";
import { 
  ChartBarIcon, CalendarDaysIcon, ChevronRightIcon, BeakerIcon, PrinterIcon 
} from "@heroicons/react/24/outline";
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip 
} from "recharts";
import { useReactToPrint } from "react-to-print";
import ExamPaperLayout from "@/components/ExamPaperLayout";
import { TEMPLATES } from "@/types/examTemplates";
import { toast } from "react-hot-toast";

interface ExamHistory {
  id: string;
  title: string;
  score: number;
  createdAt: Timestamp;
  totalQuestions: number;
  difficulty: string;
  problems: any[]; // 오답 분석용
}

export default function ReportDashboard() {
  const { user } = useAuth();
  const [history, setHistory] = useState<ExamHistory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // PDF 출력용
  const printRef = useRef<HTMLDivElement>(null);
  const [wrongAnswersForPdf, setWrongAnswersForPdf] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      try {
        const q = query(
          collection(db, "student_exams"),
          where("userId", "==", user.uid),
          where("status", "==", "completed"),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        setHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExamHistory)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  // 1. [분석] 레이더 차트 데이터 가공 (대단원별 정답률)
  const radarData = useMemo(() => {
    const stats: Record<string, { total: number, correct: number }> = {};
    
    history.forEach(exam => {
      exam.problems.forEach(p => {
        const topic = p.majorTopic || "기타";
        if (!stats[topic]) stats[topic] = { total: 0, correct: 0 };
        stats[topic].total += 1;
        if (p.isCorrect) stats[topic].correct += 1;
      });
    });

    return Object.entries(stats).map(([subject, data]) => ({
      subject,
      score: Math.round((data.correct / data.total) * 100), // 100점 만점 환산
      fullMark: 100
    })).slice(0, 6); // 차트 가독성을 위해 상위 6개만 (실제론 다 보여줘도 됨)
  }, [history]);

  // 2. [PDF] 오답노트 출력 핸들러
  const handlePrintWrongNotes = useReactToPrint({
    contentRef: printRef,
    documentTitle: "나만의_오답노트",
    onBeforeGetContent: async () => {
      // 모든 시험에서 틀린 문제만 수집
      const allWrongProblems = history.flatMap(exam => 
        exam.problems.filter(p => !p.isCorrect).map(p => ({
          ...p,
          id: p.problemId, // ExamPaperLayout 호환
          answer: p.answer || null,
          imageUrl: p.imgUrl || null,
          solutionUrl: null // 해설은 일단 제외 (옵션 가능)
        }))
      );

      if (allWrongProblems.length === 0) {
        toast.error("틀린 문제가 없습니다. 완벽합니다!");
        return Promise.reject();
      }

      // 4문제씩 페이지네이션 (ExamPaperLayout 호환)
      const pages = [];
      for (let i = 0; i < allWrongProblems.length; i += 4) {
        pages.push(allWrongProblems.slice(i, i + 4));
      }
      setWrongAnswersForPdf(pages);
      await new Promise(resolve => setTimeout(resolve, 500)); // 렌더링 대기
    }
  });

  if (loading) return <div className="p-10 text-center text-slate-400">데이터 분석 중...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen font-sans">
      
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">나의 학습 리포트</h1>
          <p className="text-slate-500">약점을 분석하고 오답노트를 만들어보세요.</p>
        </div>
        <button 
          onClick={() => handlePrintWrongNotes && handlePrintWrongNotes()}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
        >
          <PrinterIcon className="w-5 h-5" /> 오답노트 PDF 출력
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        
        {/* A. 취약 유형 분석 (Radar Chart) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-emerald-500" /> 단원별 성취도 분석
          </h3>
          <div className="flex-1 min-h-[300px]">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="정답률" dataKey="score" stroke="#10b981" strokeWidth={3} fill="#10b981" fillOpacity={0.4} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                아직 분석할 데이터가 충분하지 않습니다.
              </div>
            )}
          </div>
        </div>

        {/* B. 요약 통계 */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                <CalendarDaysIcon className="w-5 h-5" />
              </div>
              <span className="text-slate-500 font-medium">총 응시</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{history.length}<span className="text-base font-normal text-slate-400 ml-1">회</span></p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                <BeakerIcon className="w-5 h-5" />
              </div>
              <span className="text-slate-500 font-medium">평균 점수</span>
            </div>
            <p className="text-3xl font-black text-slate-900">
              {history.length > 0 ? Math.round(history.reduce((a, b) => a + b.score, 0) / history.length) : 0}
              <span className="text-base font-normal text-slate-400 ml-1">점</span>
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-lg text-white">
            <p className="text-sm text-slate-400 font-bold uppercase mb-2">Recent Best</p>
            <p className="text-4xl font-black text-emerald-400">{Math.max(...history.map(h => h.score), 0)}점</p>
            <p className="text-xs text-slate-500 mt-2">최고 점수를 경신해보세요!</p>
          </div>
        </div>
      </div>

      {/* 응시 이력 리스트 */}
      <h3 className="text-lg font-bold text-slate-900 mb-4">최근 응시 이력</h3>
      <div className="space-y-4">
        {history.map((exam) => (
          <Link 
            href={`/student/report/${exam.id}`} 
            key={exam.id}
            className="block group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                    {exam.difficulty} 난이도
                  </span>
                  <span className="text-xs text-slate-400">
                    {exam.createdAt.toDate().toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {exam.title}
                </h4>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-slate-400">점수</p>
                  <p className={`text-xl font-black ${exam.score >= 80 ? 'text-emerald-600' : 'text-slate-700'}`}>
                    {exam.score}점
                  </p>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* [Hidden] 오답노트 출력용 컴포넌트 */}
      <div style={{ display: "none" }}>
        <ExamPaperLayout
          ref={printRef}
          pages={wrongAnswersForPdf}
          title="나만의 오답노트"
          instructor={user?.displayName || "학생"}
          template={TEMPLATES[0]}
          printOptions={{ questions: true, answers: true, solutions: false }}
          isTeacherVersion={false}
        />
      </div>

    </div>
  );
}