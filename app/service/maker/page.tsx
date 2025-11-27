// app/service/maker/page.tsx

"use client";

import React, { useState, useRef, useMemo } from "react";
import { useReactToPrint } from "react-to-print";
import { SCIENCE_UNITS, MOCK_PROBLEMS, Difficulty, QuestionType } from "@/data/mockData";
import { 
  Printer, Lock, ChevronDown, Filter, FileText, 
  LayoutTemplate, Image as ImageIcon, RefreshCw, Settings 
} from "lucide-react";
import ExamPaperLayout, { ExamTemplateStyle, ExamProblem } from "@/components/ExamPaperLayout";
import { useAuth } from "@/context/AuthContext";

// --- 서식(Template) 프리셋 (Turn 3 유지) ---
const TEMPLATES: ExamTemplateStyle[] = [
  {
    id: 'classic',
    name: '클래식 (기본)',
    headerHeight: '80px',
    columnGap: '10mm',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    borderColor: '#2563eb', // Blue
    headerStyle: 'simple'
  },
  {
    id: 'mock-exam',
    name: '실전 모의고사',
    headerHeight: '100px',
    columnGap: '8mm',
    fontFamily: '"Times New Roman", Batang, serif',
    borderColor: '#000000',
    headerStyle: 'box'
  },
  {
    id: 'clean',
    name: '미니멀 (깔끔)',
    headerHeight: '60px',
    columnGap: '15mm',
    fontFamily: 'Pretendard, AppleSDGothicNeo, sans-serif',
    borderColor: '#475569', // Slate-600
    headerStyle: 'detail'
  }
];

