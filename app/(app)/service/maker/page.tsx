// app/service/maker/page.tsx

"use client";

import React, { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { useReactToPrint } from "react-to-print";
import { SCIENCE_UNITS, MOCK_PROBLEMS, Difficulty, QuestionType } from "@/data/mockData";
import { 
  Printer, Lock, ChevronDown, Filter, FileText, 
  LayoutTemplate, Image as ImageIcon, RefreshCw, ListOrdered // [추가] 아이콘
} from "lucide-react";
import ExamPaperLayout, { ExamTemplateStyle, ExamProblem } from "@/components/ExamPaperLayout";
import { useAuth } from "@/context/AuthContext";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"; // [추가]
import { toast } from "react-hot-toast"; // [추가]
import { db } from "@/lib/firebase"; // [추가]
import { collection, addDoc, serverTimestamp } from "firebase/firestore"; // [추가]
import { useRouter, useSearchParams } from "next/navigation"; // [추가]
import { SaveIcon } from "lucide-react"; // [추가] 아이콘
import { doc, getDoc } from "firebase/firestore";

// 템플릿 데이터 (기존과 동일)
const TEMPLATES: ExamTemplateStyle[] = [
  { id: 'classic', name: '클래식 (기본)', headerHeight: '80px', columnGap: '10mm', fontFamily: 'ui-sans-serif, system-ui, sans-serif', borderColor: '#2563eb', headerStyle: 'simple' },
  { id: 'mock-exam', name: '실전 모의고사', headerHeight: '100px', columnGap: '8mm', fontFamily: '"Times New Roman", Batang, serif', borderColor: '#000000', headerStyle: 'box' },
  { id: 'clean', name: '미니멀 (깔끔)', headerHeight: '60px', columnGap: '15mm', fontFamily: 'Pretendard, AppleSDGothicNeo, sans-serif', borderColor: '#475569', headerStyle: 'detail' }
];

function ExamBuilderContent() {
  const { userData, user } = useAuth();
  const router = useRouter();
  const userPlan = userData?.plan || "BASIC";
  const searchParams = useSearchParams(); // [신규] URL 파라미터 훅
  const examId = searchParams.get("id");  // [신규] ?id=... 가져오기

  // --- State ---
  // [신규] 사이드바 탭 상태 ('filter' | 'order')
  const [activeTab, setActiveTab] = useState<'filter' | 'order'>('filter');

  // 필터 상태
  const [difficulties, setDifficulties] = useState<Difficulty[]>(["중", "상"]);
  const [qTypes, setQTypes] = useState<QuestionType[]>(["객관식"]);
  const [excludeRecent, setExcludeRecent] = useState(false);
  const [questionCount, setQuestionCount] = useState(20);
  
  // 메타데이터
  const [examTitle, setExamTitle] = useState("2025 1학기 중간고사 대비");
  const [instructorName, setInstructorName] = useState(userData?.name || "김룰메 선생님");
  const [academyLogo, setAcademyLogo] = useState<string | null>(null);

  // 레이아웃
  const [currentTemplate, setCurrentTemplate] = useState<ExamTemplateStyle>(TEMPLATES[0]);
  const [itemsPerPage, setItemsPerPage] = useState(4);

  // [중요] 선택된 문제 목록 (순서 변경 가능하도록 State로 관리)
  const [examProblems, setExamProblems] = useState<ExamProblem[]>([]);
  
  // [신규] 저장 중 상태
  const [isSaving, setIsSaving] = useState(false);

  const [isLoaded, setIsLoaded] = useState(false); // [신규] 로딩 완료 여부

  // [신규] 저장된 시험지 불러오기 (마운트 시 1회 실행)
  useEffect(() => {
    if (!examId) {
      setIsLoaded(true); // id가 없으면 바로 '로딩됨' 처리 (기본 모드)
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
          // 템플릿 복원 로직이 필요하다면 여기에 추가 (예: data.templateId로 찾기)
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
        setIsLoaded(true); // 로딩 끝
      }
    };

    loadExam();
  }, [examId]);

  // [수정] 1. 필터 변경 시 문제 목록 업데이트
  // -> 저장된 시험지를 수정 중일 때는 필터가 맘대로 덮어쓰면 안 됨!
  useEffect(() => {
    if (!isLoaded) return; // 로딩 중이면 대기
    if (examId && examProblems.length > 0) return; // [중요] 수정 모드이고, 이미 문제가 있다면 자동 생성 방지
    let result = MOCK_PROBLEMS.filter(p => difficulties.includes(p.difficulty as Difficulty));
    // result = result.filter(p => qTypes.includes(p.type)); // 실제 데이터 구조에 맞게 주석 해제
    if (userPlan !== "MAKERS") {
      result = result.filter(p => p.difficulty !== "킬러");
    }
    
    // 갯수 제한 후 포맷팅
    const sliced = result.slice(0, questionCount);
    const formatted = sliced.map((p, idx) => ({
      id: p.id,
      number: idx + 1,
      imageUrl: idx % 2 === 0 ? "/images/123.png" : null, // 예시 이미지
      content: p.content,
      difficulty: p.difficulty
    }));

    setExamProblems(formatted);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulties, qTypes, excludeRecent, questionCount, userPlan, isLoaded]); // 의존성 배열 주의
  // 2. 드래그 앤 드롭 핸들러
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(examProblems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // 문항 번호 재할당 (순서가 바뀌었으므로)
    const renumberedItems = items.map((item, index) => ({
      ...item,
      number: index + 1
    }));

    setExamProblems(renumberedItems);
  };

  // [신규] 시험지 저장 핸들러
  const handleSaveExam = async () => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    if (examProblems.length === 0) {
      toast.error("시험지에 담긴 문제가 없습니다.");
      return;
    }
    if (!examTitle.trim()) {
      toast.error("시험지 제목을 입력해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      // [수정] 저장 전 데이터 정제 (undefined 제거)
      const cleanProblems = examProblems.map(p => ({
        ...p,
        imageUrl: p.imageUrl || null,   // undefined 방지
        content: p.content || null,     // undefined 방지
        difficulty: p.difficulty || null // undefined 방지
      }));

      await addDoc(collection(db, "saved_exams"), {
        userId: user.uid,
        instructorName: instructorName || "선생님", // 혹시 모를 undefined 방지
        title: examTitle || "제목 없음",
        problems: cleanProblems, // 정제된 데이터 저장
        templateId: currentTemplate.id,
        createdAt: serverTimestamp(),
        problemCount: cleanProblems.length,
      });

      toast.success("시험지가 보관함에 저장되었습니다!");
      if (confirm("저장이 완료되었습니다. 보관함으로 이동하시겠습니까?")) {
        router.push("/service/storage");
      }
    } catch (error) {
      console.error("저장 실패:", error);
      toast.error("저장 중 오류가 발생했습니다.");
    }
    setIsSaving(false);
  };
  // [팁] 저장 함수(handleSaveExam)에서 '수정 모드'일 때는 addDoc 대신 updateDoc을 쓰면 더 완벽합니다.
  // 현재는 addDoc만 있어서 '새로운 복사본'이 저장되는 방식입니다. (일단 유지해도 무방)

  // 3. 페이지네이션 (화면 표시용)
  const pagedProblems = useMemo(() => {
    const pages: ExamProblem[][] = [];
    for (let i = 0; i < examProblems.length; i += itemsPerPage) {
      pages.push(examProblems.slice(i, i + itemsPerPage));
    }
    return pages;
  }, [examProblems, itemsPerPage]);

  // 프린트 핸들러
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
  const toggleQType = (t: QuestionType) => setQTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => setAcademyLogo(ev.target?.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">시험지를 불러오고 있습니다...</p>
        </div>
      </div>
    );
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
          
          {/* [신규] 탭 메뉴 */}
          <div className="flex mt-4 p-1 bg-gray-100 rounded-lg">
            <button 
              onClick={() => setActiveTab('filter')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'filter' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              조건 설정
            </button>
            <button 
              onClick={() => setActiveTab('order')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'order' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              순서 변경
            </button>
          </div>
        </div>

        {/* 탭 컨텐츠 영역 (스크롤) */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          
          {/* 탭 1: 조건 설정 (기존 필터들) */}
          {activeTab === 'filter' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
              {/* 단원 선택 */}
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

              {/* 난이도/유형 */}
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
                <div className="flex gap-4">
                  {['객관식', '서답형'].map((type) => (
                    <label key={type} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={qTypes.includes(type as QuestionType)} onChange={() => toggleQType(type as QuestionType)} className="rounded border-gray-300 text-blue-600" />
                      {type}
                    </label>
                  ))}
                </div>
              </div>

              {/* 옵션 */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={excludeRecent} onChange={(e) => setExcludeRecent(e.target.checked)} className="rounded border-gray-300 text-blue-600" />
                  한 달 이내 출제 문항 제외
                </label>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>문항 수</span>
                    <span className="font-bold text-blue-600">{questionCount}문항</span>
                  </div>
                  <input type="range" min="4" max="50" step="1" value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                </div>
              </div>

              {/* 디자인 설정 */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4" /> 서식 디자인
                </h3>
                <div className="grid grid-cols-1 gap-2">
                   {TEMPLATES.map(t => (
                     <button key={t.id} onClick={() => setCurrentTemplate(t)} className={`flex items-center gap-3 p-2 rounded-lg border text-left transition-all ${currentTemplate.id === t.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                       <div className={`w-8 h-10 border bg-white shadow-sm flex items-center justify-center text-[8px] text-gray-300`} style={{ fontFamily: t.fontFamily }}>Aa</div>
                       <div className="text-sm font-bold text-slate-800">{t.name}</div>
                     </button>
                   ))}
                </div>
              </div>

              <div className="pt-4">
                <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                   <span className="text-sm text-gray-700 font-bold">페이지당 문항</span>
                   <div className="flex items-center gap-2">
                      <button onClick={() => setItemsPerPage(Math.max(2, itemsPerPage - 1))} className="w-6 h-6 bg-white border rounded hover:bg-gray-100">-</button>
                      <span className="text-sm font-bold w-4 text-center">{itemsPerPage}</span>
                      <button onClick={() => setItemsPerPage(Math.min(8, itemsPerPage + 1))} className="w-6 h-6 bg-white border rounded hover:bg-gray-100">+</button>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* [신규] 탭 2: 문항 순서 변경 (Drag & Drop) */}
          {activeTab === 'order' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <ListOrdered className="w-4 h-4" /> 문항 순서 변경
              </h3>
              <p className="text-xs text-gray-500 mb-4">드래그하여 문제 순서를 변경하세요.</p>
              
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="exam-problems">
                  {(provided) => (
                    <div 
                      {...provided.droppableProps} 
                      ref={provided.innerRef}
                      className="space-y-2 pb-4"
                    >
                      {examProblems.map((prob, index) => (
                        <Draggable key={prob.id} draggableId={prob.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-3 bg-white border rounded-lg flex items-center gap-3 shadow-sm transition-shadow
                                ${snapshot.isDragging ? 'shadow-lg border-blue-500 ring-1 ring-blue-500 z-50' : 'border-gray-200 hover:border-gray-300'}
                              `}
                            >
                              <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-slate-100 rounded-full text-xs font-bold text-slate-500">
                                {prob.number}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-900 font-medium truncate">{prob.content || "문제 내용 미리보기..."}</p>
                                <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{prob.difficulty}</span>
                              </div>
                              <div className="text-gray-300 cursor-grab">
                                ⠿
                              </div>
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
      <main className="flex-1 flex flex-col h-full bg-slate-200/50">
        {/* Toolbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Title</label>
              <input type="text" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} className="font-bold text-lg text-gray-800 outline-none bg-transparent placeholder-gray-300 min-w-[200px]" />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Instructor</label>
              <input type="text" value={instructorName} onChange={(e) => setInstructorName(e.target.value)} className="text-sm font-medium text-gray-600 outline-none bg-transparent" />
            </div>
            <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-xs text-gray-700 transition-colors">
              <ImageIcon className="w-3 h-3" />
              {academyLogo ? "로고 변경" : "학원 로고"}
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
          </div>
          <div className="flex gap-3">
             {/* [신규] 저장 버튼 추가 */}
             <button 
               onClick={handleSaveExam}
               disabled={isSaving}
               className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
             >
               <SaveIcon className="w-4 h-4" />
               {isSaving ? "저장 중..." : "보관함 저장"}
             </button>

             <button onClick={() => triggerPrint()} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold shadow-lg shadow-slate-200 transition-all active:scale-95">
               <Printer className="w-4 h-4" /> PDF 출력
             </button>
          </div>
        </header>

        {/* [수정] 미리보기 캔버스 (A4 효과 강화) */}
        <div className="flex-1 overflow-y-auto p-10 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent bg-slate-100">
          <div className="flex flex-col items-center gap-8 pb-20">
             {/* ExamPaperLayout 내부에 A4 스타일이 적용되어 있지만, 여기서 그림자 효과를 더 강조할 수 있음 */}
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

// [신규] Suspense로 감싸서 내보내기 (이게 진짜 페이지 컴포넌트가 됨)
export default function ExamBuilderPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">로딩 중...</div>}>
      <ExamBuilderContent />
    </Suspense>
  );
}
