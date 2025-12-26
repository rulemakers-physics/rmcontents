// components/ExamPaperLayout.tsx

"use client";

import React, { forwardRef, useMemo } from "react";
import { ExamTemplateStyle, LayoutMode } from "@/types/examTemplates";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import ReportIssueModal from "./ReportIssueModal";
import { ExamPaperProblem, PrintOptions } from "@/types/exam";
import { getSecureImageSrc, getProxyImageSrc } from "@/lib/imageHelper";
import QRCode from "react-qr-code";

// --- [상수 설정] A4 및 레이아웃 (96DPI 기준) ---
const A4_HEIGHT_PX = 1123; // A4 높이 (297mm)
const PADDING_X_MM = 20; // 좌우 여백

// 이미지 스케일 팩터
const IMG_SCALE_FACTOR = 0.245; 

// 문항 번호 포맷팅 (1 -> 01, 10 -> 10)
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
  academyLogo?: string | null;
  subTitle?: string;
  academyName?: string;
  id?: string;
  wrapperClassName?: string;
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
    
    // 문항 번호 헤더 높이 계산
    let headerOffset = type === 'question' ? 40 : 25; 
    
    if (type === 'question' && item.customLabel) {
      headerOffset += 20;
    }
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
  ({ id, problems = [], title, instructor, template, printOptions, isTeacherVersion, academyLogo, subTitle, academyName, wrapperClassName }, ref) => {
    
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

    // [수정] 해설지 페이지네이션 로직 개선
    const solutionPages = useMemo(() => {
      if (!printOptions.solutions) return [];
      
      // 기존: solutionUrl이나 content가 있는 문항만 필터링
      // 수정: 난이도가 '기본'인 문항도 포함하여 번호 연속성 보장
      const solutionItems = (problems || []).filter(p => 
        p.solutionUrl || p.content || p.difficulty === '기본'
      );
      
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

    // OMR 링크 생성
    const omrLink = id ? `https://rmcontents1.web.app/student/omr/${id}` : "";

    // --- 헤더 렌더링 함수 ---
    const renderHeader = (pageNum: number, isSolution = false) => {
      const displayTitle = isSolution ? `${title} [정답 및 해설]` : title;

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
                  {academyLogo && (
                    <img src={getProxyImageSrc(academyLogo)} alt="Academy Logo" className="h-20 object-contain" />
                  )}
                  </div>
                </div>
              </div>
         );
      }

      if (pageNum === 0) {
        return (
          <div 
            className="w-full border-b border-gray-300 pb-2 mb-4 flex flex-col justify-end shrink-0" 
            style={{ height: template.headerHeight }}
          >
             <div className="flex justify-between items-end">
                <div className="flex-1 mr-4"> 
                   <span className="text-xs text-slate-500 font-bold tracking-widest mb-1 block">
                     {subTitle || "2025학년도 1학기 대비"}
                   </span>
                   <h1 className={`font-semibold tracking-tight text-slate-900 ${template.titleSize}`}>
                     {title}
                   </h1>
                   <div className="mt-1 text-xs font-medium text-slate-500 flex items-center gap-2">
                      {academyName && <span className="font-bold text-slate-700">{academyName}</span>}
                      <span>{instructor} 선생님</span>
                   </div>
                </div>
                
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {academyLogo && (
                    <img 
                      src={getProxyImageSrc(academyLogo)} 
                      alt="Academy Logo" 
                      className={`h-20 object-contain ${omrLink ? "translate-y-[50px]" : ""}`}
                    />
                  )}

                  <div className="flex items-end gap-2">
                    {omrLink && (
                      <div className="bg-white p-0.5 border border-slate-200 rounded flex flex-col items-center justify-center">
                        <QRCode value={omrLink} size={58} />
                        <span className="text-[8px] font-bold text-slate-500 mt-0.5">OMR 입력</span>
                      </div>
                    )}

                    {template.showScoreBox && (
                      <div className="flex border border-slate-800 text-xs bg-white">
                        <div className="bg-slate-50 px-2 py-1 border-r border-slate-800 font-bold flex items-center text-slate-900">성명</div>
                        <div className="w-16 border-r border-slate-800"></div>
                        <div className="bg-slate-50 px-2 py-1 border-r border-slate-800 font-bold flex items-center text-slate-900">점수</div>
                        <div className="w-12"></div>
                      </div>
                    )}
                  </div>
                </div>
             </div>
          </div>
        );
      }

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
                {academyLogo ? (
                  <img src={getProxyImageSrc(academyLogo)} alt="Logo" className="h-20 object-contain" />
                ) : (
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

    const renderFooter = (pageIdx: number) => (
      <div className="h-[40px] relative flex items-center justify-center border-t border-gray-200 text-xs text-gray-400 shrink-0 mt-auto w-full">
        <span className="absolute left-1/2 -translate-x-1/2 font-medium">
          - {pageIdx + 1} -
        </span>
        <span className="absolute right-0 font-bold text-slate-500">
          PASS by RuleMakers
        </span>
      </div>
    );

    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
    };

    return (
      <>
        <div 
          ref={ref} 
          className={wrapperClassName || "w-full bg-gray-100 flex flex-col items-center gap-10 py-10 print:p-0 print:bg-white print:gap-0 no-select"}
          onContextMenu={handleContextMenu}
        >
          
          {/* === [1] 문제지 영역 === */}
          {questionPages.map((columns, pageIdx) => (
            <div
              key={`q-page-${pageIdx}`}
              className="bg-white shadow-xl print:shadow-none relative flex flex-col overflow-hidden break-after-page"
              style={{
                width: "210mm",
                height: "297mm",
                padding: `5mm ${PADDING_X_MM}mm`,
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

                        <div className="flex flex-col h-full gap-2">
                           {prob.customLabel && (
                             <div className="mb-1">
                               <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                 prob.customLabel.includes("오답") 
                                   ? "bg-red-50 text-red-600 border-red-100" 
                                   : "bg-indigo-50 text-indigo-600 border-indigo-100"
                               }`}>
                                 {prob.customLabel}
                               </span>
                             </div>
                           )}
                           <div className="flex items-center gap-1">
                              <img 
                                src="/images/logo.png" 
                                alt="RM" 
                                className="h-5 w-5 object-contain" 
                              />
                              <span 
                                className="font-semibold text-xl leading-none" 
                                style={{ color: template.borderColor }}
                              >
                                {formatNumber(prob.number)}
                              </span>
                              {prob.minorTopic && (
                              <span className="ml-1 text-[8.5px] font-bold text-slate-500 tracking-tight translate-x-[-2px] translate-y-[5px]">
                                  {prob.minorTopic}
                              </span>
                              )}

                              {prob.materialLevel && prob.materialLevel !== "학교 교과서" && (
                              <span className="ml-auto px-1.5 py-0.5 rounded border border-slate-400 text-[10px] font-bold text-slate-500 bg-white whitespace-nowrap mb-[1px] translate-y-[3px]">
                                  심화 교과
                              </span>
                              )}
                           </div>
                           
                           <div className="flex-1">
                              {prob.imageUrl ? (
                                <div className="relative w-full h-auto">
                                   <div className="protect-overlay" />
                                    <img 
                                      src={getSecureImageSrc(prob.imageUrl)}
                                      alt={`Problem ${prob.number}`} 
                                      className="w-full h-auto object-contain max-h-[800px] pointer-events-none" 
                                      onContextMenu={(e) => e.preventDefault()}
                                    />
                                  </div>
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
                           <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded text-slate-700">
                             {formatNumber(prob.number)}번
                           </span>
                           <span className="text-xs font-bold text-slate-500">
                             정답: {prob.answer}
                           </span>
                        </div>
                        <div className="text-sm text-gray-700 mt-1 leading-relaxed">
                           {/* [수정] 기본 문항 안내 메시지 처리 */}
                           {prob.solutionUrl ? (
                             <img src={getProxyImageSrc(prob.solutionUrl)} alt="해설" className="w-full h-auto object-contain" />
                           ) : (
                             <p className="whitespace-pre-wrap text-slate-400">
                               {prob.content || (prob.difficulty === '기본' ? "기본 문항은 상세 해설이 제공되지 않습니다." : "해설 없음")}
                             </p>
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