// components/ExamPaperLayout.tsx
import React, { forwardRef } from "react";

interface Problem {
  id: string;
  content: string;
  answer: number;
  // images, choices etc.
}

interface ExamPaperProps {
  title: string;
  instructor: string;
  problems: Problem[];
  layout: "1col" | "2col-top" | "2col-split" | "3col" | "masonry";
  padding: "small" | "medium" | "large";
  logoUrl: string | null;
}

const ExamPaperLayout = forwardRef<HTMLDivElement, ExamPaperProps>(
  ({ title, instructor, problems, layout, padding, logoUrl }, ref) => {
    
    // 여백 설정
    const paddingClass = 
      padding === 'small' ? 'p-4 gap-4' : 
      padding === 'large' ? 'p-12 gap-10' : 'p-8 gap-6';

    // 레이아웃 그리드 설정
    const getGridClass = () => {
      switch(layout) {
        case '1col': return 'grid-cols-1';
        case '2col-top': return 'grid-cols-2 items-start'; // 위쪽 정렬
        case '2col-split': return 'grid-cols-2 grid-rows-[auto_auto]'; // 4분할 느낌 (엄밀히는 페이지네이션 필요)
        case '3col': return 'grid-cols-3';
        case 'masonry': return 'columns-2 space-y-4 block'; // Masonry like (Tailwind columns)
        default: return 'grid-cols-2';
      }
    };

    return (
      // A4 사이즈 고정 (Print 시에만 적용되거나 화면에선 스케일링)
      <div ref={ref} className="w-[210mm] min-h-[297mm] bg-white text-black relative mx-auto print:w-full print:h-auto">
        
        {/* === Header === */}
        <header className="flex justify-between items-end border-b-2 border-black pb-2 mx-8 mt-8 mb-4">
           <div className="flex flex-col">
             {logoUrl && (
               <img src={logoUrl} alt="Academy Logo" className="h-10 object-contain mb-2 w-fit" />
             )}
             <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
           </div>
           <div className="text-right">
             <p className="text-sm font-bold text-gray-600 mb-1">{instructor} 선생님</p>
             {/* 학생 이름란 (밑줄) */}
             <div className="flex items-center gap-2">
                <span className="text-sm font-bold">성명 :</span>
                <div className="w-24 border-b border-black h-4"></div>
             </div>
           </div>
        </header>

        {/* === Problems Grid === */}
        <div className={`grid ${getGridClass()} ${paddingClass} mx-4`}>
          {problems.map((prob, idx) => (
            <div 
              key={prob.id} 
              className={`break-inside-avoid ${layout === '2col-split' ? 'border-b border-dashed border-gray-200 pb-4 mb-4' : ''}`}
            >
              <div className="flex gap-2">
                <span className="text-lg font-extrabold font-serif text-blue-900">{idx + 1}.</span>
                <div className="flex-1">
                   <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                     {prob.content}
                   </p>
                   {/* 문제 이미지 Placeholder */}
                   <div className="mt-4 w-full h-32 bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300 text-xs">
                      [문제 이미지 영역]
                   </div>
                   {/* 객관식 선지 Placeholder */}
                   <div className="mt-4 grid grid-cols-5 gap-1 text-xs">
                      <span>① 답안</span>
                      <span>② 답안</span>
                      <span>③ 답안</span>
                      <span>④ 답안</span>
                      <span>⑤ 답안</span>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* === Footer === */}
        <footer className="absolute bottom-0 left-0 right-0 h-16 flex items-center justify-center border-t border-gray-200 mx-8">
          <div className="flex items-center gap-2 opacity-50 grayscale">
            {/* 회사 로고 (Next.js Image 대신 img 태그 사용 - print 호환성) */}
            <img src="/images/logo.png" alt="RuleMakers" className="h-4" />
            <span className="text-xs font-bold tracking-widest">R&D by RuleMakers</span>
          </div>
        </footer>

      </div>
    );
  }
);

ExamPaperLayout.displayName = "ExamPaperLayout";
export default ExamPaperLayout;