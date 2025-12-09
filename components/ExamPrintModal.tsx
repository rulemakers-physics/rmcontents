// components/ExamPrintModal.tsx

"use client";

import { useRef, useState, useMemo } from "react";
import { useReactToPrint } from "react-to-print";
import { XMarkIcon, PrinterIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import ExamPaperLayout from "@/components/ExamPaperLayout";
import { TEMPLATES, LayoutMode } from "@/types/examTemplates";
import { SavedExam, PrintOptions } from "@/types/exam";

interface Props {
  exam: SavedExam;
  onClose: () => void;
}

export default function ExamPrintModal({ exam, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  
  // [수정] 인쇄 요소(섹션) 체크박스 상태만 관리
  const [sections, setSections] = useState({
    questions: true,
    answers: true,
    solutions: true,
  });

  // [핵심] 레이아웃 옵션은 exam prop에서 상속받거나 고정값 사용
  const printOptions: PrintOptions = {
    questions: sections.questions,
    answers: sections.answers,
    solutions: sections.solutions,
    
    // 저장된 값이 있으면 사용, 없으면 기본값 (40px)
    questionPadding: exam.questionPadding ?? 40,
    
    // 저장된 모드가 있으면 사용, 없으면 'dense'(기본)
    layoutMode: exam.layoutMode ?? 'dense' 
  };

  // 템플릿 로드
  const template = useMemo(() => {
    return TEMPLATES.find(t => t.id === exam.templateId) || TEMPLATES[0];
  }, [exam.templateId]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: exam.title,
  });

  const toggleSection = (key: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // 현재 레이아웃 모드 이름 (UI 표시용)
  const getLayoutName = (mode: LayoutMode) => {
    if (mode === 'split-2') return '2단 분할';
    if (mode === 'split-4') return '4단 분할';
    return '기본(빼곡)';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-7xl h-[95vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* 1. 헤더 */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <PrinterIcon className="w-6 h-6 text-indigo-600" />
              인쇄 미리보기
            </h2>
            <p className="text-sm text-slate-500 mt-1 pl-8">
              {exam.title} <span className="text-slate-300">|</span> {getLayoutName(printOptions.layoutMode)} 모드
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handlePrint && handlePrint()}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-lg transition-all active:scale-95"
            >
              <PrinterIcon className="w-5 h-5" /> 인쇄하기
            </button>
            <button 
              onClick={onClose} 
              className="p-2.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          
          {/* 2. 사이드바: 옵션 설정 (간소화됨) */}
          <div className="w-72 bg-slate-50 border-r border-slate-200 p-6 flex flex-col gap-8 overflow-y-auto shrink-0">
            
            {/* 출력 요소 선택 */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
                <CheckCircleIcon className="w-4 h-4 text-indigo-600" /> 출력 요소 선택
              </h3>
              <div className="space-y-3">
                <OptionCheckbox 
                  label="문제지 (Questions)" 
                  checked={sections.questions} 
                  onChange={() => toggleSection('questions')} 
                />
                <OptionCheckbox 
                  label="정답표 (Answers)" 
                  checked={sections.answers} 
                  onChange={() => toggleSection('answers')} 
                />
                <OptionCheckbox 
                  label="해설지 (Solutions)" 
                  checked={sections.solutions} 
                  onChange={() => toggleSection('solutions')} 
                />
              </div>
            </div>

            {/* 안내 문구 */}
            <div className="mt-auto p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 leading-relaxed">
              <p className="font-bold mb-1">ℹ️ Layout Info</p>
              이 시험지는 <strong>{getLayoutName(printOptions.layoutMode)}</strong>로 설정되어 있습니다.
              <br/><br/>
              문항 간격과 배치는 시험지 생성 시 설정된 값을 따르며, 여기서는 수정할 수 없습니다.
            </div>
          </div>

          {/* 3. 메인: 미리보기 영역 */}
          <div className="flex-1 bg-slate-200/50 overflow-y-auto p-8 flex justify-center custom-scrollbar">
            <div className="shadow-2xl h-fit bg-white">
               {/* 실제 출력될 컴포넌트 (설정값 전달) */}
               {/* [수정] academyLogo 전달 */}
               <ExamPaperLayout 
                 ref={printRef}
                 problems={exam.problems || []}
                 title={exam.title}
                 instructor={exam.instructorName}
                 template={template}
                 printOptions={printOptions}
                 isTeacherVersion={false} 
                 academyLogo={exam.academyLogo} // [신규] 전달
               />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function OptionCheckbox({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) {
  return (
    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
      checked 
        ? 'bg-white border-indigo-500 ring-1 ring-indigo-500 shadow-sm' 
        : 'bg-slate-100 border-transparent hover:bg-white hover:border-slate-300'
    }`}>
      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
        checked ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'
      }`}>
        {checked && (
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <input type="checkbox" checked={checked} onChange={onChange} className="hidden" />
      <span className={`text-sm font-bold ${checked ? 'text-indigo-900' : 'text-slate-500'}`}>{label}</span>
    </label>
  );
}