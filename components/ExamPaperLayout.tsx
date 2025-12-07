// components/ExamPaperLayout.tsx

"use client";

import React, { forwardRef, useMemo } from "react";
import { ExamTemplateStyle } from "@/types/examTemplates";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import ReportIssueModal from "./ReportIssueModal";

// --- [상수 설정] A4 및 레이아웃 (96DPI 기준) ---
const A4_HEIGHT_PX = 1123; // A4 높이 (297mm)
const PADDING_X_MM = 20; // 좌우 여백
// 이미지 스케일링 팩터 (원본 해상도가 클 경우 화면/출력물 컬럼 너비에 맞춰 줄임)
const IMG_SCALE_FACTOR = 0.28; 

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
  // [신규] DB에서 가져온 높이 정보
  height?: number; 
  solutionHeight?: number;
}

export interface PrintOptions {
  questions: boolean;
  answers: boolean;
  solutions: boolean;
  // [신규] 사용자 지정 패딩
  questionPadding: number;
  solutionPadding: number;
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
    headerHeightFirst: number; // 1페이지 헤더 높이
    headerHeightNormal: number; // 2페이지부터 헤더 높이
    footerHeight: number;
    paddingTop: number;
    paddingBottom: number;
    itemGap: number; // 문항 간 간격
  }
) {
  // [안전 장치] items가 undefined/null인 경우 빈 배열 반환하여 에러 방지
  if (!items || items.length === 0) return [];

  // 3차원 배열: Pages -> Columns(2) -> Items
  const pages: ExamProblem[][][] = []; 
  
  let currentPageIdx = 0;
  let currentColIdx = 0; // 0: 좌측, 1: 우측
  let currentY = 0;

  // 새 페이지 생성 헬퍼
  const createNewPage = () => {
    pages.push([[], []]); // 좌/우 컬럼 초기화
    currentPageIdx = pages.length - 1;
    currentColIdx = 0;
    
    // 헤더 높이만큼 시작점 확보
    const hHeight = currentPageIdx === 0 ? options.headerHeightFirst : options.headerHeightNormal;
    currentY = options.paddingTop + hHeight;
  };

  // 첫 페이지 시작
  createNewPage();

  items.forEach((item) => {
    // 1. 아이템의 렌더링 높이 추산
    // DB값이 있으면 스케일 적용, 없으면 기본값(텍스트 문항 등) 150px/100px + 여유분
    const rawHeight = type === 'question' 
      ? (item.height ? item.height * IMG_SCALE_FACTOR : 150)
      : (item.solutionHeight ? item.solutionHeight * IMG_SCALE_FACTOR : 100);
    
    // 실제 차지하는 높이 = 컨텐츠 높이 + 사용자 지정 패딩
    const itemTotalHeight = rawHeight + options.itemGap;

    // 2. 현재 페이지의 가용 높이 (전체 - 푸터 - 하단여백)
    const maxContentY = options.pageHeight - options.footerHeight - options.paddingBottom;

    // 3. 넘침 체크
    if (currentY + itemTotalHeight > maxContentY) {
      // 현재 단(Column)이 꽉 참 -> 다음 단으로 이동
      currentColIdx++;
      
      // 해당 페이지의 헤더 높이 다시 계산 (Y축 초기화)
      const hHeight = currentPageIdx === 0 ? options.headerHeightFirst : options.headerHeightNormal;
      currentY = options.paddingTop + hHeight;

      // 만약 2단(0, 1)을 넘어 2가 되면 -> 다음 페이지로
      if (currentColIdx > 1) {
        createNewPage();
      }
    }

    // 4. 배치 및 Y축 증가
    if (pages[currentPageIdx] && pages[currentPageIdx][currentColIdx]) {
        pages[currentPageIdx][currentColIdx].push(item);
    }
    currentY += itemTotalHeight;
  });

  return pages;
}

