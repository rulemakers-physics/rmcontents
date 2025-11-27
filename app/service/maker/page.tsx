// app/service/maker/page.tsx

"use client";

import React, { useState, useRef, useMemo } from "react";
import { useReactToPrint } from "react-to-print";
import { SCIENCE_UNITS, MOCK_PROBLEMS, Difficulty, QuestionType } from "@/data/mockData";
import { 
  Printer, Lock, ChevronDown, Filter, FileText, 
  LayoutTemplate, Image as ImageIcon, RefreshCw 
} from "lucide-react";
import ExamPaperLayout from "@/components/ExamPaperLayout";
import { useAuth } from "@/context/AuthContext"; // AuthContext import

export default function ExamBuilderPage() {
  // ✅ 1. Hook은 반드시 컴포넌트 안에서 호출해야 합니다.
  const { userData } = useAuth(); 
  
  // ✅ 2. 사용자 플랜 확인 (데이터가 없으면 BASIC으로 처리)
  const userPlan = userData?.plan || "BASIC"; 

  // --- State: Filters ---
  const [selectedUnit, setSelectedUnit] = useState<string[]>([]);
  const [difficulties, setDifficulties] = useState<Difficulty[]>(["중", "상"]);
  const [qTypes, setQTypes] = useState<QuestionType[]>(["객관식"]);
  const [excludeRecent, setExcludeRecent] = useState(false);
  const [questionCount, setQuestionCount] = useState(20);

  // --- State: Layout & Content ---
  const [examTitle, setExamTitle] = useState("2025 1학기 중간고사 대비");
  // 강사명이 있다면 자동으로 채워주기
  const [instructorName, setInstructorName] = useState(userData?.name || "김룰메 선생님");
  const [layoutMode, setLayoutMode] = useState<"1col" | "2col-top" | "2col-split" | "3col" | "masonry">("2col-top");
  const [paddingSize, setPaddingSize] = useState<"small" | "medium" | "large">("medium");
  const [academyLogo, setAcademyLogo] = useState<string | null>(null);

  // --- Logic: Filtering ---
  const filteredProblems = useMemo(() => {
    let result = MOCK_PROBLEMS.filter(p => difficulties.includes(p.difficulty as Difficulty));
    
    // 🔒 킬러 문항 제한 로직 적용
    if (userPlan !== "MAKERS") {
      // 킬러를 선택했더라도 실제 결과에서는 제외
      result = result.filter(p => p.difficulty !== "킬러");
    }
    
    return result.slice(0, questionCount);
  }, [difficulties, questionCount, userPlan]);

  // --- Print Handler ---
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: examTitle,
  });

  // --- Handlers ---
  const toggleDifficulty = (d: Difficulty) => {
    // 🔒 킬러 선택 시 권한 체크
    if (d === '킬러' && userPlan !== 'MAKERS') {
      alert("🔒 킬러 문항은 Maker's Plan 전용 기능입니다.\n구독을 업그레이드하거나 무료 체험권을 사용해보세요!");
      return;
    }
    setDifficulties(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const toggleQType = (t: QuestionType) => {
    setQTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => setAcademyLogo(ev.target?.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* === Left Sidebar: Configuration === */}
      <aside className="w-80 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto scrollbar-hide">
        <div className="p-5 border-b border-gray-100">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            문제은행 빌더
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${userPlan === 'MAKERS' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
              {userPlan} PLAN
            </span>
            <p className="text-xs text-gray-500">나만의 시험지를 구성하세요.</p>
          </div>
        </div>

        <div className="p-5 space-y-8">
          {/* 1. 단원 선택 */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4" /> 단원 선택
            </h3>
            <div className="space-y-2">
              {SCIENCE_UNITS.map((subject) => (
                <details key={subject.name} className="group">
                  <summary className="flex items-center justify-between text-sm font-medium cursor-pointer list-none p-2 hover:bg-gray-50 rounded-md">
                    {subject.name}
                    <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180"/>
                  </summary>
                  <div className="pl-4 mt-2 space-y-1 text-sm text-gray-600">
                    {subject.majorTopics.map(topic => (
                      <label key={topic.name} className="flex items-center gap-2 p-1 hover:bg-blue-50 rounded cursor-pointer">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                        {topic.name.split('. ')[1]}
                      </label>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* 2. 난이도 및 유형 */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">난이도 & 유형</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {['기본', '하', '중', '상', '킬러'].map((level) => (
                <button
                  key={level}
                  onClick={() => toggleDifficulty(level as Difficulty)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1
                    ${difficulties.includes(level as Difficulty) 
                      ? 'bg-slate-900 text-white border-slate-900' 
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
                >
                  {level}
                  {/* 킬러 문항 잠금 아이콘 표시 */}
                  {level === '킬러' && userPlan !== 'MAKERS' && <Lock className="w-3 h-3" />}
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              {['객관식', '서답형'].map((type) => (
                <label key={type} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={qTypes.includes(type as QuestionType)}
                    onChange={() => toggleQType(type as QuestionType)}
                    className="rounded border-gray-300 text-blue-600" 
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          {/* 3. 옵션 */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input 
                type="checkbox" 
                checked={excludeRecent}
                onChange={(e) => setExcludeRecent(e.target.checked)}
                className="rounded border-gray-300 text-blue-600" 
              />
              한 달 이내 출제 문항 제외
            </label>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>문항 수</span>
                <span className="font-bold text-blue-600">{questionCount}문항</span>
              </div>
              <input 
                type="range" min="5" max="50" step="1" 
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>

          {/* 4. 레이아웃 설정 */}
          <div>
             <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4" /> 시험지 레이아웃
            </h3>
            <select 
              value={layoutMode}
              onChange={(e) => setLayoutMode(e.target.value as any)}
              className="w-full p-2 mb-3 text-sm border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1col">1단 (한 열에 하나)</option>
              <option value="2col-top">2단 (위쪽 정렬)</option>
              <option value="2col-split">2단 (4분할 정렬)</option>
              <option value="3col">3단 (6분할 정렬)</option>
              <option value="masonry">여백 최적화 (Masonry)</option>
            </select>
            
            <div className="flex gap-2 text-xs">
              {['small', 'medium', 'large'].map((size) => (
                <button
                  key={size}
                  onClick={() => setPaddingSize(size as any)}
                  className={`flex-1 py-1 rounded border transition-colors ${paddingSize === size ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  여백 {size === 'small' ? '좁게' : size === 'medium' ? '보통' : '넓게'}
                </button>
              ))}
            </div>
          </div>

          {/* Maker's Plan Promo (Basic 유저에게만 보임) */}
          {userPlan !== 'MAKERS' && (
             <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
               <h4 className="font-bold text-sm flex items-center gap-1">
                 <Lock className="w-3 h-3" /> Maker's Plan 전용
               </h4>
               <p className="text-xs mt-1 opacity-90">
                 킬러 문항 무제한 & 요청서 코인 3회 제공!
               </p>
               <button className="mt-3 w-full py-1.5 bg-white/20 hover:bg-white/30 rounded text-xs font-bold transition-colors">
                 무료 체험권 사용하기
               </button>
             </div>
          )}
        </div>
      </aside>

      {/* === Main Area: Preview === */}
      <main className="flex-1 flex flex-col h-full">
        {/* Top Toolbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <label className="text-[10px] text-gray-400 font-bold uppercase">시험지 제목</label>
              <input 
                type="text" value={examTitle} 
                onChange={(e) => setExamTitle(e.target.value)}
                className="font-bold text-gray-800 outline-none border-b border-transparent hover:border-gray-300 focus:border-blue-500 transition-colors w-64"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] text-gray-400 font-bold uppercase">강사명</label>
              <input 
                type="text" value={instructorName} 
                onChange={(e) => setInstructorName(e.target.value)}
                className="text-sm text-gray-600 outline-none border-b border-transparent hover:border-gray-300 focus:border-blue-500 transition-colors w-32"
              />
            </div>
            <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-xs text-gray-700 transition-colors">
              <ImageIcon className="w-3 h-3" />
              {academyLogo ? "로고 변경" : "학원 로고 업로드"}
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
          </div>

          <div className="flex gap-3">
             <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900">
               <RefreshCw className="w-4 h-4" /> 문제 재구성
             </button>
             <button 
               onClick={handlePrint}
               className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition-transform active:scale-95"
             >
               <Printer className="w-4 h-4" /> PDF 출력 / 저장
             </button>
          </div>
        </header>

        {/* Preview Canvas (Scrollable) */}
        <div className="flex-1 overflow-auto bg-gray-100 p-8 flex justify-center">
          {/* A4 Paper Ratio Container */}
          <div className="shadow-2xl">
             <ExamPaperLayout 
               ref={printRef}
               title={examTitle}
               instructor={instructorName}
               problems={filteredProblems}
               layout={layoutMode}
               padding={paddingSize}
               logoUrl={academyLogo}
             />
          </div>
        </div>
      </main>
    </div>
  );
}