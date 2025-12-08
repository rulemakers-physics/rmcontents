"use client";

import React, { forwardRef, useMemo } from "react";
import { ExamTemplateStyle, LayoutMode } from "@/types/examTemplates";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import ReportIssueModal from "./ReportIssueModal";

// --- [상수 설정] A4 및 레이아웃 (96DPI 기준) ---
const A4_HEIGHT_PX = 1123; // A4 높이 (297mm)
const PADDING_X_MM = 20; // 좌우 여백

// [수정 1] 이미지 스케일 팩터 재조정 (0.22 -> 0.245)
// 설명: 0.22는 너무 작아서 실제 렌더링 높이가 계산보다 커져 푸터를 밀어내는 문제가 발생.
// 0.28은 너무 커서 여백이 많음. 그 중간값인 0.245로 최적화.
const IMG_SCALE_FACTOR = 0.245; 

// 원문자 변환 헬퍼 (1~15 지원)
const toCircled = (str: string | null) => {
  if (!str) return "";
  const num = parseInt(str, 10);
  if (isNaN(num) || num < 1 || num > 15) return str;
  return String.fromCharCode(9311 + num);
};

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
  height?: number; 
  solutionHeight?: number;
}


export interface PrintOptions {
  questions: boolean;
  answers: boolean;
  solutions: boolean;
  questionPadding: number;
  solutionPadding: number;
  layoutMode: LayoutMode;
}

interface ExamPaperLayoutProps {
  problems: ExamProblem[]; 
  title: string;
  instructor: string;
  template: ExamTemplateStyle;
  printOptions: PrintOptions;
  isTeacherVersion?: boolean;
}

// --- [알고리즘] 문항 분배 함수 ---
function distributeItems(
  items: ExamProblem[],
  type: 'question' | 'solution',
  options: {
    pageHeight: number;
    headerHeightFirst: number;
    headerHeightNormal: number;
    footerHeight: number;
    paddingTop: number;
    paddingBottom: number;
    itemGap: number;
    layoutMode: LayoutMode;
  }
) {
  if (!items || items.length === 0) return [];

  const pages: ExamProblem[][][] = []; 
  
  let currentPageIdx = 0;
  let currentColIdx = 0;
  let currentY = 0;

  // [수정 2] 안전 여백 (Safety Buffer) 추가
  // 설명: 브라우저 렌더링 오차를 대비해 하단에 20px 정도의 여유를 강제로 둡니다.
  // 이 공간을 침범하면 무조건 다음 단으로 넘깁니다. (푸터 보호)
  const SAFETY_MARGIN_BOTTOM = 20;

  // 페이지 초기화
  const createNewPage = () => {
    pages.push([[], []]); // 좌/우 컬럼
    currentPageIdx = pages.length - 1;
    currentColIdx = 0;
    
    const hHeight = currentPageIdx === 0 ? options.headerHeightFirst : options.headerHeightNormal;
    currentY = options.paddingTop + hHeight;
  };

  createNewPage();

  const isSplitMode = type === 'question' && options.layoutMode !== 'dense';
  const targetPerCol = options.layoutMode === 'split-2' ? 1 : 2;

  let itemIdx = 0;
  while (itemIdx < items.length) {
    const item = items[itemIdx];
    
    // 높이 추산
    const rawHeight = type === 'question' 
      ? (item.height ? item.height * IMG_SCALE_FACTOR : 10)
      : (item.solutionHeight ? item.solutionHeight * IMG_SCALE_FACTOR : 10);
    
    const itemTotalHeight = rawHeight + options.itemGap;
    
    // [핵심] 가용 높이 계산 시 안전 여백을 미리 뺍니다.
    const maxContentY = options.pageHeight - options.footerHeight - options.paddingBottom - SAFETY_MARGIN_BOTTOM;
    
    if (isSplitMode) {
      // --- 분할 배치 로직 ---
      const currentItemsInCol = pages[currentPageIdx][currentColIdx];
      let shouldPushToNextCol = false;

      if (currentItemsInCol.length >= targetPerCol) {
        shouldPushToNextCol = true;
      } else if (options.layoutMode === 'split-4' && currentItemsInCol.length === 1) {
        // 이미 1개가 있을 때 높이 체크 (엄격하게)
        if (currentY + itemTotalHeight > maxContentY) {
          shouldPushToNextCol = true;
        }
      }

      if (shouldPushToNextCol) {
        currentColIdx++;
        currentY = options.paddingTop + (currentPageIdx === 0 ? options.headerHeightFirst : options.headerHeightNormal);
        
        if (currentColIdx > 1) {
          createNewPage();
        }
      }

      pages[currentPageIdx][currentColIdx].push(item);
      currentY += itemTotalHeight;
      itemIdx++;

    } else {
      // --- Dense (기본) 배치 로직 ---
      // [수정 3] Tolerance 제거 및 엄격한 체크
      // 현재 위치 + 아이템 높이가 가용 범위를 단 1px이라도 넘으면 다음 단으로 보냅니다.
      const isOverflow = (currentY + rawHeight) > maxContentY;

      if (isOverflow) {
        // 다음 단으로 이동
        currentColIdx++;
        
        const hHeight = currentPageIdx === 0 ? options.headerHeightFirst : options.headerHeightNormal;
        currentY = options.paddingTop + hHeight;

        if (currentColIdx > 1) {
          createNewPage();
        }
      }

      // 배치 확정
      if (pages[currentPageIdx] && pages[currentPageIdx][currentColIdx]) {
          pages[currentPageIdx][currentColIdx].push(item);
      }
      
      currentY += itemTotalHeight;
      itemIdx++;
    }
  }

  return pages;
}

