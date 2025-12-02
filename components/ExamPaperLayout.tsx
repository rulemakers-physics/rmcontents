// components/ExamPaperLayout.tsx

"use client";

import React, { forwardRef, useState } from "react";
import { ExamTemplateStyle } from "@/types/examTemplates";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import ReportIssueModal from "./ReportIssueModal";

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

const getCircledNum = (val?: string | null) => {
  if (!val) return "-";
  const num = parseInt(val, 10);
  if (!isNaN(num) && num >= 1 && num <= 15) return String.fromCharCode(9311 + num);
  return val;
};

const ExamPaperLayout = forwardRef<HTMLDivElement, ExamPaperLayoutProps>(
  ({ pages, title, instructor, template, printOptions }, ref) => {
    
    const [reportTarget, setReportTarget] = useState<ExamProblem | null>(null);
    const allProblems = pages.flat().sort((a, b) => a.number - b.number);

    // 배열을 n개씩 자르는 헬퍼 함수
    const chunkArray = <T,>(array: T[], size: number): T[][] => {
      const chunked = [];
      for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
      }
      return chunked;
    };

    const solutionProblems = allProblems.filter(p => p.solutionUrl);
    const solutionPages = chunkArray(solutionProblems, 4);

    // 헤더 렌더링
    const renderHeader = (pageNum: number, sectionTitle?: string) => {
      const displayTitle = sectionTitle || title;

      // 2페이지부터는 심플 헤더 (단, 섹션 타이틀이 있는 첫 페이지 제외)
      if (pageNum > 0 && !sectionTitle) {
         return (
           <div className="w-full mb-2 border-b border-slate-400 pb-1 flex justify-between items-end shrink-0 h-10 print:h-10">
              <h1 className="text-sm font-bold text-slate-600 truncate max-w-[70%]">{displayTitle}</h1>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">RuleMakers</span>
                <span className="text-xs font-bold text-slate-500 border-l border-slate-300 pl-2">제 {pageNum + 1} 면</span>
              </div>
           </div>
         );
      }

      // 메인 헤더 (1페이지 또는 섹션 첫 페이지)
      if (template.headerType === 'box-table') {
        return (
          <div className="w-full mb-4 border-b-2 border-slate-900 pb-2 flex flex-col justify-between shrink-0" style={{ height: template.headerHeight, borderColor: template.borderColor }}>
             <div className="flex justify-between items-end mb-2">
                <div>
                   <span className="text-xs text-slate-500 font-bold tracking-widest mb-1 block">2025학년도 1학기 대비</span>
                   <h1 className={`font-extrabold tracking-tight text-slate-900 ${template.titleSize}`}>{displayTitle}</h1>
                </div>
                
                {/* [수정] 해설지(sectionTitle 존재)에는 점수 박스 표시 안 함 */}
                {template.showScoreBox && !sectionTitle && (
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

      // 기본 심플형
      return (
        <div className="w-full mb-6 flex justify-between items-end border-b-2 pb-2 shrink-0" style={{ height: template.headerHeight, borderColor: template.borderColor }}>
           <div className="text-center w-full relative">
              <h1 className={`font-serif font-black ${template.titleSize} mb-2`}>{displayTitle}</h1>
              <div className="absolute right-0 bottom-0 text-sm font-bold text-slate-600">
                {sectionTitle ? sectionTitle : `제 ${pageNum + 1} 교시`}
              </div>
           </div>
        </div>
      );
    };

    // 문제 번호 렌더링
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
              className="bg-white shadow-xl print:shadow-none relative overflow-hidden flex flex-col"
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

              <div className="relative z-10 shrink-0">
                {renderHeader(pageIndex)}
              </div>
              
              <div
                className="relative z-10 flex-1 grid grid-cols-2 grid-rows-2 grid-flow-col"
                style={{
                  columnGap: template.columnGap,
                  rowGap: '2rem',
                }}
              >
                {Array.from({ length: 4 }).map((_, slotIndex) => {
                  const prob = pageProblems[slotIndex];
                  if (!prob) return <div key={`empty-${slotIndex}`} />; 

                  return (
                    <div 
                      key={prob.id} 
                      className={`relative group flex items-start h-full overflow-hidden ${template.problemGap}`}
                    >
                      <button
                        onClick={() => setReportTarget(prob)}
                        className="absolute top-0 right-0 p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity print:hidden z-20 cursor-pointer"
                        title="오류 신고"
                      >
                        <ExclamationCircleIcon className="w-5 h-5" />
                      </button>

                      {renderProblemNumber(prob.number)}
                      
                      <div className="flex-1 h-full">
                        {prob.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img 
                            src={prob.imageUrl} 
                            alt={`Problem ${prob.number}`} 
                            className="w-full h-full object-contain object-top" 
                          />
                        ) : (
                          <p className={`whitespace-pre-wrap leading-relaxed ${template.problemFontSize} text-slate-800 font-medium`}>
                            {prob.content}
                          </p>
                        )}
                        
                        {prob.difficulty === '킬러' && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-bold text-red-600 border border-red-200 bg-red-50 rounded">
                            고난도
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="h-8 flex justify-center items-center relative border-t border-slate-200 mt-2 shrink-0">
                 <span className="font-serif text-sm text-slate-400 font-bold">- {pageIndex + 1} -</span>
                 <span className="absolute right-0 text-[10px] text-slate-300">Created by RuleMakers</span>
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
          {printOptions.solutions && solutionPages.map((pageSolutions, pageIndex) => (
            <div
              key={`sol-page-${pageIndex}`}
              className="bg-white shadow-xl print:shadow-none relative overflow-hidden flex flex-col"
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

              <div className="relative z-10 shrink-0">
                {renderHeader(pageIndex, "상세 해설")}
              </div>

              <div 
                className="relative z-10 flex-1 grid grid-cols-2 grid-rows-2 grid-flow-col"
                style={{ columnGap: template.columnGap, rowGap: '2rem' }}
              >
                {Array.from({ length: 4 }).map((_, slotIndex) => {
                  const prob = pageSolutions[slotIndex];
                  if (!prob) return <div key={`sol-empty-${slotIndex}`} />;

                  return (
                    <div 
                      key={prob.id} 
                      className="break-inside-avoid w-full h-full border rounded-xl overflow-hidden shadow-sm flex flex-col" 
                      style={{ borderColor: '#e2e8f0' }}
                    >
                       <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex items-center justify-between shrink-0">
                          <span className="font-bold text-sm text-slate-700">{prob.number}번 해설</span>
                          <span className="text-[10px] bg-white border px-1.5 py-0.5 rounded text-slate-400">{prob.difficulty}</span>
                       </div>
                       
                       <div className="p-2 bg-white flex-1 relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */ }
                          <img 
                            src={prob.solutionUrl!} 
                            alt={`해설-${prob.number}`} 
                            className="w-full h-full object-contain object-top" 
                          />
                       </div>
                    </div>
                  );
                })}
              </div>

              <div className="h-8 flex justify-center items-center relative border-t border-slate-200 mt-2 shrink-0">
                 <span className="font-serif text-sm text-slate-400 font-bold">- {pageIndex + 1} -</span>
                 <span className="absolute right-0 text-[10px] text-slate-300">Created by RuleMakers</span>
              </div>
            </div>
          ))}
        </div>

        {reportTarget && (
          <ReportIssueModal 
            problemId={reportTarget.id}
            problemContent={reportTarget.content || "이미지형 문항"} 
            onClose={() => setReportTarget(null)}
          />
        )}
      </>
    );
  }
);

ExamPaperLayout.displayName = "ExamPaperLayout";
export default ExamPaperLayout;