export default function ExamBuilderPage() {
  const { userData } = useAuth();
  // 사용자 플랜 확인
  const userPlan = userData?.plan || "BASIC"; 

  // --- State (Turn 1 필터 상태 복원) ---
  // 1. 단원 & 필터
  const [selectedUnit, setSelectedUnit] = useState<string[]>([]);
  const [difficulties, setDifficulties] = useState<Difficulty[]>(["중", "상"]);
  const [qTypes, setQTypes] = useState<QuestionType[]>(["객관식"]);
  const [excludeRecent, setExcludeRecent] = useState(false);
  const [questionCount, setQuestionCount] = useState(20);

  // 2. 메타데이터 & 디자인
  const [examTitle, setExamTitle] = useState("2025 1학기 중간고사 대비");
  const [instructorName, setInstructorName] = useState(userData?.name || "김룰메 선생님");
  const [academyLogo, setAcademyLogo] = useState<string | null>(null);

  // 3. 레이아웃 (Turn 3 방식 적용)
  const [currentTemplate, setCurrentTemplate] = useState<ExamTemplateStyle>(TEMPLATES[0]);
  const [itemsPerPage, setItemsPerPage] = useState(4); // 페이지당 문항 수

  // --- Logic: Data Processing ---
  
  // 1. 필터링 로직 (Turn 1 로직 복원 + qType 적용)
  const rawProblems = useMemo(() => {
    let result = MOCK_PROBLEMS.filter(p => difficulties.includes(p.difficulty as Difficulty));

    // [복원] 유형 필터 (데이터에 type 필드가 있다고 가정하거나, 예시로 적용)
    // result = result.filter(p => qTypes.includes(p.type)); 

    // [복원] 킬러 문항 제한 로직 (User Plan 체크)
    if (userPlan !== "MAKERS") {
      result = result.filter(p => p.difficulty !== "킬러");
    }

    // [복원] 최신 문항 제외 로직 (Mock)
    if (excludeRecent) {
        // 날짜 필터링 로직 예시
    }

    return result.slice(0, questionCount);
  }, [difficulties, qTypes, excludeRecent, questionCount, userPlan]);

  // 2. ExamProblem 형식 변환 (이미지 처리)
  const formattedProblems: ExamProblem[] = useMemo(() => {
    return rawProblems.map((p, idx) => ({
      id: p.id,
      number: idx + 1,
      // 예시용 이미지 로직
      imageUrl: idx % 2 === 0 ? "/images/123.png" : undefined,
      content: p.content,
      difficulty: p.difficulty
    }));
  }, [rawProblems]);

  // 3. 페이지 분할 (Pagination)
  const pagedProblems: ExamProblem[][] = useMemo(() => {
    const pages: ExamProblem[][] = [];
    for (let i = 0; i < formattedProblems.length; i += itemsPerPage) {
      pages.push(formattedProblems.slice(i, i + itemsPerPage));
    }
    return pages;
  }, [formattedProblems, itemsPerPage]);


  // --- Handlers (Turn 1 핸들러 복원) ---
  const handlePrint = useReactToPrint({
    contentRef: useRef<HTMLDivElement>(null),
    documentTitle: examTitle,
  });
  // ※ ref는 아래 JSX에서 바로 연결하기 위해 변수로 따로 뺍니다.
  const printRef = useRef<HTMLDivElement>(null);
  
  // 수정된 useReactToPrint 호출
  const triggerPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: examTitle,
  });

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
      
      {/* === Left Sidebar: Filters & Config (Turn 1 UI 복원) === */}
      <aside className="w-80 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto scrollbar-hide z-20">
        <div className="p-5 border-b border-gray-100">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            시험지 빌더
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${userPlan === 'MAKERS' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
              {userPlan} PLAN
            </span>
            <p className="text-xs text-gray-500">나만의 시험지를 구성하세요.</p>
          </div>
        </div>

        <div className="p-5 space-y-8">
          {/* 1. 단원 선택 (복원됨) */}
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

          {/* 2. 난이도 및 유형 (복원됨 - 킬러 락 포함) */}
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
                  {/* 킬러 문항 잠금 아이콘 */}
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

          {/* 3. 옵션 (복원됨 - 최신 제외, 문항 수) */}
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
                type="range" min="4" max="50" step="1" 
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>

          {/* 4. [신규 통합] 서식 디자인 (Turn 3 기능) */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4" /> 서식 디자인
            </h3>
            <div className="grid grid-cols-1 gap-2">
               {TEMPLATES.map(t => (
                 <button 
                   key={t.id}
                   onClick={() => setCurrentTemplate(t)}
                   className={`flex items-center gap-3 p-2 rounded-lg border text-left transition-all
                     ${currentTemplate.id === t.id 
                       ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                       : 'border-gray-200 hover:bg-gray-50'}`}
                 >
                   <div className={`w-8 h-10 border bg-white shadow-sm flex items-center justify-center text-[8px] text-gray-300`}
                        style={{ fontFamily: t.fontFamily }}>Aa</div>
                   <div>
                     <div className="text-sm font-bold text-slate-800">{t.name}</div>
                   </div>
                 </button>
               ))}
            </div>
          </div>

          {/* 5. [신규 통합] 페이지 설정 (Turn 3 기능) */}
          <div>
            <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
               <span className="text-sm text-gray-700 font-bold">페이지당 문항</span>
               <div className="flex items-center gap-2">
                  <button onClick={() => setItemsPerPage(Math.max(2, itemsPerPage - 1))} className="w-6 h-6 bg-white border rounded hover:bg-gray-100">-</button>
                  <span className="text-sm font-bold w-4 text-center">{itemsPerPage}</span>
                  <button onClick={() => setItemsPerPage(Math.min(8, itemsPerPage + 1))} className="w-6 h-6 bg-white border rounded hover:bg-gray-100">+</button>
               </div>
            </div>
          </div>

          {/* Maker's Plan Promo (Basic 유저에게만 보임 - 복원됨) */}
          {userPlan !== 'MAKERS' && (
             <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white shadow-lg mt-4">
               <h4 className="font-bold text-sm flex items-center gap-1">
                 <Lock className="w-3 h-3" /> Maker's Plan 전용
               </h4>
               <p className="text-xs mt-1 opacity-90">
                 킬러 문항 무제한 & 요청서 코인 3회 제공!
               </p>
             </div>
          )}
        </div>
      </aside>

      {/* === Main Area: Preview (Turn 3 Layout 기능 사용) === */}
      <main className="flex-1 flex flex-col h-full bg-slate-100/50">
        
        {/* Top Toolbar (Turn 1의 로고 업로드 + Turn 3의 깔끔함 결합) */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Title</label>
              <input 
                type="text" value={examTitle} 
                onChange={(e) => setExamTitle(e.target.value)}
                className="font-bold text-lg text-gray-800 outline-none bg-transparent placeholder-gray-300 min-w-[200px]"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Instructor</label>
              <input 
                type="text" value={instructorName} 
                onChange={(e) => setInstructorName(e.target.value)}
                className="text-sm font-medium text-gray-600 outline-none bg-transparent"
              />
            </div>
            {/* 로고 업로드 버튼 (Turn 1 기능 복원) */}
            <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-xs text-gray-700 transition-colors">
              <ImageIcon className="w-3 h-3" />
              {academyLogo ? "로고 변경" : "학원 로고"}
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
          </div>

          <div className="flex gap-3">
             <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">
               <RefreshCw className="w-4 h-4" /> 새로고침
             </button>
             <button 
               onClick={() => triggerPrint()}
               className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold shadow-lg shadow-slate-200 transition-all active:scale-95"
             >
               <Printer className="w-4 h-4" /> PDF 저장
             </button>
          </div>
        </header>

        {/* Preview Canvas (Turn 3 Paged Layout 유지) */}
        <div className="flex-1 overflow-y-auto p-10 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <div className="flex flex-col items-center pb-20">
             <div className="transition-transform duration-200 ease-in-out">
               {/* Turn 3에서 만든 ExamPaperLayout은 'pages' prop을 받습니다.
                 Turn 1의 필터링 결과(filteredProblems)를 페이지네이션 로직(pagedProblems)을 거쳐 전달합니다.
               */}
               <ExamPaperLayout 
                 ref={printRef}
                 pages={pagedProblems} 
                 title={examTitle}
                 instructor={instructorName}
                 template={currentTemplate}
                 // logoUrl prop은 ExamPaperLayout 수정 시 추가 필요 (현재 Turn 3 코드엔 없음)
                 // 필요하다면 ExamPaperLayout의 Props에 logoUrl?: string을 추가하세요.
               />
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}