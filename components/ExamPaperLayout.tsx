// components/ExamPaperLayout.tsx
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
  content?: string;     // 텍스트 (없으면 이미지 사용)
  imageUrl?: string;    // 문제 이미지 URL
  heightEstimate?: number; // 높이 추정치 (페이지 분할 계산용)
  difficulty?: string;
}

interface ExamPaperLayoutProps {
  pages: ExamProblem[][]; // [페이지1[문제들], 페이지2[문제들]...] 2차원 배열
  title: string;
  instructor: string;
  template: ExamTemplateStyle;
}

const ExamPaperLayout = forwardRef<HTMLDivElement, ExamPaperLayoutProps>(
  ({ pages, title, instructor, template }, ref) => {
    
    // --- 내부 컴포넌트: 헤더 ---
    const renderHeader = (pageNum: number) => {
      // 2페이지부터는 헤더를 간소화하거나 생략할 수도 있음 (여기선 매 페이지 표시)
      if (template.headerStyle === "box") {
        return (
          <div className="border-2 border-black p-2 mb-4 flex justify-between items-center select-none" style={{ height: template.headerHeight }}>
            <div className="text-center flex-1">
              <h1 className="text-xl font-extrabold tracking-widest">{title}</h1>
              <p className="text-xs mt-1">{instructor} 선생님</p>
            </div>
            <div className="border-l-2 border-black pl-4 h-full flex flex-col justify-center w-24">
              <span className="text-[10px] font-bold">점수</span>
              <div className="w-full h-6 border border-gray-400 mt-1"></div>
            </div>
          </div>
        );
      }
      // Simple Style
      return (
        <div className="border-b-2 mb-6 pb-2 flex justify-between items-end select-none" 
             style={{ borderColor: template.borderColor, height: template.headerHeight }}>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            <p className="text-sm text-gray-500 font-bold mt-1">
              {instructor} | 제 {pageNum + 1} 면
            </p>
          </div>
          <div className="text-xs text-gray-400 font-mono">RuleMakers</div>
        </div>
      );
    };

    return (
      <div ref={ref} className="w-full bg-gray-100 flex flex-col items-center gap-8 py-10 print:p-0 print:bg-white">
        {pages.map((pageProblems, pageIndex) => (
          // === A4 Page Container ===
          <div
            key={pageIndex}
            className="bg-white shadow-lg print:shadow-none relative overflow-hidden"
            style={{
              width: "210mm",
              height: "297mm", // 고정 높이 (내용 넘치면 잘림 - 페이지 분할 로직 중요)
              padding: "15mm",
              fontFamily: template.fontFamily,
              pageBreakAfter: "always" // 인쇄 시 다음 페이지로 강제 넘김
            }}
          >
            {/* Header */}
            {renderHeader(pageIndex)}

            {/* Body: 2-Column Layout */}
            <div
              className="w-full h-full"
              style={{
                columnCount: 2,
                columnGap: template.columnGap,
                columnFill: "auto", // auto: 1열 다 채우고 2열로 (신문식), balance: 높이 맞춤
                height: `calc(100% - ${template.headerHeight} - 40px)`, // 헤더, 푸터 제외한 높이
              }}
            >
              {pageProblems.map((prob) => (
                <div
                  key={prob.id}
                  className="mb-6 break-inside-avoid relative group"
                  style={{ pageBreakInside: "avoid" }} // 인쇄/컬럼 분리 시 잘림 방지
                >
                  <div className="flex items-start gap-2">
                    <span 
                      className="text-lg font-extrabold w-6 flex-shrink-0 leading-none"
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
                          className="w-full object-contain"
                          style={{ maxHeight: "400px" }} // 너무 큰 이미지 제한
                        />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{prob.content}</p>
                      )}
                    </div>
                  </div>
                  {/* 문제 사이 여백 (서술형 공간 등) */}
                  <div className="h-10 w-full"></div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="absolute bottom-4 left-0 w-full text-center text-xs text-gray-400 font-light">
              - {pageIndex + 1} -
            </div>
          </div>
        ))}
      </div>
    );
  }
);

ExamPaperLayout.displayName = "ExamPaperLayout";
export default ExamPaperLayout;