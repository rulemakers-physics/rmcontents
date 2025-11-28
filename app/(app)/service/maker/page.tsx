// app/service/maker/page.tsx

"use client";

import React, { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { useReactToPrint } from "react-to-print";
import { SCIENCE_UNITS } from "@/types/scienceUnits"; 
import { 
  Printer, Lock, ChevronDown, Filter, FileText, 
  LayoutTemplate, Image as ImageIcon, SaveIcon, ListOrdered, 
  RotateCcw, FileCheck, CheckSquare // [추가] 아이콘
} from "lucide-react";
import ExamPaperLayout, { ExamTemplateStyle, ExamProblem } from "@/components/ExamPaperLayout";
import { useAuth } from "@/context/AuthContext";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"; 
import { toast } from "react-hot-toast"; 
import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs, limit } from "firebase/firestore"; 
import { useRouter, useSearchParams } from "next/navigation"; 

import { useProblemFetcher } from "@/hooks/useProblemFetcher";
import { Difficulty, QuestionType, DBProblem } from "@/types/problem";

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

  const [activeTab, setActiveTab] = useState<'filter' | 'order'>('filter');

  // 필터 상태
  const [difficulties, setDifficulties] = useState<Difficulty[]>(["중", "상"]);
  const [questionCount, setQuestionCount] = useState(20);
  const [selectedMajorTopics, setSelectedMajorTopics] = useState<string[]>([]);
  const [selectedMinorTopics, setSelectedMinorTopics] = useState<string[]>([]);

  // 메타데이터 & 옵션
  const [examTitle, setExamTitle] = useState("2025 1학기 중간고사 대비");
  const [instructorName, setInstructorName] = useState(userData?.name || "김룰메 선생님");
  const [academyLogo, setAcademyLogo] = useState<string | null>(null);
  const [printOptions, setPrintOptions] = useState<PrintOptions>({
    questions: true,
    answers: true,
    solutions: true
  });

  // 레이아웃
  const [currentTemplate, setCurrentTemplate] = useState<ExamTemplateStyle>(TEMPLATES[0]);
  const [itemsPerPage, setItemsPerPage] = useState(4);

  const [examProblems, setExamProblems] = useState<ExamProblem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false); 

  const { problems: fetchedProblems, loading: isFetching } = useProblemFetcher({
    selectedMajorTopics,
    selectedMinorTopics,
    difficulties
  });

  // [신규] 문제 교체 기능
  const handleReplaceProblem = async (problemId: string, currentMajor: string, currentDifficulty: string) => {
    if(!currentMajor) return;
    
    const toastId = toast.loading("유사 문제를 찾는 중...");
    try {
      // 1. 유사 조건(같은 대단원, 같은 난이도)으로 문제 검색
      // 실제로는 minorTopic까지 맞추는게 좋음
      const q = query(
        collection(db, "problems"),
        where("majorTopic", "==", currentMajor),
        where("difficulty", "==", currentDifficulty),
        limit(20) // 랜덤성을 위해 조금 넉넉히 가져옴
      );
      
      const snapshot = await getDocs(q);
      const candidates = snapshot.docs.map(d => ({id: d.id, ...d.data()} as DBProblem));
      
      // 2. 현재 시험지에 없는 문제만 필터링
      const currentIds = examProblems.map(p => p.id);
      const validCandidates = candidates.filter(p => !currentIds.includes(p.id));

      if (validCandidates.length === 0) {
        toast.error("교체할 유사 문제가 없습니다.", { id: toastId });
        return;
      }

      // 3. 랜덤 선택 및 교체
      const newProblem = validCandidates[Math.floor(Math.random() * validCandidates.length)];
      
      setExamProblems(prev => prev.map(p => {
        if (p.id === problemId) {
          return {
            ...p,
            id: newProblem.id,
            imageUrl: newProblem.imgUrl,
            content: newProblem.content,
            answer: newProblem.answer, // 정답 업데이트
            solutionUrl: newProblem.solutionUrl // 해설 업데이트
          };
        }
        return p;
      }));
      
      toast.success("문제가 교체되었습니다.", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("오류가 발생했습니다.", { id: toastId });
    }
  };

  // [신규] 임시 저장 및 복구 로직 (Draft)
  useEffect(() => {
    // 1. 자동 저장
    if (examProblems.length > 0 && !examId) {
      const draft = {
        title: examTitle,
        problems: examProblems,
        updatedAt: Date.now()
      };
      localStorage.setItem("exam_draft", JSON.stringify(draft));
    }
  }, [examProblems, examTitle, examId]);

  useEffect(() => {
    // 2. 초기 로드 시 복구 확인
    if (!examId) {
      const savedDraft = localStorage.getItem("exam_draft");
      if (savedDraft) {
        try {
          const { title, problems, updatedAt } = JSON.parse(savedDraft);
          // 24시간 이내 데이터만 복구 제안
          if (Date.now() - updatedAt < 24 * 60 * 60 * 1000) {
            // 사용자 경험을 위해 confirm 대신 Toast로 알리거나 그냥 로드 할 수도 있음
            // 여기서는 심플하게 자동 로드 후 알림
            setExamTitle(title);
            setExamProblems(problems);
            toast("임시 저장된 시험지를 불러왔습니다.", { icon: '📂' });
          }
        } catch (e) {
          localStorage.removeItem("exam_draft");
        }
      }
      setIsLoaded(true);
    }
  }, [examId]);


  // 기존 DB 로드 로직
  useEffect(() => {
    if (!examId) return;
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
          toast.success("불러오기 완료");
        }
      } catch (error) {
        toast.error("로드 실패");
      } finally {
        setIsLoaded(true);
      }
    };
    loadExam();
  }, [examId]);

  // 자동 생성 로직 (초기)
  useEffect(() => {
    // 로딩 전이거나 패칭 중이면 대기
    if (!isLoaded || isFetching) return;

    // [수정 포인트]
    // 저장된 시험지(examId 있음)를 '처음' 불러왔을 때는 덮어쓰면 안 되지만,
    // 사용자가 필터를 조작해서 fetchedProblems가 변했다면 "수정 의도"가 있는 것이므로 업데이트해야 합니다.
    // 따라서 기존의 'examProblems.length > 0' 체크를 제거합니다.
    
    // (단, 저장된 시험지를 불러온 직후 필터 기본값 때문에 덮어씌워지는 것을 방지하려면
    //  isLoaded 체크가 중요하며, 현재 구조상 필터를 건드리지 않으면 fetchedProblems가 변하지 않으므로 안전합니다.)

    const formatted: ExamProblem[] = fetchedProblems
      .slice(0, questionCount)
      .map((p, idx) => ({
        id: p.id,
        number: idx + 1,
        imageUrl: p.imgUrl,
        content: p.content,
        difficulty: p.difficulty,
        majorTopic: p.majorTopic,
        minorTopic: p.minorTopic,
        answer: p.answer || null,
        solutionUrl: p.solutionUrl || null
      }));

    // 받아온 문제가 있을 때만 업데이트 (원치 않는 빈 화면 방지)
    if (formatted.length > 0) {
      setExamProblems(formatted);
    } else if (fetchedProblems.length === 0 && selectedMajorTopics.length > 0) {
      // 필터는 걸었는데 결과가 0개인 경우 (조건에 맞는 문제 없음) -> 빈 화면으로 갱신
      setExamProblems([]);
    }

  }, [fetchedProblems, questionCount, isLoaded, examId, isFetching]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(examProblems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    const renumberedItems = items.map((item, index) => ({ ...item, number: index + 1 }));
    setExamProblems(renumberedItems);
  };

  const handleSaveExam = async () => {
    if (!user) { toast.error("로그인 필요"); return; }
    if (examProblems.length === 0) { toast.error("문제 없음"); return; }
    
    setIsSaving(true);
    try {
      const cleanProblems = examProblems.map(p => ({
        ...p,
        // undefined 방지
        imageUrl: p.imageUrl || null,
        content: p.content || null,
        difficulty: p.difficulty || null,
        answer: p.answer || null,
        solutionUrl: p.solutionUrl || null
      }));

      await addDoc(collection(db, "saved_exams"), {
        userId: user.uid,
        instructorName,
        title: examTitle,
        problems: cleanProblems,
        templateId: currentTemplate.id,
        createdAt: serverTimestamp(),
        problemCount: cleanProblems.length,
      });

      localStorage.removeItem("exam_draft"); // 저장 성공 시 임시 데이터 삭제
      toast.success("저장 완료");
      if (confirm("보관함으로 이동?")) router.push("/service/storage");
    } catch (e) {
      toast.error("저장 실패");
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
    if (d === '킬러' && userPlan !== 'MAKERS') { toast.error("Maker's Plan 전용"); return; }
    setDifficulties(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => setAcademyLogo(ev.target?.result as string);
      reader.readAsDataURL(e.target.files![0]);
    }
  };

  if (!isLoaded) return <div className="flex h-screen items-center justify-center">로딩 중...</div>;

  return (
    <div className="flex w-full h-[calc(100vh-64px)] bg-gray-50 font-sans overflow-hidden">
      <aside className="w-80 flex-shrink-0 bg-white border-r border-gray-200 overflow-hidden flex flex-col z-20">
        <div className="p-5 border-b border-gray-100 flex-shrink-0">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" /> 시험지 빌더</h1>
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

              {/* [수정] 출력 옵션 섹션 */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Printer className="w-4 h-4"/> 출력 옵션 설정
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={printOptions.questions} 
                      onChange={(e) => setPrintOptions(prev => ({...prev, questions: e.target.checked}))}
                      className="rounded text-blue-600 w-4 h-4" 
                    />
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-700 font-medium">문제지 포함</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={printOptions.answers} 
                      onChange={(e) => setPrintOptions(prev => ({...prev, answers: e.target.checked}))}
                      className="rounded text-blue-600 w-4 h-4" 
                    />
                    <CheckSquare className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-700 font-medium">빠른 정답표 포함</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={printOptions.solutions} 
                      onChange={(e) => setPrintOptions(prev => ({...prev, solutions: e.target.checked}))}
                      className="rounded text-blue-600 w-4 h-4" 
                    />
                    <FileCheck className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-700 font-medium">상세 해설지 포함</span>
                  </label>
                </div>
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
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><ListOrdered className="w-4 h-4"/> 문항 순서 및 교체</h3>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="exam-problems">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 pb-4">
                      {examProblems.map((prob, index) => (
                        <Draggable key={prob.id} draggableId={prob.id} index={index}>
                          {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={`p-3 bg-white border rounded-lg flex items-center gap-3 shadow-sm group ${snapshot.isDragging ? 'shadow-lg border-blue-500 z-50' : 'border-gray-200'}`}>
                              <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-slate-100 rounded-full text-xs font-bold text-slate-500">{prob.number}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-900 font-medium truncate">{prob.content || "문제 이미지"}</p>
                                <span className="text-[10px] text-gray-400 bg-gray-50 px-1 rounded">{prob.difficulty}</span>
                              </div>
                              
                              {/* [신규] 문제 교체 버튼 (호버 시 등장) */}
                              <button 
                                onClick={() => handleReplaceProblem(prob.id, prob.majorTopic || "", prob.difficulty || "중")}
                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-blue-50 text-blue-600 rounded transition-all"
                                title="다른 문제로 교체"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                              
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
               printOptions={printOptions}
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