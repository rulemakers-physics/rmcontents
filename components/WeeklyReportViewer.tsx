// components/WeeklyReportViewer.tsx

"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { XMarkIcon, PrinterIcon, ShareIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";
import { WeeklyReport } from "@/types/report";
import { toast } from "react-hot-toast";

interface Props {
  report: WeeklyReport;
  onClose: () => void;
}

export default function WeeklyReportViewer({ report, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  // 1. PDF 출력 핸들러
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${report.className}_주간리포트_${report.weekStartDate}`,
  });

  // 2. 공유 링크 복사 핸들러
  const handleShare = async () => {
    // 실제 배포 시 도메인에 맞게 수정 필요 (현재는 로컬호스트 가정 예시)
    // 예: https://rulemakers.kr/share/report/{report.id}
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
        
        {/* 헤더 (화면에서만 보임) */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50 print:hidden">
          <h2 className="text-lg font-bold text-slate-800">주간 리포트 미리보기</h2>
          <div className="flex gap-2">
            <button 
              onClick={handleShare}
              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              <ShareIcon className="w-4 h-4" /> 공유 링크
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

        {/* 리포트 본문 (출력 영역) */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-6 print:p-0 print:bg-white print:overflow-visible">
          <div 
            ref={printRef}
            className="bg-white max-w-2xl mx-auto shadow-sm p-8 min-h-[297mm] print:shadow-none print:min-h-0 print:w-full print:max-w-none"
            style={{ pageBreakAfter: 'always' }}
          >
            {/* 리포트 타이틀 */}
            <div className="border-b-2 border-slate-900 pb-4 mb-8">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-slate-500 font-bold mb-1">RuleMakers Academy</p>
                  <h1 className="text-3xl font-extrabold text-slate-900">WEEKLY REPORT</h1>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-800">{report.className}</p>
                  <p className="text-sm text-slate-500 flex items-center justify-end gap-1">
                    <CalendarDaysIcon className="w-4 h-4" /> {report.weekStartDate} 주차
                  </p>
                </div>
              </div>
            </div>

            {/* 1. 금주 총평 */}
            <section className="mb-10">
              <h3 className="text-sm font-bold text-white bg-slate-900 inline-block px-3 py-1 rounded-sm mb-4">
                CLASS SUMMARY
              </h3>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap print:border-slate-300 print:bg-white">
                {report.summary}
              </div>
            </section>

            {/* 2. 학생별 피드백 */}
            <section>
              <h3 className="text-sm font-bold text-white bg-slate-900 inline-block px-3 py-1 rounded-sm mb-4">
                INDIVIDUAL FEEDBACK
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {report.studentFeedbacks.map((student, idx) => (
                  <div key={idx} className="flex border-b border-slate-100 pb-4 mb-2 break-inside-avoid print:border-slate-300">
                    <div className="w-24 shrink-0 pt-1">
                      <span className="font-bold text-slate-900 text-base">{student.studentName}</span>
                    </div>
                    <div className="flex-1 pl-4 border-l border-slate-200 print:border-slate-300">
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {student.comment || "특이사항 없음"}
                      </p>
                    </div>
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
  );
}