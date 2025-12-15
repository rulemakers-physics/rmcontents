// components/ReportViewModal.tsx

"use client";

import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { ExamResultData } from "@/types/grade";
import { 
  XMarkIcon, 
  PrinterIcon, 
  ChatBubbleLeftRightIcon,
  SparklesIcon, // [신규] 아이콘 추가
  DocumentPlusIcon
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import ReviewExamBuilderModal from "./ReviewExamBuilderModal"; // [신규] 모달 임포트

interface Props {
  result: ExamResultData;
  onClose: () => void;
}

// [신규] reviewTarget 타입에 sourceExamId 추가
interface ReviewTargetState {
  studentName: string;
  wrongProblems: { id: string, number: number }[];
  sourceExamId?: string; // 추가됨
}

export default function ReportViewModal({ result, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  // [신규] 클리닉 생성 모달 상태 관리
  const [reviewTarget, setReviewTarget] = useState<ReviewTargetState | null>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${result.className}_${result.examTitle}_성적리포트`,
  });
  
  const getBarHeight = (score: number) => {
    const max = 100; 
    return `${(score / max) * 100}%`;
  };

  // [신규] 클리닉 버튼 핸들러
  const handleOpenClinic = (studentName: string, wrongProblems?: { id: string, number: number }[]) => {
    if (!wrongProblems || wrongProblems.length === 0) {
      toast("오답 데이터가 없습니다.", { icon: "👏" });
      return;
    }
    // result.examId (원본 시험지 ID)를 함께 전달
    setReviewTarget({ 
      studentName, 
      wrongProblems,
      sourceExamId: result.examId 
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm print:p-0 print:bg-white">
        <div 
          className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none"
        >
          
          {/* 헤더 */}
          <div className="flex justify-between items-center p-6 border-b border-slate-100 print:border-slate-900">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{result.examTitle} 분석 리포트</h2>
              <p className="text-sm text-slate-500 mt-1">{result.className} | {result.date?.toDate().toLocaleDateString()}</p>
            </div>
            
            <div className="flex gap-2 print:hidden">
              <button 
                onClick={() => handlePrint && handlePrint()}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 text-sm font-bold transition-colors"
              >
                <PrinterIcon className="w-4 h-4" /> 인쇄 / PDF 저장
              </button>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* 바디 (인쇄 영역) */}
          <div className="flex-1 overflow-y-auto p-8 bg-slate-50 print:overflow-visible print:bg-white custom-scrollbar">
            <div ref={printRef} className="space-y-8">
              
              {/* 1. 종합 요약 */}
              <div className="grid grid-cols-3 gap-4">
                <StatCard label="응시 인원" value={`${result.totalStudents}명`} />
                <StatCard label="반 평균" value={`${result.average.toFixed(1)}점`} highlight />
                <StatCard label="최고점" value={`${result.highest}점`} />
              </div>

              {/* 2. 성적 분포 차트 */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm print:border-slate-300 print:shadow-none print:break-inside-avoid">
                <h3 className="font-bold text-slate-800 mb-6">성적 분포 및 비교</h3>
                <div className="h-64 flex items-end justify-around gap-2 px-4 pb-4 border-b border-slate-100 relative">
                  
                  {/* 평균선 */}
                  <div 
                    className="absolute left-0 right-0 border-t-2 border-dashed border-red-300 z-20 flex items-end justify-end pr-2 pointer-events-none"
                    style={{ bottom: `${result.average}%` }}
                  >
                    <span className="text-xs text-red-500 font-bold bg-white px-1 -mb-2.5 shadow-sm border border-red-100 rounded">
                      평균 {result.average.toFixed(1)}
                    </span>
                  </div>

                  {result.scores.map((s, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2 group z-10 w-full max-w-[40px]">
                      <div className="relative w-full bg-blue-100 rounded-t-lg group-hover:bg-blue-200 transition-all flex flex-col justify-end" style={{ height: '200px' }}>
                        <div 
                          className="w-full bg-blue-500 rounded-t-lg transition-all duration-500 group-hover:bg-blue-600 relative print:bg-blue-600 print:print-color-adjust-exact"
                          style={{ height: getBarHeight(s.score) }}
                        >
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {s.score}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 truncate w-full text-center">{s.studentName}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. 학생별 상세 분석 (클리닉 버튼 추가됨) */}
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-500" /> 학생별 분석 및 관리
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.scores.map((s, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:border-slate-300 print:shadow-none print:break-inside-avoid flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-slate-900">{s.studentName}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            s.score >= result.average ? 'bg-green-100 text-green-700 print:border print:border-black' : 'bg-red-50 text-red-600 print:border print:border-black'
                          }`}>
                            {s.score}점 ({s.score >= result.average ? `+${(s.score - result.average).toFixed(1)}` : (s.score - result.average).toFixed(1)})
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg leading-relaxed print:bg-white print:text-black mb-3">
                          {s.note ? s.note : (
                            s.score >= 90 ? "매우 우수한 성취도입니다. 실수가 없도록 유지하세요." :
                            s.score >= result.average ? "안정적인 실력이나, 오답 분석이 필요합니다." :
                            "개념 복습과 오답 정리가 시급합니다."
                          )}
                        </p>
                      </div>

                      {/* [신규] 클리닉 생성 버튼 (오답 데이터가 있을 때만 활성화) */}
                      <div className="pt-3 border-t border-slate-100 flex justify-end print:hidden">
                        <button 
                          onClick={() => handleOpenClinic(s.studentName, s.wrongProblems)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            s.wrongProblems && s.wrongProblems.length > 0
                              ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 cursor-pointer"
                              : "bg-slate-50 text-slate-400 cursor-not-allowed"
                          }`}
                        >
                          {s.wrongProblems && s.wrongProblems.length > 0 ? (
                            <>
                              <SparklesIcon className="w-4 h-4" /> 오답 클리닉 생성 ({s.wrongProblems.length}문제)
                            </>
                          ) : (
                            <>
                              <DocumentPlusIcon className="w-4 h-4" /> 클리닉 대상 없음
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* [신규] 클리닉 생성 모달 연결 */}
      {reviewTarget && (
        <ReviewExamBuilderModal 
          studentName={reviewTarget.studentName}
          sourceExamTitle={result.examTitle}
          sourceExamId={reviewTarget.sourceExamId}
          wrongProblems={reviewTarget.wrongProblems}
          onClose={() => setReviewTarget(null)}
        />
      )}
    </>
  );
}

function StatCard({ label, value, highlight }: any) {
  return (
    <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center print:border-slate-400 ${
      highlight ? "bg-blue-50 border-blue-100 text-blue-900 print:bg-white print:text-black" : "bg-white border-slate-200 text-slate-900"
    }`}>
      <span className={`text-xs font-bold uppercase mb-1 ${highlight ? "text-blue-400 print:text-black" : "text-slate-400 print:text-black"}`}>{label}</span>
      <span className="text-2xl font-extrabold">{value}</span>
    </div>
  );
}