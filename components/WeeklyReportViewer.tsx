// components/WeeklyReportViewer.tsx

"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { 
  XMarkIcon, 
  PrinterIcon, 
  ShareIcon, 
  CalendarDaysIcon,
  BookOpenIcon,
  CheckCircleIcon,
  MegaphoneIcon,
  UserIcon
} from "@heroicons/react/24/outline";
import { WeeklyReport } from "@/types/report";
import { toast } from "react-hot-toast";

interface Props {
  report: WeeklyReport;
  onClose: () => void;
}

export default function WeeklyReportViewer({ report, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${report.className}_주간리포트_${report.weekStartDate}`,
  });

  const handleShare = async () => {
    // 실제 작동하는 공유 URL 생성
    const shareUrl = `${window.location.origin}/share/report/${report.id}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("학부모 공유용 링크가 복사되었습니다!");
    } catch (err) {
      toast.error("링크 복사에 실패했습니다.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm print:p-0 print:bg-white">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none overflow-hidden">
        
        {/* 헤더 (컨트롤바) */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50 print:hidden">
          <h2 className="text-lg font-bold text-slate-800">주간 리포트 미리보기</h2>
          <div className="flex gap-2">
            <button 
              onClick={handleShare}
              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              <ShareIcon className="w-4 h-4" /> 링크 복사
            </button>
            <button 
              onClick={() => handlePrint && handlePrint()}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors"
            >
              <PrinterIcon className="w-4 h-4" /> 인쇄 / PDF
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 리포트 본문 (공유 페이지와 동일한 디자인) */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-6 print:p-0 print:bg-white print:overflow-visible custom-scrollbar">
          <div 
            ref={printRef}
            className="bg-white max-w-lg mx-auto shadow-sm rounded-xl overflow-hidden min-h-[297mm] print:shadow-none print:min-h-0 print:w-full print:max-w-none"
          >
            {/* 리포트 헤더 */}
            <div className="bg-slate-900 p-6 text-white text-center print:bg-slate-900 print:text-white print:print-color-adjust-exact">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Weekly Report</p>
              <h1 className="text-2xl font-bold mb-1">{report.className}</h1>
              <p className="text-sm text-slate-400 flex items-center justify-center gap-1">
                <CalendarDaysIcon className="w-4 h-4" />
                {report.weekStartDate} 주차
              </p>
            </div>

            <div className="p-6 space-y-8">
              {/* 1. 통계 */}
              {report.classStats && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <StatBox label="출석률" value={`${report.classStats.attendanceRate}%`} color="text-blue-600" />
                  <StatBox label="과제 수행" value={`${report.classStats.homeworkRate}%`} color="text-green-600" />
                  <StatBox label="주간 테스트" value={report.classStats.testAverage ? `${report.classStats.testAverage}점` : '-'} color="text-orange-600" />
                </div>
              )}

              {/* 2. 수업 내용 */}
              <section>
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">
                  <BookOpenIcon className="w-4 h-4 text-blue-500" /> 금주 수업 내용
                </h3>
                <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 leading-relaxed whitespace-pre-wrap border border-slate-100 print:bg-slate-50">
                  {report.summary}
                </div>
              </section>

              {/* 3. 다음 주 계획 */}
              {report.nextWeekPlan && (
                <section>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">
                    <CheckCircleIcon className="w-4 h-4 text-emerald-500" /> 차주 수업 계획
                  </h3>
                  <div className="bg-emerald-50/50 p-4 rounded-xl text-sm text-slate-700 leading-relaxed whitespace-pre-wrap border border-emerald-100 print:bg-emerald-50">
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
                  <div className="bg-orange-50/50 p-4 rounded-xl text-sm text-slate-700 leading-relaxed whitespace-pre-wrap border border-orange-100 print:bg-orange-50">
                    {report.notice}
                  </div>
                </section>
              )}

              {/* 5. 학생 피드백 */}
              <section className="break-inside-avoid">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">
                    <UserIcon className="w-4 h-4 text-purple-500" /> 학생별 피드백
                </h3>
                <div className="space-y-4">
                  {report.studentFeedbacks.map((student, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-100 break-inside-avoid print:bg-slate-50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-slate-800">{student.studentName}</span>
                          <div className="flex gap-1">
                              {student.testScore && <span className="text-[10px] bg-white border px-1.5 py-0.5 rounded text-slate-500">{student.testScore}</span>}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{student.comment || "특이사항 없음"}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 푸터 */}
              <div className="mt-16 pt-8 border-t border-slate-200 text-center text-xs text-slate-400">
                <p>본 리포트는 RuleMakers 학습 관리 시스템을 통해 발행되었습니다.</p>
                <p className="mt-1">교육 문의: 02-0000-0000</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 print:bg-slate-50">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`text-lg font-extrabold ${color} print:text-black`}>{value}</div>
    </div>
  );
}