const ExamPaperLayout = forwardRef<HTMLDivElement, ExamPaperLayoutProps>(
  ({ problems = [], title, instructor, template, printOptions, isTeacherVersion }, ref) => {
    
    const [reportTarget, setReportTarget] = React.useState<ExamProblem | null>(null);

    // 템플릿 값 파싱 (대략적인 px 변환)
    const headerH = parseInt(template.headerHeight) || 100; 
    const paddingY = 60; // 상하 여백 (px)

    // 1. [계산] 문제지 페이지네이션
    const questionPages = useMemo(() => {
      if (!printOptions.questions) return [];
      
      return distributeItems(problems, 'question', {
        pageHeight: A4_HEIGHT_PX,
        headerHeightFirst: headerH + 20, 
        headerHeightNormal: 50, // 2페이지부터 심플 헤더
        footerHeight: 40,
        paddingTop: paddingY,
        paddingBottom: paddingY,
        itemGap: printOptions.questionPadding
      });
    }, [problems, printOptions.questions, printOptions.questionPadding, headerH]);

    // 2. [계산] 해설지 페이지네이션
    const solutionPages = useMemo(() => {
      if (!printOptions.solutions) return [];
      
      // 해설이 있는 문항만 필터링
      const solutionItems = (problems || []).filter(p => p.solutionUrl || p.content);
      
      return distributeItems(solutionItems, 'solution', {
        pageHeight: A4_HEIGHT_PX,
        headerHeightFirst: 70, // 해설지 헤더는 작게
        headerHeightNormal: 50,
        footerHeight: 40,
        paddingTop: paddingY,
        paddingBottom: paddingY,
        itemGap: printOptions.solutionPadding
      });
    }, [problems, printOptions.solutions, printOptions.solutionPadding]);


    // --- 헤더 렌더링 ---
    const renderHeader = (pageNum: number, isSolution = false) => {
      const displayTitle = isSolution ? `${title} [정답 및 해설]` : title;

      // 2페이지 이후 or 해설지 헤더 (심플형)
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

      // 1페이지 메인 헤더 (템플릿 적용)
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
              
              {/* 점수 박스 (템플릿 옵션) */}
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
              <span>RuleMakers Problem Bank</span>
           </div>
        </div>
      );
    };

    return (
      <>
        {/* 인쇄 대상 컨테이너 */}
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
              {/* 워터마크 */}
              {template.watermarkOpacity > 0 && (
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0" style={{ opacity: template.watermarkOpacity }}>
                   <span className="text-9xl font-black text-slate-900 transform -rotate-45 opacity-10">RuleMakers</span>
                 </div>
              )}

              {renderHeader(pageIdx, false)}

              {/* 2단 컬럼 바디 */}
              <div className="flex-1 flex gap-[10mm] relative z-10">
                {columns.map((items, colIdx) => (
                  <div key={colIdx} className="flex-1 flex flex-col h-full">
                    {items.map((prob) => (
                      <div 
                        key={prob.id} 
                        className="relative w-full group break-inside-avoid"
                        style={{ marginBottom: printOptions.questionPadding }}
                      >
                        {/* 오류 신고 버튼 (화면에서만 보임) */}
                        <button
                          onClick={() => setReportTarget(prob)}
                          className="absolute -top-1 right-0 text-slate-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity print:hidden z-20"
                        >
                          <ExclamationCircleIcon className="w-4 h-4" />
                        </button>

                        <div className="flex items-start">
                           {/* 문제 번호 */}
                           <span 
                             className="font-extrabold text-lg mr-2 leading-none shrink-0" 
                             style={{ color: template.borderColor }}
                           >
                             {prob.number}.
                           </span>
                           
                           {/* 문제 본문 (이미지 or 텍스트) */}
                           <div className="flex-1">
                              {prob.imageUrl ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img 
                                  src={prob.imageUrl} 
                                  alt={`Problem ${prob.number}`} 
                                  className="w-full h-auto object-contain" 
                                />
                              ) : (
                                <p className={`whitespace-pre-wrap leading-relaxed ${template.problemFontSize} text-slate-800`}>
                                  {prob.content}
                                </p>
                              )}
                           </div>
                        </div>

                        {/* 교사용 오버레이 */}
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

              {/* 푸터 */}
              <div className="h-[40px] flex justify-center items-center border-t border-gray-200 text-xs text-gray-400 shrink-0">
                 RuleMakers - {pageIdx + 1} -
              </div>
            </div>
          ))}

          {/* === [2] 정답표 (옵션) === */}
          {printOptions.answers && problems.length > 0 && (
             <div className="bg-white shadow-xl print:shadow-none relative flex flex-col" 
                  style={{ width: "210mm", height: "297mm", padding: `0 ${PADDING_X_MM}mm`, pageBreakAfter: "always" }}>
                
                <div className="h-[80px] flex items-center border-b-2 border-black mb-8">
                   <h2 className="text-2xl font-extrabold text-slate-900">빠른 정답표</h2>
                </div>

                <div className="grid grid-cols-5 gap-4 content-start">
                   {problems.sort((a,b) => a.number - b.number).map((prob) => (
                     <div key={prob.id} className="flex justify-between items-center p-2 border-b border-gray-200 text-sm">
                        <span className="font-bold text-slate-500">{String(prob.number).padStart(2, '0')}</span>
                        <span className="font-extrabold text-slate-900 text-base">{prob.answer}</span>
                     </div>
                   ))}
                </div>
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

              <div className="flex-1 flex gap-[10mm] relative z-10 mt-2">
                {columns.map((items, colIdx) => (
                  <div key={colIdx} className="flex-1 flex flex-col h-full">
                    {items.map((prob) => (
                      <div 
                        key={prob.id} 
                        className="w-full mb-0 border-b border-dashed border-gray-200 pb-2 last:border-0 break-inside-avoid"
                        style={{ marginBottom: printOptions.solutionPadding }}
                      >
                        <div className="flex items-center mb-1 gap-2">
                           <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded text-slate-700">
                             {prob.number}번
                           </span>
                           <span className="text-xs font-bold text-slate-500">
                             정답: {prob.answer}
                           </span>
                        </div>
                        <div className="text-sm text-gray-700 mt-1">
                           {prob.solutionUrl ? (
                             /* eslint-disable-next-line @next/next/no-img-element */
                             <img src={prob.solutionUrl} alt="해설" className="w-full h-auto object-contain" />
                           ) : (
                             <p className="text-xs text-slate-400 italic">해설 이미지가 없습니다.</p>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="h-[40px] flex justify-center items-center border-t border-gray-200 text-xs text-gray-400 shrink-0">
                 - {pageIdx + 1} (정답 및 해설) -
              </div>
            </div>
          ))}

        </div>

        {/* 오류 신고 모달 */}
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