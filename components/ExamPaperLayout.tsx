// components/ExamPaperLayout.tsx

"use client"; // [필수] 상태 관리를 위해 추가

import React, { forwardRef, useState } from "react";
import { ExamTemplateStyle } from "@/types/examTemplates";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline"; // [신규] 아이콘
import ReportIssueModal from "./ReportIssueModal"; // [신규] 신고 모달

// --- 타입 정의 ---
export interface ExamProblem {
  id: string;
  number: number;
  content?: string;
  imageUrl?: string | null;
  answer?: string | null;
  solutionUrl?: string | null;
  difficulty?: string;
  majorTopic?: string;
  minorTopic?: string;
}

export interface PrintOptions {
  questions: boolean;
  answers: boolean;
  solutions: boolean;
}

interface ExamPaperLayoutProps {
  pages: ExamProblem[][];
  title: string;
  instructor: string;
  template: ExamTemplateStyle;
  printOptions: PrintOptions;
}

// [헬퍼] 정답 원문자 변환
const getCircledNum = (val?: string | null) => {
  if (!val) return "-";
  const num = parseInt(val, 10);
  if (!isNaN(num) && num >= 1 && num <= 15) return String.fromCharCode(9311 + num);
  return val;
};

const ExamPaperLayout = forwardRef<HTMLDivElement, ExamPaperLayoutProps>(
  ({ pages, title, instructor, template, printOptions }, ref) => {
    
    // [신규] 신고 대상 문제 상태 관리
    const [reportTarget, setReportTarget] = useState<ExamProblem | null>(null);

    const allProblems = pages.flat().sort((a, b) => a.number - b.number);

    // --- 1. 헤더 렌더링 ---
    const renderHeader = (pageNum: number, sectionTitle?: string) => {
      const displayTitle = sectionTitle || title;

      if (template.headerType === 'box-table') {
        return (
          <div className="w-full mb-6 border-b-2 border-slate-900 pb-2 flex flex-col justify-between" style={{ height: template.headerHeight, borderColor: template.borderColor }}>
             <div className="flex justify-between items-end mb-2">
                <div>
                   <span className="text-xs text-slate-500 font-bold tracking-widest mb-1 block">2025학년도 1학기 대비</span>
                   <h1 className={`font-extrabold tracking-tight text-slate-900 ${template.titleSize}`}>{displayTitle}</h1>
                </div>
                {template.showScoreBox && (
                  <div className="flex border border-slate-800 text-sm">
                     <div className="bg-slate-100 px-3 py-1 border-r border-slate-800 font-bold flex items-center">성명</div>
                     <div className="w-20 border-r border-slate-800"></div>
                     <div className="bg-slate-100 px-3 py-1 border-r border-slate-800 font-bold flex items-center">점수</div>
                     <div className="w-16"></div>
                  </div>
                )}
             </div>
             <div className="flex justify-between items-center text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded">
                <span>{instructor} 선생님</span>
                <span>RuleMakers</span>
             </div>
          </div>
        );
      }

      return (
        <div className="w-full mb-8 flex justify-between items-end border-b-2 pb-2" style={{ height: template.headerHeight, borderColor: template.borderColor }}>
           <div className="text-center w-full relative">
              <h1 className={`font-serif font-black ${template.titleSize} mb-2`}>{displayTitle}</h1>
              <div className="absolute right-0 bottom-0 text-sm font-bold text-slate-600">
                {sectionTitle ? sectionTitle : `제 ${pageNum + 1} 교시`}
              </div>
           </div>
        </div>
      );
    };

    // --- 2. 문제 번호 렌더링 ---
    const renderProblemNumber = (num: number) => {
      if (template.numberStyle === 'box') {
        return (
          <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs font-bold text-white rounded mr-2 mt-0.5" 
                style={{ backgroundColor: template.borderColor }}>
            {num}
          </span>
        );
      }
      if (template.numberStyle === 'circle') {
        return (
          <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-sm font-extrabold border-2 rounded-full mr-2 leading-none"
                style={{ borderColor: template.borderColor, color: template.borderColor }}>
            {num}
          </span>
        );
      }
      return (
        <span className="flex-shrink-0 text-lg font-extrabold mr-2 leading-none" style={{ color: template.borderColor }}>
          {num}.
        </span>
      );
    };

    return (
      <>
        <div ref={ref} className="w-full bg-gray-100 flex flex-col items-center gap-10 py-10 print:p-0 print:bg-white print:gap-0">
          
          {/* === 1. 문제지 === */}
          {printOptions.questions && pages.map((pageProblems, pageIndex) => (
            <div
              key={`page-${pageIndex}`}
              className="bg-white shadow-xl print:shadow-none relative overflow-hidden"
              style={{
                width: "210mm",
                height: "297mm",
                padding: template.contentPadding,
                fontFamily: template.fontFamily,
                pageBreakAfter: "always"
              }}
            >
              {template.watermarkOpacity > 0 && (
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0" style={{ opacity: template.watermarkOpacity }}>
                   <span className="text-9xl font-black text-slate-900 transform -rotate-45">RuleMakers</span>
                 </div>
              )}

              <div className="relative z-10 h-full flex flex-col">
                {renderHeader(pageIndex)}
                
                <div
                  className="flex-1"
                  style={{
                    columnCount: 2,
                    columnGap: template.columnGap,
                    columnFill: "auto",
                  }}
                >
                  {pageProblems.map((prob) => (
                    <div key={prob.id} className={`break-inside-avoid relative group flex items-start ${template.problemGap}`} style={{ pageBreakInside: "avoid" }}>
                      
                      {/* [신규] 오류 신고 버튼 (화면상 호버 시에만 노출, 출력 시 숨김) */}
                      <button
                        onClick={() => setReportTarget(prob)}
                        className="absolute top-0 right-0 p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity print:hidden z-20 cursor-pointer"
                        title="오류 신고"
                      >
                        <ExclamationCircleIcon className="w-5 h-5" />
                      </button>

                      {renderProblemNumber(prob.number)}
                      
                      <div className="flex-1">
                        {prob.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={prob.imageUrl} alt={`Problem ${prob.number}`} className="w-full object-contain max-h-[350px]" />
                        ) : (
                          <p className={`whitespace-pre-wrap leading-relaxed ${template.problemFontSize} text-slate-800 font-medium`}>{prob.content}</p>
                        )}
                        
                        {prob.difficulty === '킬러' && (
                          <span className="inline-block mt-2 px-1.5 py-0.5 text-[10px] font-bold text-red-600 border border-red-200 bg-red-50 rounded">
                            고난도
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="h-8 flex justify-center items-center relative border-t border-slate-200 mt-4 pt-2">
                   <span className="font-serif text-sm text-slate-400 font-bold">- {pageIndex + 1} -</span>
                   <span className="absolute right-0 text-[10px] text-slate-300">Created by RuleMakers</span>
                </div>
              </div>
            </div>
          ))}

          {/* === 2. 빠른 정답표 === */}
          {printOptions.answers && allProblems.length > 0 && (
             <div className="bg-white shadow-xl print:shadow-none relative overflow-hidden" 
                  style={{ width: "210mm", height: "297mm", padding: template.contentPadding, fontFamily: template.fontFamily, pageBreakAfter: "always" }}>
                
                <div className="border-b-2 border-black pb-4 mb-8">
                   <h2 className="text-3xl font-extrabold text-slate-900">빠른 정답</h2>
                   <p className="text-sm text-slate-500 mt-2">채점용으로 활용하세요.</p>
                </div>

                <div className="grid grid-cols-5 gap-4 content-start">
                   {allProblems.map((prob) => (
                     <div key={prob.id} className="flex justify-between items-center p-2 border-b border-gray-200">
                        <span className="font-bold text-slate-400 text-sm">{String(prob.number).padStart(2, '0')}</span>
                        <span className="font-extrabold text-slate-900 text-lg">{getCircledNum(prob.answer)}</span>
                     </div>
                   ))}
                </div>
             </div>
          )}

          {/* === 3. 상세 해설 === */}
          {printOptions.solutions && allProblems.length > 0 && (
            <div className="bg-white shadow-xl print:shadow-none relative overflow-visible"
                 style={{ width: "210mm", minHeight: "297mm", padding: template.contentPadding, fontFamily: template.fontFamily, height: "auto" }}>
              
              {renderHeader(0, "상세 해설")}

              <div className="w-full grid grid-cols-2 items-start" style={{ gap: template.columnGap, rowGap: '2rem' }}>
                {allProblems.filter(p => p.solutionUrl).map((prob) => (
                  <div key={prob.id} className="break-inside-avoid w-full border rounded-xl overflow-hidden shadow-sm" style={{ pageBreakInside: "avoid", borderColor: '#e2e8f0' }}>
                     <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-700">{prob.number}번 해설</span>
                        <span className="text-[10px] bg-white border px-1.5 py-0.5 rounded text-slate-400">{prob.difficulty}</span>
                     </div>
                     <div className="p-2 bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */ }
                        <img src={prob.solutionUrl!} alt={`해설-${prob.number}`} className="w-full object-contain" />
                     </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* [신규] 오류 신고 모달 */}
        {reportTarget && (
          <ReportIssueModal 
            problemId={reportTarget.id}
            problemContent={reportTarget.content || "이미지형 문항"} // 내용이 없으면 대체 텍스트 전달
            onClose={() => setReportTarget(null)}
          />
        )}
      </>
    );
  }
);

ExamPaperLayout.displayName = "ExamPaperLayout";
export default ExamPaperLayout;