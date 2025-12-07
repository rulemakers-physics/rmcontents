// components/ExamPrintModal.tsx

"use client";

import { useRef, useState, useMemo } from "react";
import { useReactToPrint } from "react-to-print";
import { XMarkIcon, PrinterIcon, CheckCircleIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
import ExamPaperLayout, { PrintOptions } from "@/components/ExamPaperLayout";
import { TEMPLATES } from "@/types/examTemplates";

interface SavedExam {
  id: string;
  title: string;
  instructorName: string;
  problems?: any[];
  templateId?: string; // 저장된 템플릿 ID
}

interface Props {
  exam: SavedExam;
  onClose: () => void;
}

export default function ExamPrintModal({ exam, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  
  // 인쇄 옵션 상태 (기본값 설정)
  const [printOptions, setPrintOptions] = useState<PrintOptions>({
    questions: true,
    answers: true,
    solutions: true,
    questionPadding: 40,
    solutionPadding: 20
  });

  // 저장된 템플릿이 있으면 적용, 없으면 기본값
  const template = useMemo(() => {
    return TEMPLATES.find(t => t.id === exam.templateId) || TEMPLATES[0];
  }, [exam.templateId]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: exam.title,
  });

  const toggleOption = (key: keyof PrintOptions) => {
    setPrintOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-7xl h-[95vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* 1. 헤더 */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <PrinterIcon className="w-6 h-6 text-indigo-600" />
              인쇄 미리보기 & 옵션 설정
            </h2>
            <p className="text-sm text-slate-500 mt-1 pl-8">
              {exam.title} <span className="text-slate-300">|</span> 총 {exam.problems?.length || 0}문항
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
          
          {/* 2. 사이드바: 옵션 설정 */}
          <div className="w-80 bg-slate-50 border-r border-slate-200 p-6 flex flex-col gap-8 overflow-y-auto shrink-0">
            
            {/* 출력 요소 선택 */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
                <CheckCircleIcon className="w-4 h-4 text-indigo-600" /> 출력 요소
              </h3>
              <div className="space-y-3">
                <OptionCheckbox 
                  label="문제지 (Questions)" 
                  checked={printOptions.questions} 
                  onChange={() => toggleOption('questions')} 
                />
                <OptionCheckbox 
                  label="정답표 (Answers)" 
                  checked={printOptions.answers} 
                  onChange={() => toggleOption('answers')} 
                />
                <OptionCheckbox 
                  label="해설지 (Solutions)" 
                  checked={printOptions.solutions} 
                  onChange={() => toggleOption('solutions')} 
                />
              </div>
            </div>

            {/* 여백 설정 */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Cog6ToothIcon className="w-4 h-4 text-slate-500" /> 레이아웃 조정
              </h3>
              <div className="space-y-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <div className="flex justify-between text-xs mb-2 text-slate-600 font-medium">
                    <span>문제 간격</span>
                    <span className="text-indigo-600">{printOptions.questionPadding}px</span>
                  </div>
                  <input 
                    type="range" min="10" max="100" step="5" 
                    value={printOptions.questionPadding} 
                    onChange={(e) => setPrintOptions(prev => ({...prev, questionPadding: Number(e.target.value)}))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2 text-slate-600 font-medium">
                    <span>해설 간격</span>
                    <span className="text-indigo-600">{printOptions.solutionPadding}px</span>
                  </div>
                  <input 
                    type="range" min="5" max="100" step="5" 
                    value={printOptions.solutionPadding} 
                    onChange={(e) => setPrintOptions(prev => ({...prev, solutionPadding: Number(e.target.value)}))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                  />
                </div>
              </div>
            </div>

            <div className="mt-auto p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-800 leading-relaxed">
              <p className="font-bold mb-1">💡 Tip</p>
              오른쪽 미리보기 화면에서 레이아웃이 깨지지 않는지 확인한 후 인쇄하세요.
            </div>
          </div>

          {/* 3. 메인: 미리보기 영역 */}
          <div className="flex-1 bg-slate-200/50 overflow-y-auto p-8 flex justify-center custom-scrollbar">
            <div className="shadow-2xl h-fit bg-white">
               {/* 실제 출력될 컴포넌트 */}
               <ExamPaperLayout 
                 ref={printRef}
                 problems={exam.problems || []}
                 title={exam.title}
                 instructor={exam.instructorName}
                 template={template}
                 printOptions={printOptions}
                 isTeacherVersion={false} 
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