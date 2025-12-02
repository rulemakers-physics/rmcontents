// components/ReportViewModal.tsx

"use client";

import { ExamResultData } from "@/types/grade";
import { XMarkIcon, PrinterIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

interface Props {
  result: ExamResultData;
  onClose: () => void;
}

export default function ReportViewModal({ result, onClose }: Props) {
  
  // 간단한 CSS 차트용 비율 계산
  const getBarHeight = (score: number) => {
    const max = 100; 
    return `${(score / max) * 100}%`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* 헤더 */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{result.examTitle} 분석 리포트</h2>
            <p className="text-sm text-slate-500 mt-1">{result.className} | {result.date?.toDate().toLocaleDateString()}</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 text-sm font-bold transition-colors">
              <PrinterIcon className="w-4 h-4" /> 인쇄
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 바디 */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          
          {/* 1. 종합 요약 */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <StatCard label="응시 인원" value={`${result.totalStudents}명`} />
            <StatCard label="반 평균" value={`${result.average.toFixed(1)}점`} highlight />
            <StatCard label="최고점" value={`${result.highest}점`} />
          </div>

          {/* 2. 성적 분포 차트 (CSS Only) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
            <h3 className="font-bold text-slate-800 mb-6">성적 분포 및 비교</h3>
            <div className="h-64 flex items-end justify-around gap-2 px-4 pb-4 border-b border-slate-100 relative">
              {/* 평균선 */}
              <div 
                className="absolute left-0 right-0 border-t-2 border-dashed border-red-300 z-0 flex items-end justify-end pr-2"
                style={{ bottom: `${result.average}%` }}
              >
                <span className="text-xs text-red-500 font-bold bg-white px-1 -mb-2.5">평균 {result.average}</span>
              </div>

              {result.scores.map((s, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 group z-10 w-full max-w-[40px]">
                  <div className="relative w-full bg-blue-100 rounded-t-lg group-hover:bg-blue-200 transition-all flex flex-col justify-end" style={{ height: '200px' }}>
                    <div 
                      className="w-full bg-blue-500 rounded-t-lg transition-all duration-500 group-hover:bg-blue-600 relative"
                      style={{ height: getBarHeight(s.score) }}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        {s.score}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 truncate w-full text-center">{s.studentName}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. 학생별 상세 코멘트 (학부모 상담용) */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-500" /> 학생별 분석 코멘트
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.scores.map((s, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-900">{s.studentName}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      s.score >= result.average ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'
                    }`}>
                      {s.score}점 ({s.score >= result.average ? `+${(s.score - result.average).toFixed(1)}` : (s.score - result.average).toFixed(1)})
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg leading-relaxed">
                    {s.note ? s.note : (
                      s.score >= 90 ? "매우 우수한 성취도를 보이고 있습니다. 실수가 없도록 유지하는 것이 관건입니다." :
                      s.score >= result.average ? "반 평균 상위권에 위치하며 안정적인 실력을 보여줍니다." :
                      "평균 대비 다소 부족한 부분이 있어 개념 복습과 오답 정리가 필요합니다."
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }: any) {
  return (
    <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${
      highlight ? "bg-blue-50 border-blue-100 text-blue-900" : "bg-white border-slate-200 text-slate-900"
    }`}>
      <span className={`text-xs font-bold uppercase mb-1 ${highlight ? "text-blue-400" : "text-slate-400"}`}>{label}</span>
      <span className="text-2xl font-extrabold">{value}</span>
    </div>
  );
}