const ExamPaperLayout = forwardRef<HTMLDivElement, ExamPaperLayoutProps>(
  ({ problems = [], title, instructor, template, printOptions, isTeacherVersion }, ref) => {
    
    const [reportTarget, setReportTarget] = React.useState<ExamProblem | null>(null);

    const headerH = parseInt(template.headerHeight) || 100; 
    const paddingY = 5; 

    // 문제지 페이지네이션
    const questionPages = useMemo(() => {
      if (!printOptions.questions) return [];
      
      return distributeItems(problems, 'question', {
        pageHeight: A4_HEIGHT_PX,
        headerHeightFirst: headerH + 20, 
        headerHeightNormal: 50, 
        footerHeight: 40,
        paddingTop: paddingY,
        paddingBottom: paddingY,
        itemGap: printOptions.questionPadding,
        layoutMode: printOptions.layoutMode
      });
    }, [problems, printOptions.questions, printOptions.questionPadding, printOptions.layoutMode, headerH]);

    // [수정] 해설지 페이지네이션 (여백 확보 강화)
    const solutionPages = useMemo(() => {
      if (!printOptions.solutions) return [];
      
      const solutionItems = (problems || []).filter(p => p.solutionUrl || p.content);
      
      return distributeItems(solutionItems, 'solution', {
        pageHeight: A4_HEIGHT_PX,
        headerHeightFirst: 70, 
        headerHeightNormal: 50,
        // [핵심 수정] footerHeight를 40 -> 250으로 대폭 늘려 잡음
        // 이유: 해설 텍스트 줄바꿈 등으로 인한 높이 오차를 방지하고, 
        // 하단 푸터 영역(40px) + 안전 여백(210px)을 미리 확보하여 푸터 밀림 원천 차단
        footerHeight: 250, 
        paddingTop: paddingY,
        paddingBottom: paddingY,
        itemGap: 10, 
        layoutMode: 'dense' 
      });
    }, [problems, printOptions.solutions]);


    // --- 헤더 렌더링 ---
    const renderHeader = (pageNum: number, isSolution = false) => {
      const displayTitle = isSolution ? `${title} [정답 및 해설]` : title;

      if (pageNum > 0 || isSolution) {
         return (
           <div className="w-full h-[50px] border-b border-gray-400 flex justify-between items-end pb-1 mb-2 shrink-0">
              <span className="text-sm font-bold text-slate-600 truncate max-w-[70%]">
                {displayTitle}
              </span>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>RuleMakers</span>
                <span className="pl-2 border-l border-slate-300 font-bold text-slate-500">
                  {pageNum + 1}
                </span>
              </div>
           </div>
         );
      }

      return (
        <div 
          className="w-full border-b-2 border-slate-900 pb-2 mb-4 flex flex-col justify-end shrink-0" 
          style={{ height: template.headerHeight, borderColor: template.borderColor }}
        >
           <div className="flex justify-between items-end">
              <div>
                 <span className="text-xs text-slate-500 font-bold tracking-widest mb-1 block">
                   2025학년도 1학기 대비
                 </span>
                 <h1 className={`font-extrabold tracking-tight text-slate-900 ${template.titleSize}`}>
                   {title}
                 </h1>
              </div>
              
              {template.showScoreBox && (
                <div className="flex border border-slate-800 text-xs">
                   <div className="bg-slate-50 px-2 py-1 border-r border-slate-800 font-bold flex items-center">성명</div>
                   <div className="w-16 border-r border-slate-800"></div>
                   <div className="bg-slate-50 px-2 py-1 border-r border-slate-800 font-bold flex items-center">점수</div>
                   <div className="w-12"></div>
                </div>
              )}
           </div>
           
           <div className="flex justify-between items-center mt-2 text-xs font-medium text-slate-500">
              <span>{instructor} 선생님</span>
              <span>RuleMakers</span>
           </div>
        </div>
      );
    };

    return (
      <>
        <div ref={ref} className="w-full bg-gray-100 flex flex-col items-center gap-10 py-10 print:p-0 print:bg-white print:gap-0">
          
          {/* === [1] 문제지 영역 === */}
          {questionPages.map((columns, pageIdx) => (
            <div
              key={`q-page-${pageIdx}`}
              className="bg-white shadow-xl print:shadow-none relative flex flex-col overflow-hidden break-after-page"
              style={{
                width: "210mm",
                height: "297mm",
                padding: `0 ${PADDING_X_MM}mm`,
                pageBreakAfter: "always",
                fontFamily: template.fontFamily
              }}
            >
              {template.watermarkOpacity > 0 && (
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0" style={{ opacity: template.watermarkOpacity }}>
                   <span className="text-9xl font-black text-slate-900 transform -rotate-45 opacity-10">RuleMakers</span>
                 </div>
              )}

              {renderHeader(pageIdx, false)}

              {/* [수정] flex-1 유지하되, 내부 콘텐츠가 늘어나도 부모(페이지) 크기를 넘지 않도록 주의 */}
              <div className="flex-1 flex gap-[10mm] relative z-10 items-start content-start">
                {columns.map((items, colIdx) => (
                  <div key={colIdx} className={`flex-1 flex flex-col h-full ${printOptions.layoutMode !== 'dense' ? 'justify-start gap-8' : ''}`}>
                    {items.map((prob) => (
                      <div 
                        key={`${prob.id}-${prob.number}`} 
                        className={`relative w-full group break-inside-avoid ${printOptions.layoutMode !== 'dense' ? 'flex-1' : ''}`}
                        style={{ marginBottom: printOptions.layoutMode === 'dense' ? printOptions.questionPadding : 0 }}
                      >
                        <button
                          onClick={() => setReportTarget(prob)}
                          className="absolute -top-1 right-0 text-slate-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity print:hidden z-20"
                        >
                          <ExclamationCircleIcon className="w-4 h-4" />
                        </button>

                        <div className="flex items-start h-full">
                           <span 
                             className="font-extrabold text-lg mr-2 leading-none shrink-0" 
                             style={{ color: template.borderColor }}
                           >
                             {prob.number}.
                           </span>
                           
                           <div className="flex-1">
                              {prob.imageUrl ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img 
                                  src={prob.imageUrl} 
                                  alt={`Problem ${prob.number}`} 
                                  className="w-full h-auto object-contain max-h-[800px]" 
                                />
                              ) : (
                                <p className={`whitespace-pre-wrap leading-relaxed ${template.problemFontSize} text-slate-800`}>
                                  {prob.content}
                                </p>
                              )}
                           </div>
                        </div>

                        {isTeacherVersion && (
                           <div className="absolute bottom-0 right-0 z-10 pointer-events-none select-none print:block">
                              <span className="text-red-600 font-bold opacity-60 text-sm border border-red-200 bg-white/80 px-1 rounded">
                                답: {prob.answer}
                              </span>
                           </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* 푸터 영역: flex layout에서 맨 아래에 위치. 위 콘텐츠가 커지면 밀려날 수 있으므로 distributeItems에서 엄격하게 제한함 */}
              <div className="h-[40px] flex justify-center items-center border-t border-gray-200 text-xs text-gray-400 shrink-0 mt-auto">
                 RuleMakers - {pageIdx + 1} -
              </div>
            </div>
          ))}

          {/* === [2] 정답표 === */}
          {printOptions.answers && problems.length > 0 && (
             <div className="bg-white shadow-xl print:shadow-none relative flex flex-col" 
                  style={{ width: "210mm", height: "297mm", padding: `0 ${PADDING_X_MM}mm`, pageBreakAfter: "always" }}>
                
                <div className="h-[80px] flex items-center border-b-2 border-black mb-8">
                   <h2 className="text-2xl font-extrabold text-slate-900">빠른 정답표</h2>
                </div>

                {Array.from({ length: Math.ceil(problems.length / 25) }).map((_, chunkIdx) => {
                  const chunkStart = chunkIdx * 25;
                  const chunkEnd = Math.min((chunkIdx + 1) * 25, problems.length);
                  const chunkProblems = problems.slice(chunkStart, chunkEnd);
                  
                  const rows = 5;
                  
                  return (
                    <div key={`ans-chunk-${chunkIdx}`} className="mb-8 pb-8 border-b-2 border-dashed border-slate-300 last:border-0">
                      <div className="grid grid-cols-5 gap-x-4 gap-y-2">
                        {Array.from({ length: 5 }).map((_, colIdx) => (
                          <div key={`col-${colIdx}`} className="flex flex-col gap-1">
                            {Array.from({ length: rows }).map((_, rowIdx) => {
                              const localIdx = colIdx * rows + rowIdx;
                              if (localIdx >= chunkProblems.length) return <div key={rowIdx} className="h-6"></div>;
                              
                              const prob = chunkProblems[localIdx];
                              const displayAnswer = prob.answer || "";
                              const isTextAnswer = isNaN(Number(displayAnswer));

                              return (
                                <div 
                                  key={prob.id} 
                                  className="flex items-center justify-start gap-2 border-b border-slate-200 pb-1 mb-1"
                                >
                                  <span className="font-bold text-slate-500 w-6 text-base shrink-0 text-right">
                                    {prob.number}
                                  </span>
                                  <span className={`font-extrabold text-slate-900 shrink-0 ${
                                    isTextAnswer 
                                      ? "text-base whitespace-nowrap tracking-tighter scale-90 origin-left"
                                      : "text-lg"
                                  }`}>
                                    {displayAnswer || "-"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
             </div>
          )}

          {/* === [3] 해설지 영역 === */}
          {solutionPages.map((columns, pageIdx) => (
            <div
              key={`s-page-${pageIdx}`}
              className="bg-white shadow-xl print:shadow-none relative flex flex-col overflow-hidden break-after-page"
              style={{
                width: "210mm",
                height: "297mm",
                padding: `0 ${PADDING_X_MM}mm`,
                pageBreakAfter: "always",
                fontFamily: template.fontFamily
              }}
            >
              {renderHeader(pageIdx, true)}

              {/* [수정] min-h-0 추가: Flex 자식 요소가 부모 높이를 뚫고 나가는 현상 방지 */}
              <div className="flex-1 flex gap-[10mm] relative z-10 mt-2 min-h-0">
                {columns.map((items, colIdx) => (
                  <div key={colIdx} className="flex-1 flex flex-col h-full">
                    {items.map((prob) => (
                      <div 
                        key={`sol-${prob.id}-${prob.number}`} 
                        className="w-full mb-0 border-b border-dashed border-gray-200 pb-2 last:border-0 break-inside-avoid"
                        style={{ marginBottom: 10 }}
                      >
                        <div className="flex items-center mb-1 gap-2">
                           <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded text-slate-700">
                             {prob.number}번
                           </span>
                           <span className="text-xs font-bold text-slate-500">
                             정답: {prob.answer}
                           </span>
                        </div>
                        <div className="text-sm text-gray-700 mt-1 leading-relaxed">
                           {prob.solutionUrl ? (
                             /* eslint-disable-next-line @next/next/no-img-element */
                             <img src={prob.solutionUrl} alt="해설" className="w-full h-auto object-contain" />
                           ) : (
                             // 해설 텍스트가 너무 길 경우를 대비해 스타일 조정
                             <p className="whitespace-pre-wrap">{prob.content || "해설 없음"}</p>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* 푸터 영역: mt-auto로 하단 고정하되, 위 로직 덕분에 밀려나지 않음 */}
              <div className="h-[40px] flex justify-center items-center border-t border-gray-200 text-xs text-gray-400 shrink-0 mt-auto">
                 - {pageIdx + 1} (정답 및 해설) -
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