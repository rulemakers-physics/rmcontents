import React, { forwardRef } from "react";

// --- 타입 정의 ---
export type ExamTemplateStyle = {
  id: string;
  name: string;
  headerHeight: string;
  columnGap: string;
  fontFamily: string;
  borderColor: string;
  headerStyle: "simple" | "box" | "detail";
};

export interface ExamProblem {
  id: string;
  number: number;
  content?: string;
  imageUrl?: string | null;
  heightEstimate?: number;
  difficulty?: string;
  answer?: string | null;
  solutionUrl?: string | null;
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

// [헬퍼] 정답 숫자를 원문자로 변환
const getCircledNum = (val?: string | null) => {
  if (!val) return "-";
  const num = parseInt(val, 10);
  if (!isNaN(num) && num >= 1 && num <= 15) {
    return String.fromCharCode(9311 + num);
  }
  return val;
};


const ExamPaperLayout = forwardRef<HTMLDivElement, ExamPaperLayoutProps>(
  ({ pages, title, instructor, template, printOptions }, ref) => {
    
    // 전체 문제 리스트
    const allProblems = pages.flat().sort((a, b) => a.number - b.number);

    // 헤더 렌더링 함수
    const renderHeader = (pageNum: number, sectionTitle?: string) => {
      const displayTitle = sectionTitle || title;
      if (template.headerStyle === "box") {
        return (
          <div className="border-2 border-black p-2 mb-4 flex justify-between items-center select-none" style={{ height: template.headerHeight }}>
            <div className="text-center flex-1">
              <h1 className="text-xl font-extrabold tracking-widest">{displayTitle}</h1>
              <p className="text-xs mt-1">{instructor} 선생님</p>
            </div>
          </div>
        );
      }
      return (
        <div className="border-b-2 mb-6 pb-2 flex justify-between items-end select-none" 
             style={{ borderColor: template.borderColor, height: template.headerHeight }}>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{displayTitle}</h1>
            <p className="text-sm text-gray-500 font-bold mt-1">
              {instructor} | {sectionTitle ? sectionTitle : `제 ${pageNum + 1} 면`}
            </p>
          </div>
          <div className="text-xs text-gray-400 font-mono">RuleMakers</div>
        </div>
      );
    };

    return (
      <div ref={ref} className="w-full bg-gray-100 flex flex-col items-center gap-8 py-10 print:p-0 print:bg-white print:gap-0">
        
        {/* === 1. 문제지 영역 === */}
        {printOptions.questions && pages.map((pageProblems, pageIndex) => (
          <div
            key={`q-page-${pageIndex}`}
            className="bg-white shadow-lg print:shadow-none relative overflow-hidden mb-8 print:mb-0"
            style={{
              width: "210mm",
              height: "297mm",
              padding: "15mm",
              fontFamily: template.fontFamily,
              pageBreakAfter: "always"
            }}
          >
            {renderHeader(pageIndex)}
            <div
              className="w-full h-full"
              style={{
                columnCount: 2,
                columnGap: template.columnGap,
                columnFill: "auto",
                height: `calc(100% - ${template.headerHeight} - 40px)`,
              }}
            >
              {pageProblems.map((prob) => (
                <div key={prob.id} className="mb-6 break-inside-avoid relative group" style={{ pageBreakInside: "avoid" }}>
                  <div className="flex items-start gap-2">
                    <span className="text-lg font-extrabold w-6 flex-shrink-0 leading-none" style={{ color: template.borderColor }}>
                      {prob.number}.
                    </span>
                    <div className="flex-1">
                      {prob.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={prob.imageUrl} alt={`Problem ${prob.number}`} className="w-full object-contain" style={{ maxHeight: "400px" }} />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{prob.content}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute bottom-4 left-0 w-full text-center text-xs text-gray-400 font-light">- {pageIndex + 1} -</div>
          </div>
        ))}

        {/* === 2. 빠른 정답표 === */}
        {printOptions.answers && allProblems.length > 0 && (
          <div
              className="bg-white shadow-lg print:shadow-none relative overflow-hidden mb-8 print:mb-0"
              style={{ width: "210mm", height: "297mm", padding: "15mm", fontFamily: template.fontFamily, pageBreakAfter: "always" }}
            >
              <div className="bg-gray-50 py-6 mb-12 flex justify-center items-center">
                 <h2 className="text-2xl font-extrabold tracking-wider text-black">빠른 정답</h2>
              </div>
              <div className="w-full px-4">
                <div className="grid grid-cols-4 gap-x-8 gap-y-6">
                   {allProblems.map((prob) => (
                     <div key={prob.id} className="flex items-center justify-center gap-3">
                       <span className="text-xl font-extrabold tracking-tight" style={{ color: template.borderColor }}>
                         {String(prob.number).padStart(3, '0')}
                       </span>
                       <span className="text-lg text-gray-500 font-medium pt-0.5">
                         {getCircledNum(prob.answer)}
                       </span>
                     </div>
                   ))}
                </div>
              </div>
            </div>
        )}

        {/* === 3. 상세 해설 (Grid 방식: 종이 절약 + 자동 줄바꿈) === */}
        {printOptions.solutions && allProblems.length > 0 && (
          <div
            className="bg-white shadow-lg print:shadow-none relative overflow-visible print:overflow-visible"
            style={{ 
              width: "210mm", 
              minHeight: "297mm", // 최소 A4 한 장 높이
              height: "auto",     // 내용이 많으면 자동으로 늘어남
              padding: "15mm", 
              fontFamily: template.fontFamily,
              // 페이지 분할(쪽 나누기)이 인쇄 시에만 자동으로 일어남
            }}
          >
            {/* 해설지 타이틀 (첫 장에만 표시됨) */}
            {renderHeader(0, "상세 해설")}
            
            {/* [핵심 변경] CSS Grid 적용 (좌->우 순서 배치) */}
            <div 
              className="mt-6 w-full grid grid-cols-2 items-start align-start"
              style={{
                gap: template.columnGap, // 좌우 간격
                rowGap: "1.5rem"         // 위아래 간격
              }}
            >
              {allProblems
                .filter(p => p.solutionUrl)
                .map((prob) => (
                  <div 
                    key={prob.id} 
                    // [중요] 인쇄 시 박스가 잘리지 않고 통째로 다음 장으로 넘어가게 함
                    className="break-inside-avoid w-full border border-gray-100 rounded-lg p-2"
                    style={{ pageBreakInside: "avoid" }}
                  >
                    {/* 해설 헤더 */}
                    <div className="flex items-center gap-2 mb-2 pb-1 border-b border-gray-200">
                      <span 
                        className="text-sm font-extrabold px-2 py-0.5 rounded"
                        style={{ color: template.borderColor, backgroundColor: '#f3f4f6' }}
                      >
                        {prob.number}번 해설
                      </span>
                    </div>

                    {/* 해설 이미지 */}
                    <div className="bg-white rounded-lg overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */ }
                        <img 
                          src={prob.solutionUrl!} 
                          alt={`해설-${prob.number}`} 
                          className="w-full object-contain"
                        />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

ExamPaperLayout.displayName = "ExamPaperLayout";
export default ExamPaperLayout;