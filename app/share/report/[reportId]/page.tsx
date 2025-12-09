// app/share/report/[reportId]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { WeeklyReport } from "@/types/report";
import { 
  CalendarDaysIcon, 
  ChartBarIcon, 
  CheckCircleIcon, 
  MegaphoneIcon,
  BookOpenIcon 
} from "@heroicons/react/24/outline";

export default function SharedReportPage() {
  const params = useParams();
  const reportId = params.reportId as string;
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const docRef = doc(db, "weekly_reports", reportId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setReport({ id: docSnap.id, ...docSnap.data() } as WeeklyReport);
        }
      } catch (error) {
        console.error("리포트 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    if (reportId) fetchReport();
  }, [reportId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500">리포트를 불러오는 중...</div>;
  if (!report) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500">리포트를 찾을 수 없습니다.</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 font-sans">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* 헤더: 학원 브랜딩 */}
        <div className="bg-slate-900 p-6 text-white text-center">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Weekly Report</p>
          <h1 className="text-2xl font-bold mb-1">{report.className}</h1>
          <p className="text-sm text-slate-400 flex items-center justify-center gap-1">
            <CalendarDaysIcon className="w-4 h-4" />
            {report.weekStartDate} 주차 학습 리포트
          </p>
        </div>

        <div className="p-6 space-y-8">
          
          {/* 1. 반 전체 통계 (있을 경우만 표시) */}
          {report.classStats && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <StatBox label="출석률" value={`${report.classStats.attendanceRate}%`} color="text-blue-600" />
              <StatBox label="과제 수행" value={`${report.classStats.homeworkRate}%`} color="text-green-600" />
              <StatBox label="주간 테스트" value={report.classStats.testAverage ? `${report.classStats.testAverage}점` : '-'} color="text-orange-600" />
            </div>
          )}

          {/* 2. 수업 내용 & 총평 */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">
              <BookOpenIcon className="w-4 h-4 text-blue-500" /> 금주 수업 내용
            </h3>
            <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 leading-relaxed whitespace-pre-wrap border border-slate-100">
              {report.summary}
            </div>
          </section>

          {/* 3. 다음 주 계획 */}
          {report.nextWeekPlan && (
            <section>
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500" /> 차주 수업 계획
              </h3>
              <div className="bg-emerald-50/50 p-4 rounded-xl text-sm text-slate-700 leading-relaxed whitespace-pre-wrap border border-emerald-100">
                {report.nextWeekPlan}
              </div>
            </section>
          )}

          {/* 4. 공지사항 */}
          {report.notice && (
            <section>
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">
                <MegaphoneIcon className="w-4 h-4 text-orange-500" /> 알림장
              </h3>
              <div className="bg-orange-50/50 p-4 rounded-xl text-sm text-slate-700 leading-relaxed whitespace-pre-wrap border border-orange-100">
                {report.notice}
              </div>
            </section>
          )}

          <div className="text-center pt-8 border-t border-slate-100">
            <p className="text-xs text-slate-400">RuleMakers 학원 관리 시스템</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`text-lg font-extrabold ${color}`}>{value}</div>
    </div>
  );
}