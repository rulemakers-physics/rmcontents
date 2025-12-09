// components/ExamPaperLayout.tsx

"use client";

import React, { forwardRef, useMemo } from "react";
import { ExamTemplateStyle, LayoutMode } from "@/types/examTemplates";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import ReportIssueModal from "./ReportIssueModal";
import { ExamPaperProblem, PrintOptions } from "@/types/exam";

// --- [상수 설정] A4 및 레이아웃 (96DPI 기준) ---
const A4_HEIGHT_PX = 1123; // A4 높이 (297mm)
const PADDING_X_MM = 20; // 좌우 여백

// 이미지 스케일 팩터
const IMG_SCALE_FACTOR = 0.245; 

// [신규] 문항 번호 포맷팅 (1 -> 01, 10 -> 10)
const formatNumber = (num: number) => {
  return num.toString().padStart(2, '0');
};

interface ExamPaperLayoutProps {
  problems: ExamPaperProblem[]; 
  title: string;
  instructor: string;
  template: ExamTemplateStyle;
  printOptions: PrintOptions;
  isTeacherVersion?: boolean;
  academyLogo?: string | null; // 로고 Prop 명시
}

// --- [알고리즘] 문항 분배 함수 ---
function distributeItems(
  items: ExamPaperProblem[],
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

  const pages: ExamPaperProblem[][][] = []; 
  
  let currentPageIdx = 0;
  let currentColIdx = 0;
  let currentY = 0;

  const SAFETY_MARGIN_BOTTOM = 20;

  // 페이지 초기화
  const createNewPage = () => {
    pages.push([[], []]); // 좌/우 컬럼
    currentPageIdx = pages.length - 1;
    currentColIdx = 0;
    
    // 헤더 높이 적용
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
    
    // [수정] 문항 번호가 상단으로 이동했으므로, 문항별 기본 높이(번호 영역)를 추가로 고려해야 함 (약 30px)
    const headerOffset = type === 'question' ? 40 : 25; 
    const itemTotalHeight = rawHeight + options.itemGap + headerOffset;
    
    const maxContentY = options.pageHeight - options.footerHeight - options.paddingBottom - SAFETY_MARGIN_BOTTOM;
    
    if (isSplitMode) {
      // --- 분할 배치 로직 ---
      const currentItemsInCol = pages[currentPageIdx][currentColIdx];
      let shouldPushToNextCol = false;

      if (currentItemsInCol.length >= targetPerCol) {
        shouldPushToNextCol = true;
      } else if (options.layoutMode === 'split-4' && currentItemsInCol.length === 1) {
        if (currentY + itemTotalHeight > maxContentY) {
          shouldPushToNextCol = true;
        }
      }

      if (shouldPushToNextCol) {
        currentColIdx++;
        const hHeight = currentPageIdx === 0 ? options.headerHeightFirst : options.headerHeightNormal;
        currentY = options.paddingTop + hHeight;
        
        if (currentColIdx > 1) {
          createNewPage();
        }
      }

      pages[currentPageIdx][currentColIdx].push(item);
      currentY += itemTotalHeight;
      itemIdx++;

    } else {
      // --- Dense (기본) 배치 로직 ---
      const isOverflow = (currentY + itemTotalHeight) > maxContentY;

      if (isOverflow) {
        currentColIdx++;
        const hHeight = currentPageIdx === 0 ? options.headerHeightFirst : options.headerHeightNormal;
        currentY = options.paddingTop + hHeight;

        if (currentColIdx > 1) {
          createNewPage();
        }
      }

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
  ({ problems = [], title, instructor, template, printOptions, isTeacherVersion, academyLogo }, ref) => {
    
    const [reportTarget, setReportTarget] = React.useState<ExamPaperProblem | null>(null);

    // 템플릿의 헤더 높이 파싱
    const headerH = parseInt(template.headerHeight) || 100; 
    const paddingY = 5; 

    // 문제지 페이지네이션
    const questionPages = useMemo(() => {
      if (!printOptions.questions) return [];
      
      return distributeItems(problems, 'question', {
        pageHeight: A4_HEIGHT_PX,
        headerHeightFirst: headerH + 20, 
        headerHeightNormal: headerH + 20, 
        footerHeight: 40,
        paddingTop: paddingY,
        paddingBottom: paddingY,
        itemGap: printOptions.questionPadding,
        layoutMode: printOptions.layoutMode
      });
    }, [problems, printOptions.questions, printOptions.questionPadding, printOptions.layoutMode, headerH]);

    // 해설지 페이지네이션
    const solutionPages = useMemo(() => {
      if (!printOptions.solutions) return [];
      
      const solutionItems = (problems || []).filter(p => p.solutionUrl || p.content);
      
      return distributeItems(solutionItems, 'solution', {
        pageHeight: A4_HEIGHT_PX,
        headerHeightFirst: headerH + 20, 
        headerHeightNormal: headerH + 20, 
        footerHeight: 40, 
        paddingTop: paddingY,
        paddingBottom: paddingY,
        itemGap: 10, 
        layoutMode: 'dense' 
      });
    }, [problems, printOptions.solutions, headerH]);


    // --- 헤더 렌더링 ---
    const renderHeader = (pageNum: number, isSolution = false) => {
      const displayTitle = isSolution ? `${title} [정답 및 해설]` : title;

      // 1. 해설지 헤더
      if (isSolution) {
         return (
           <div 
             className="w-full flex flex-col justify-end shrink-0 border-b border-gray-300 pb-2 mb-4"
             style={{ height: template.headerHeight }}
           >
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-slate-600 truncate max-w-[70%]">
                  {displayTitle}
                </span>
                <div className="flex flex-col items-end gap-2">
                  {/* 해설지에도 로고 표시 (선택사항) */}
                  {academyLogo && (
                    <img src={academyLogo} alt="Academy Logo" className="h-12 object-contain" />
                  )}
                  </div>
                </div>
              </div>
         );
      }

      // 2. 문제지 헤더 (1페이지)
      if (pageNum === 0) {
        return (
          <div 
            className="w-full border-b border-gray-300 pb-2 mb-4 flex flex-col justify-end shrink-0" 
            style={{ height: template.headerHeight }}
          >
             <div className="flex justify-between items-end">
                {/* 좌측: 타이틀 */}
                <div>
                   <span className="text-xs text-slate-500 font-bold tracking-widest mb-1 block">
                     2025학년도 1학기 대비
                   </span>
                   <h1 className={`font-extrabold tracking-tight text-slate-900 ${template.titleSize}`}>
                     {title}
                   </h1>
                   <div className="mt-1 text-xs font-medium text-slate-500">
                      {instructor} 선생님
                   </div>
                </div>
                
                {/* 우측: 로고 및 점수 박스 */}
                <div className="flex flex-col items-end gap-2">
                  {/* [헤더] 학원 로고: 성명란 위에 배치 */}
                  {academyLogo && (
                    <img src={academyLogo} alt="Academy Logo" className="h-12 object-contain" />
                  )}

                  {template.showScoreBox && (
                    <div className="flex border border-slate-800 text-xs">
                       <div className="bg-slate-50 px-2 py-1 border-r border-slate-800 font-bold flex items-center">성명</div>
                       <div className="w-16 border-r border-slate-800"></div>
                       <div className="bg-slate-50 px-2 py-1 border-r border-slate-800 font-bold flex items-center">점수</div>
                       <div className="w-12"></div>
                    </div>
                  )}
                </div>
             </div>
          </div>
        );
      }

      // 3. [수정] 문제지 2페이지 이후 헤더 (페이지 번호 제거 -> 로고로 대체)
      return (
        <div 
          className="w-full flex flex-col justify-end shrink-0 border-b border-gray-300 pb-2 mb-4"
          style={{ height: template.headerHeight }} 
        >
           <div className="flex justify-between items-end h-full">
              <span className="text-sm font-bold text-slate-400 truncate max-w-[70%]">
                {title}
              </span>
              <div className="flex flex-col items-end">
                {/* [수정] 로고가 있으면 페이지 번호 대신 로고를 크게 표시 */}
                {academyLogo ? (
                  <img src={academyLogo} alt="Academy Logo" className="h-12 object-contain" />
                ) : (
                  // 로고가 없을 때만 페이지 번호 표시 (기존 방식 유지)
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="pl-2 border-l border-slate-300 font-bold text-slate-500">
                      {pageNum + 1}
                    </span>
                  </div>
                )}
              </div>
           </div>
        </div>
      );
    };

    // --- [수정] 푸터 렌더링 (RuleMakers 로고 오른쪽 배치) ---
    const renderFooter = (pageIdx: number) => (
      <div className="h-[40px] relative flex items-center justify-center border-t border-gray-200 text-xs text-gray-400 shrink-0 mt-auto w-full">
        {/* 가운데 정렬: 페이지 번호 */}
        <span className="absolute left-1/2 -translate-x-1/2 font-medium">
          - {pageIdx + 1} -
        </span>
        {/* 오른쪽 정렬: PASS by RuleMakers */}
        <span className="absolute right-0 font-bold text-slate-500">
          PASS by RuleMakers
        </span>
      </div>
    );

    // [보안 1] 우클릭 방지 핸들러 추가
    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
    };

    return (
      <>
        <div 
          ref={ref} 
          // ▼▼▼ [2. 수정할 코드] className 끝에 'no-select' 추가하고 onContextMenu 연결 ▼▼▼
          className="w-full bg-gray-100 flex flex-col items-center gap-10 py-10 print:p-0 print:bg-white print:gap-0 no-select"
          onContextMenu={handleContextMenu}
          // ▲▲▲ 여기까지 수정하세요 ▲▲▲
        >
          
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

                        {/* [수정] 문항 레이아웃: 번호 상단 배치 + 룰메이커스 로고 */}
                        <div className="flex flex-col h-full gap-2">
                           
                           {/* 문항 번호 Header */}
                           <div className="flex items-center gap-1">
                              {/* 룰메이커스 로고 (문항 번호 크기에 맞춤) */}
                              <img 
                                src="/images/logo.png" 
                                alt="RM" 
                                className="h-5 w-5 object-contain" 
                              />
                              {/* 문항 번호 (00 형식) */}
                              <span 
                                className="font-semibold text-xl leading-none" 
                                style={{ color: template.borderColor }}
                              >
                                {formatNumber(prob.number)}
                              </span>
                           </div>
                           
                           {/* 문항 본문 */}
                           <div className="flex-1">
                              {prob.imageUrl ? (
                                /* ▼▼▼ [3. 수정할 코드] 기존 img 태그를 div로 감싸고 오버레이 추가 ▼▼▼ */
                                <div className="relative w-full h-auto">
                                   {/* 투명 보호막: 이미지를 덮어서 우클릭/저장을 막음 */}
                                   <div className="protect-overlay" />
                                   
                                   {/* 원본 이미지: 클릭 이벤트 무시(pointer-events-none) 설정 */}
                                   <img 
                                     src={prob.imageUrl} 
                                     alt={`Problem ${prob.number}`} 
                                     className="w-full h-auto object-contain max-h-[800px] pointer-events-none" 
                                   />
                                </div>
                                /* ▲▲▲ 여기까지 수정▲▲▲ */
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

              {renderFooter(pageIdx)}
            </div>
          ))}

          {/* === [2] 정답표 === */}
          {printOptions.answers && problems.length > 0 && (
             <div className="bg-white shadow-xl print:shadow-none relative flex flex-col" 
                  style={{ width: "210mm", height: "297mm", padding: `0 ${PADDING_X_MM}mm`, pageBreakAfter: "always" }}>
                
                <div 
                  className="w-full border-b border-gray-300 pb-2 mb-4 flex flex-col justify-end shrink-0" 
                  style={{ height: template.headerHeight }}
                >
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
                              if (localIdx >= chunkProblems.length) return <div key={rowIdx} className="h-9"></div>;
                              
                              const prob = chunkProblems[localIdx];
                              const displayAnswer = prob.answer || "";
                              const isTextAnswer = isNaN(Number(displayAnswer));

                              return (
                                <div 
                                  key={prob.id} 
                                  className="flex items-center justify-start gap-2 border-b border-slate-200 pb-1 mb-1 h-9"
                                >
                                  {/* [수정] 정답표에서도 00 형식 적용 */}
                                  <span className="font-bold text-slate-500 w-8 text-base shrink-0 text-right">
                                    {formatNumber(prob.number)}
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
                           {/* [수정] 해설지 문항 번호도 00 형식 */}
                           <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded text-slate-700">
                             {formatNumber(prob.number)}번
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
                             <p className="whitespace-pre-wrap">{prob.content || "해설 없음"}</p>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {renderFooter(pageIdx)}
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