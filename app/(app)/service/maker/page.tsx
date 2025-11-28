// app/service/maker/page.tsx

"use client";

import React, { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { useReactToPrint } from "react-to-print";
import { SCIENCE_UNITS } from "@/types/scienceUnits"; // 경로 확인 필요 (types/scienceUnits.ts 내용을 mockData에 두셨다면)
import { 
  Printer, Lock, ChevronDown, Filter, FileText, 
  LayoutTemplate, Image as ImageIcon, SaveIcon, ListOrdered 
} from "lucide-react";
import ExamPaperLayout, { ExamTemplateStyle, ExamProblem } from "@/components/ExamPaperLayout";
import { useAuth } from "@/context/AuthContext";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"; 
import { toast } from "react-hot-toast"; 
import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore"; 
import { useRouter, useSearchParams } from "next/navigation"; 

// [신규] Hook 및 Type 임포트
import { useProblemFetcher } from "@/hooks/useProblemFetcher";
import { Difficulty, QuestionType } from "@/types/problem";

// 템플릿 데이터
const TEMPLATES: ExamTemplateStyle[] = [
  { id: 'classic', name: '클래식 (기본)', headerHeight: '80px', columnGap: '10mm', fontFamily: 'ui-sans-serif, system-ui, sans-serif', borderColor: '#2563eb', headerStyle: 'simple' },
  { id: 'mock-exam', name: '실전 모의고사', headerHeight: '100px', columnGap: '8mm', fontFamily: '"Times New Roman", Batang, serif', borderColor: '#000000', headerStyle: 'box' },
  { id: 'clean', name: '미니멀 (깔끔)', headerHeight: '60px', columnGap: '15mm', fontFamily: 'Pretendard, AppleSDGothicNeo, sans-serif', borderColor: '#475569', headerStyle: 'detail' }
];

function ExamBuilderContent() {
  const { userData, user } = useAuth();
  const router = useRouter();
  const userPlan = userData?.plan || "BASIC";
  const searchParams = useSearchParams(); 
  const examId = searchParams.get("id");

  // --- State ---
  const [activeTab, setActiveTab] = useState<'filter' | 'order'>('filter');

  // 필터 상태
  const [difficulties, setDifficulties] = useState<Difficulty[]>(["중", "상"]);
  const [qTypes, setQTypes] = useState<QuestionType[]>(["객관식"]); // 현재는 DB에 유형 필드가 없으면 UI 용도로만 사용됨
  const [questionCount, setQuestionCount] = useState(20);
  
  // [신규] 단원 선택 상태
  const [selectedMajorTopics, setSelectedMajorTopics] = useState<string[]>([]);
  const [selectedMinorTopics, setSelectedMinorTopics] = useState<string[]>([]);

  // 메타데이터
  const [examTitle, setExamTitle] = useState("2025 1학기 중간고사 대비");
  const [instructorName, setInstructorName] = useState(userData?.name || "김룰메 선생님");
  const [academyLogo, setAcademyLogo] = useState<string | null>(null);

  // 레이아웃
  const [currentTemplate, setCurrentTemplate] = useState<ExamTemplateStyle>(TEMPLATES[0]);
  const [itemsPerPage, setItemsPerPage] = useState(4);

  // 시험지 문제 목록
  const [examProblems, setExamProblems] = useState<ExamProblem[]>([]);
  
  // 상태 플래그
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false); 

  // [신규] DB 문제 패칭 훅 연결
  const { problems: fetchedProblems, loading: isFetching } = useProblemFetcher({
    selectedMajorTopics,
    selectedMinorTopics,
    difficulties
  });

  // 1. 저장된 시험지 불러오기
  useEffect(() => {
    if (!examId) {
      setIsLoaded(true);
      return;
    }

    const loadExam = async () => {
      try {
        const docRef = doc(db, "saved_exams", examId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setExamTitle(data.title);
          setExamProblems(data.problems || []);
          setInstructorName(data.instructorName);
          const savedTemplate = TEMPLATES.find(t => t.id === data.templateId);
          if (savedTemplate) setCurrentTemplate(savedTemplate);
          toast.success("저장된 시험지를 불러왔습니다.");
        } else {
          toast.error("시험지를 찾을 수 없습니다.");
        }
      } catch (error) {
        console.error("로드 실패:", error);
        toast.error("불러오기 중 오류가 발생했습니다.");
      } finally {
        setIsLoaded(true);
      }
    };

    loadExam();
  }, [examId]);

  // 2. 필터 변경 시 문제 목록 업데이트 (자동 생성 모드)
  useEffect(() => {
    // 로딩 중이거나, 이미 저장된 시험지를 수정 중(문제가 이미 있음)인 경우 자동 덮어쓰기 방지
    // 단, 사용자가 명시적으로 '재생성'을 원할 수 있으므로, 
    // 여기서는 "문제가 0개이거나" 또는 "DB에서 새로 가져왔을 때" 업데이트하도록 함.
    // (실무적으로는 '문제 생성하기' 버튼을 따로 두는 것이 좋으나, 요청하신 자동 반응형으로 구현)
    
    if (!isLoaded) return;
    if (examId && examProblems.length > 0) return; 
    if (isFetching) return;

    // DB 데이터를 UI 포맷으로 변환
    const formatted: ExamProblem[] = fetchedProblems
      .slice(0, questionCount)
      .map((p, idx) => ({
        id: p.id,
        number: idx + 1,
        imageUrl: p.imgUrl, // DB 이미지
        content: p.content,
        difficulty: p.difficulty,
        majorTopic: p.majorTopic,
        minorTopic: p.minorTopic
      }));

    setExamProblems(formatted);

  }, [fetchedProblems, questionCount, isLoaded, examId, isFetching]); // 의존성 주의


  // 드래그 앤 드롭
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(examProblems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    const renumberedItems = items.map((item, index) => ({
      ...item,
      number: index + 1
    }));
    setExamProblems(renumberedItems);
  };

  // 저장 핸들러
  const handleSaveExam = async () => {
    if (!user) { toast.error("로그인이 필요합니다."); return; }
    if (examProblems.length === 0) { toast.error("문제가 없습니다."); return; }
    if (!examTitle.trim()) { toast.error("제목을 입력해주세요."); return; }

    setIsSaving(true);
    try {
      const cleanProblems = examProblems.map(p => ({
        ...p,
        imageUrl: p.imageUrl || null,
        content: p.content || null,
        difficulty: p.difficulty || null
      }));

      await addDoc(collection(db, "saved_exams"), {
        userId: user.uid,
        instructorName: instructorName || "선생님",
        title: examTitle,
        problems: cleanProblems,
        templateId: currentTemplate.id,
        createdAt: serverTimestamp(),
        problemCount: cleanProblems.length,
      });

      toast.success("보관함에 저장되었습니다!");
      if (confirm("보관함으로 이동하시겠습니까?")) router.push("/service/storage");
    } catch (error) {
      console.error("저장 실패:", error);
      toast.error("저장 중 오류가 발생했습니다.");
    }
    setIsSaving(false);
  };

  const pagedProblems = useMemo(() => {
    const pages: ExamProblem[][] = [];
    for (let i = 0; i < examProblems.length; i += itemsPerPage) {
      pages.push(examProblems.slice(i, i + itemsPerPage));
    }
    return pages;
  }, [examProblems, itemsPerPage]);

  const printRef = useRef<HTMLDivElement>(null);
  const triggerPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: examTitle,
  });

  const toggleDifficulty = (d: Difficulty) => {
    if (d === '킬러' && userPlan !== 'MAKERS') {
      toast.error("🔒 킬러 문항은 Maker's Plan 전용입니다.");
      return;
    }
    setDifficulties(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => setAcademyLogo(ev.target?.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center">로딩 중...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* === Left Sidebar === */}
      <aside className="w-80 flex-shrink-0 bg-white border-r border-gray-200 overflow-hidden flex flex-col z-20">
        <div className="p-5 border-b border-gray-100 flex-shrink-0">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            시험지 빌더
          </h1>
          <div className="flex mt-4 p-1 bg-gray-100 rounded-lg">
            <button onClick={() => setActiveTab('filter')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'filter' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>조건 설정</button>
            <button onClick={() => setActiveTab('order')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'order' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>순서 변경</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {activeTab === 'filter' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
              
              {/* [변경] 단원 선택 (DB 연동) */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Filter className="w-4 h-4" /> 단원 선택
                </h3>
                <div className="space-y-2">
                  {SCIENCE_UNITS.map((subject) => (
                    <div key={subject.name} className="mb-2">
                      <div className="text-xs font-bold text-gray-400 mb-1">{subject.name}</div>
                      {subject.majorTopics.map((major) => (
                        <details key={major.name} className="group mb-1 border rounded-md border-gray-100 bg-white">
                          <summary className="flex items-center justify-between text-sm cursor-pointer list-none p-2 hover:bg-gray-50 rounded-md">
                            <label className="flex items-center gap-2 cursor-pointer w-full">
                              <input 
                                type="checkbox"
                                checked={selectedMajorTopics.includes(major.name)}
                                onChange={(e) => {
                                  // e.preventDefault(); // summary 토글 방지하고 싶으면 사용
                                  setSelectedMajorTopics(prev => 
                                    prev.includes(major.name) ? prev.filter(t => t !== major.name) : [...prev, major.name]
                                  );
                                }}
                                className="rounded text-blue-600 w-4 h-4"
                              />
                              <span className={selectedMajorTopics.includes(major.name) ? "font-bold text-slate-800" : "text-slate-600"}>
                                {major.name.split('. ')[1] || major.name}
                              </span>
                            </label>
                            <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform"/>
                          </summary>
                          
                          <div className="pl-8 pr-2 pb-2 space-y-1 border-t border-gray-50 bg-gray-50/50">
                            {major.minorTopics.map((minor) => (
                              <label key={minor} className="flex items-center gap-2 py-1 cursor-pointer hover:text-blue-600">
                                <input 
                                  type="checkbox"
                                  checked={selectedMinorTopics.includes(minor)}
                                  onChange={() => {
                                    setSelectedMinorTopics(prev => 
                                      prev.includes(minor) ? prev.filter(t => t !== minor) : [...prev, minor]
                                    );
                                    // 소단원 선택 시 대단원 자동 선택
                                    if (!selectedMajorTopics.includes(major.name)) {
                                      setSelectedMajorTopics(prev => [...prev, major.name]);
                                    }
                                  }}
                                  className="rounded border-gray-300 text-blue-400 w-3 h-3"
                                />
                                <span className="text-xs text-gray-600">{minor}</span>
                              </label>
                            ))}
                          </div>
                        </details>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* 난이도 & 유형 */}
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
                      {level === '킬러' && userPlan !== 'MAKERS' && <Lock className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* 문항 수 슬라이더 */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm mb-2">
                  <span>문항 수 (최대 50)</span>
                  <span className="font-bold text-blue-600">{questionCount}문항</span>
                </div>
                <input type="range" min="4" max="50" step="1" value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </div>

              {/* 템플릿 선택 */}
              <div className="pt-4 border-t border-gray-100">
                 <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><LayoutTemplate className="w-4 h-4"/> 서식 디자인</h3>
                 <div className="grid grid-cols-1 gap-2">
                   {TEMPLATES.map(t => (
                     <button key={t.id} onClick={() => setCurrentTemplate(t)} className={`flex items-center gap-3 p-2 rounded-lg border text-left transition-all ${currentTemplate.id === t.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                       <div className="text-sm font-bold text-slate-800">{t.name}</div>
                     </button>
                   ))}
                 </div>
              </div>

            </div>
          )}

          {activeTab === 'order' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><ListOrdered className="w-4 h-4"/> 순서 변경</h3>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="exam-problems">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 pb-4">
                      {examProblems.map((prob, index) => (
                        <Draggable key={prob.id} draggableId={prob.id} index={index}>
                          {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={`p-3 bg-white border rounded-lg flex items-center gap-3 shadow-sm ${snapshot.isDragging ? 'shadow-lg border-blue-500 z-50' : 'border-gray-200'}`}>
                              <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-slate-100 rounded-full text-xs font-bold text-slate-500">{prob.number}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-900 font-medium truncate">{prob.content || "문제 내용 없음"}</p>
                                <span className="text-[10px] text-gray-400 bg-gray-50 px-1 rounded">{prob.difficulty}</span>
                              </div>
                              <span className="text-gray-300">⠿</span>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          )}
        </div>
      </aside>

      {/* === Main Area === */}
      <main className="flex-1 flex flex-col h-full bg-slate-200/50 relative">
        {isFetching && (
          <div className="absolute inset-0 bg-white/50 z-50 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
            <span className="text-sm font-bold text-blue-600">문제를 불러오고 있습니다...</span>
          </div>
        )}

        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-6">
            <input type="text" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} className="font-bold text-lg text-gray-800 outline-none bg-transparent placeholder-gray-300 min-w-[200px]" placeholder="시험지 제목 입력" />
            <input type="text" value={instructorName} onChange={(e) => setInstructorName(e.target.value)} className="text-sm font-medium text-gray-600 outline-none bg-transparent" placeholder="선생님 성함" />
            <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-xs text-gray-700 transition-colors">
              <ImageIcon className="w-3 h-3" /> {academyLogo ? "로고 변경" : "학원 로고"}
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
          </div>
          <div className="flex gap-3">
             <button onClick={handleSaveExam} disabled={isSaving} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-md transition-all active:scale-95 disabled:opacity-50">
               <SaveIcon className="w-4 h-4" /> {isSaving ? "저장 중..." : "보관함 저장"}
             </button>
             <button onClick={() => triggerPrint()} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold shadow-lg shadow-slate-200 transition-all active:scale-95">
               <Printer className="w-4 h-4" /> PDF 출력
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent bg-slate-100">
          <div className="flex flex-col items-center gap-8 pb-20">
             <ExamPaperLayout 
               ref={printRef}
               pages={pagedProblems} 
               title={examTitle}
               instructor={instructorName}
               template={currentTemplate}
             />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ExamBuilderPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">페이지 로딩 중...</div>}>
      <ExamBuilderContent />
    </Suspense>
  );
}