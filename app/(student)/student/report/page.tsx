// app/(student)/student/report/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore";
import Link from "next/link";
import { 
  ChartBarIcon, CalendarDaysIcon, ChevronRightIcon, BeakerIcon 
} from "@heroicons/react/24/outline";

interface ExamHistory {
  id: string;
  title: string;
  score: number;
  createdAt: Timestamp;
  totalQuestions: number;
  difficulty: string;
}

export default function ReportDashboard() {
  const { user } = useAuth();
  const [history, setHistory] = useState<ExamHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // 평균 점수 계산
  const avgScore = history.length > 0 
    ? Math.round(history.reduce((acc, cur) => acc + cur.score, 0) / history.length) 
    : 0;

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

  if (loading) return <div className="p-10 text-center text-slate-400">데이터 분석 중...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen font-sans">
      
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">나의 학습 리포트</h1>
        <p className="text-slate-500">지금까지의 성취도를 확인하고 약점을 보완하세요.</p>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <ChartBarIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">총 응시 횟수</p>
            <p className="text-2xl font-black text-slate-900">{history.length}회</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <BeakerIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">평균 점수</p>
            <p className="text-2xl font-black text-slate-900">{avgScore}점</p>
          </div>
        </div>
        {/* 최근 시험 점수 */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-lg text-white flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">최근 시험 점수</p>
            <p className="text-3xl font-black mt-1 text-emerald-400">{history[0]?.score || 0}점</p>
          </div>
          <Link href="/student/study" className="px-4 py-2 bg-white/10 rounded-lg text-xs font-bold hover:bg-white/20 transition-colors">
            시험 더보기
          </Link>
        </div>
      </div>

      {/* 히스토리 리스트 */}
      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <CalendarDaysIcon className="w-5 h-5 text-slate-500" /> 응시 이력
      </h3>
      
      {history.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <p className="text-slate-400">아직 응시한 시험이 없습니다.</p>
          <Link href="/student/study" className="text-emerald-600 font-bold underline mt-2 inline-block">
            첫 시험 응시하러 가기
          </Link>
        </div>
      ) : (
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
      )}
    </div>
  );
}