// app/(app)/service/maker/page.tsx

"use client";

import React, { useState, useRef, useEffect, useMemo, Suspense, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import { SCIENCE_UNITS } from "@/types/scienceUnits"; 
import { 
  Printer, Lock, ChevronDown, Filter, FileText, 
  LayoutTemplate, Image as ImageIcon, SaveIcon, ListOrdered, 
  RotateCcw, FileCheck, CheckSquare, Settings2, CheckCircle2
} from "lucide-react";
import { 
  Squares2X2Icon, ViewColumnsIcon, QueueListIcon // [신규] 레이아웃 아이콘
} from "@heroicons/react/24/outline";
import ExamPaperLayout, { ExamProblem, LayoutMode } from "@/components/ExamPaperLayout";
import { useAuth } from "@/context/AuthContext";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"; 
import { toast } from "react-hot-toast"; 
import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs, limit } from "firebase/firestore"; 
import { useRouter, useSearchParams } from "next/navigation"; 

import { useProblemFetcher } from "@/hooks/useProblemFetcher";
import { Difficulty, DBProblem } from "@/types/problem"; 
import { TEMPLATES, ExamTemplateStyle } from "@/types/examTemplates";

// 인쇄 옵션 인터페이스
export interface PrintOptions {
  questions: boolean;
  answers: boolean;
  solutions: boolean;
  questionPadding: number;
  solutionPadding: number;
}

function ExamBuilderContent() {
  const { userData, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams(); 
  const examId = searchParams.get("id");
  const userPlan = userData?.plan || "BASIC";

  const [activeTab, setActiveTab] = useState<'filter' | 'order'>('filter');

  // 필터 상태
  const [difficulties, setDifficulties] = useState<Difficulty[]>(["기본", "하", "중", "상"]);
  const [questionCount, setQuestionCount] = useState(20);
  const [selectedMajorTopics, setSelectedMajorTopics] = useState<string[]>([]);
  const [selectedMinorTopics, setSelectedMinorTopics] = useState<string[]>([]);

  // [신규] 사용 문항 필터링 상태
  const [excludeUsed, setExcludeUsed] = useState(true); // 기본값: 제외함
  const [usedProblemIds, setUsedProblemIds] = useState<string[]>([]);

  // 메타데이터 & 옵션
  const [examTitle, setExamTitle] = useState("제목을 입력해주세요");
  const [instructorName, setInstructorName] = useState(userData?.name || "선생님 성함");
  const [academyLogo, setAcademyLogo] = useState<string | null>(null);
  
  // [설정] 기본값 설정: 문제 간격 40, 해설 간격 20
  const [printOptions, setPrintOptions] = useState<any>({ // 타입 오류 방지 위해 any 사용 or interface 업데이트 필요
    questions: true,
    answers: true,
    solutions: true,
    questionPadding: 40,
    solutionPadding: 20
  });

  const [isTeacherMode, setIsTeacherMode] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<ExamTemplateStyle>(TEMPLATES[0]);

  // [중요] 초기값을 빈 배열로 명시
  const [examProblems, setExamProblems] = useState<ExamProblem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false); 
  const [isMounted, setIsMounted] = useState(false);
  
  // [신규] 질문 형식 상태 관리
  // 기본값: ['SELECTION'] (객관식만 선택됨)
  const [targetQuestionTypes, setTargetQuestionTypes] = useState<string[]>(['SELECTION', 'ESSAY']);

  // [신규] 레이아웃 모드 상태
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('dense');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // [신규] 최근 1개월 내 사용된 문제 ID 조회
  useEffect(() => {
    if (!user) return;

    const fetchUsedProblems = async () => {
      try {
        // 1개월 전 날짜 계산
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        // 최근 1개월 내 저장된 시험지 조회
        const q = query(
          collection(db, "saved_exams"),
          where("userId", "==", user.uid),
          where("createdAt", ">=", oneMonthAgo)
        );

        const snapshot = await getDocs(q);
        const usedIds = new Set<string>();

        snapshot.forEach((doc) => {
          const data = doc.data();
          // 저장된 시험지의 문제 배열에서 ID 추출
          if (Array.isArray(data.problems)) {
            data.problems.forEach((p: any) => {
              if (p.id) usedIds.add(p.id);
            });
          }
        });

        setUsedProblemIds(Array.from(usedIds));
      } catch (error) {
        console.error("사용된 문제 조회 실패:", error);
      }
    };

    fetchUsedProblems();
  }, [user]);

  // 문제 데이터 Fetcher Hook 사용 (필터링 조건 전달)
  const { problems: fetchedProblems, loading: isFetching } = useProblemFetcher({
    selectedMajorTopics,
    selectedMinorTopics,
    difficulties,
    excludedProblemIds: excludeUsed ? usedProblemIds : [],
    questionTypes: targetQuestionTypes, // [신규] 전달
  });

  // [신규] 체크박스 핸들러
  const toggleQuestionType = (type: string) => {
    setTargetQuestionTypes(prev => {
      // 최소 1개는 선택되어 있어야 함 (모두 해제 방지 로직이 필요하다면 추가)
      if (prev.includes(type)) {
        // 만약 이것을 끄면 아무것도 안 남는 경우 -> 끄지 않음 (선택 사항)
        if (prev.length === 1) return prev; 
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  // [핵심 수정] 자동 생성 로직
  useEffect(() => {
    // 1. 아직 로딩 전이거나 데이터를 불러오는 중이면 대기
    if (!isLoaded || isFetching) return;

    // 2. 불러온 데이터가 있으면 가공해서 상태 업데이트
    if (fetchedProblems.length > 0) {
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
          solutionUrl: p.solutionUrl || null,
          // DB의 높이 정보 전달
          height: (p as any).imgHeight,         
          solutionHeight: (p as any).solutionHeight
        }));
        
      setExamProblems(formatted);
    } 
    // 3. 불러온 데이터가 없지만 단원은 선택된 상태라면 -> 문제 없음을 표시하기 위해 빈 배열 설정
    else if (fetchedProblems.length === 0 && selectedMajorTopics.length > 0) {
      setExamProblems([]);
    }
  }, [fetchedProblems, questionCount, isLoaded, isFetching, selectedMajorTopics.length]); 

  // 문제 교체 핸들러 (유사 문항)
  const handleReplaceProblem = useCallback(async (problemId: string, currentMajor: string, currentDifficulty: string) => {
    if (!currentMajor) return;
    const toastId = toast.loading("유사 문항을 탐색 중...");
    
    try {
      const currentProblemRef = doc(db, "problems", problemId);
      const currentProblemSnap = await getDoc(currentProblemRef);
      const currentProblemData = currentProblemSnap.data() as DBProblem;

      let newProblemData: DBProblem | null = null;

      if (currentProblemData?.similarProblems && currentProblemData.similarProblems.length > 0) {
        const currentIds = examProblems.map(p => p.id);
        const candidates = currentProblemData.similarProblems;
        
        for (let i = 0; i < 5; i++) { 
          const randomSim = candidates[Math.floor(Math.random() * candidates.length)];
          const q = query(collection(db, "problems"), where("filename", "==", randomSim.targetFilename));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const candidateDoc = snap.docs[0];
            // [수정] 교체 시에도 '이미 사용한 문제' 제외 로직 적용 여부 고려 (여기선 현재 시험지에 있는 것만 제외)
            if (!currentIds.includes(candidateDoc.id)) {
              newProblemData = { id: candidateDoc.id, ...candidateDoc.data() } as DBProblem;
              break;
            }
          }
        }
      }

      if (!newProblemData) {
        const q = query(
          collection(db, "problems"),
          where("majorTopic", "==", currentMajor),
          where("difficulty", "==", currentDifficulty),
          limit(30)
        );
        const snapshot = await getDocs(q);
        const candidates = snapshot.docs.map(d => ({id: d.id, ...d.data()} as DBProblem));
        const currentIds = examProblems.map(p => p.id);
        const validCandidates = candidates.filter(p => !currentIds.includes(p.id) && p.id !== problemId);

        if (validCandidates.length > 0) {
          newProblemData = validCandidates[Math.floor(Math.random() * validCandidates.length)];
        }
      }

      if (newProblemData) {
        setExamProblems(prev => prev.map(p => {
          if (p.id === problemId) {
            return {
              ...p, 
              id: newProblemData!.id,
              imageUrl: newProblemData!.imgUrl,
              content: newProblemData!.content,
              answer: newProblemData!.answer,
              solutionUrl: newProblemData!.solutionUrl,
              minorTopic: newProblemData!.minorTopic,
              difficulty: newProblemData!.difficulty,
              // 높이 정보 교체
              height: (newProblemData as any).imgHeight,
              solutionHeight: (newProblemData as any).solutionHeight
            };
          }
          return p;
        }));
        toast.success("교체되었습니다.", { id: toastId });
      } else {
        toast.error("교체할 문항이 없습니다.", { id: toastId });
      }
    } catch (e) {
      console.error(e);
      toast.error("오류가 발생했습니다.", { id: toastId });
    }
  }, [examProblems]);

  // 임시 저장 불러오기
  useEffect(() => {
    if (!examId && isMounted) {
      const savedDraft = localStorage.getItem("exam_draft");
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          const { title, problems, updatedAt } = parsed;
          
          if (Date.now() - updatedAt < 24 * 60 * 60 * 1000) {
            setExamTitle(title || "");
            setExamProblems(Array.isArray(problems) ? problems : []); 
            toast("임시 저장된 시험지를 불러왔습니다.", { icon: '📂' });
          }
        } catch (e) {
          console.error("Draft load error", e);
          localStorage.removeItem("exam_draft");
        }
      }
      setIsLoaded(true);
    }
  }, [examId, isMounted]);

  // DB 로드 (저장된 시험지)
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
          toast.success("시험지를 불러왔습니다.");
        }
      } catch (error) {
        toast.error("불러오기 실패");
      } finally {
        setIsLoaded(true);
      }
    };
    loadExam();
  }, [examId]);

  // 임시 저장 (자동)
  useEffect(() => {
    if (examProblems.length > 0 && !examId && isMounted) {
      const draft = {
        title: examTitle,
        problems: examProblems,
        updatedAt: Date.now()
      };
      localStorage.setItem("exam_draft", JSON.stringify(draft));
    }
  }, [examProblems, examTitle, examId, isMounted]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(examProblems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    const renumberedItems = items.map((item, index) => ({ ...item, number: index + 1 }));
    setExamProblems(renumberedItems);
  };

  const printRef = useRef<HTMLDivElement>(null);
  
  // [수정] PDF 출력 기능은 여기서 사용되지 않고 보관함에서 사용됨.
  // 하지만 미리보기용으로 ref는 유지해야 함.

  // [수정] 저장 핸들러: 저장 후 보관함 이동 유도
  const handleSaveExam = async () => {
    if (!user) { toast.error("로그인 필요"); return; }
    if (examProblems.length === 0) { toast.error("문제가 없습니다."); return; }

    setIsSaving(true);
    try {
      const cleanProblems = examProblems.map(p => ({
        ...p,
        imageUrl: p.imageUrl || null,
        content: p.content || null,
        difficulty: p.difficulty || null,
        answer: p.answer || null,
        solutionUrl: p.solutionUrl || null,
        height: p.height,
        solutionHeight: p.solutionHeight
      }));

      await addDoc(collection(db, "saved_exams"), {
        userId: user.uid,
        instructorName,
        title: examTitle,
        problems: cleanProblems,
        templateId: currentTemplate.id,
        createdAt: serverTimestamp(),
        problemCount: examProblems.length,
      });
      
      toast.success("시험지가 보관함에 저장되었습니다!");
      
      // [중요] 저장 후 보관함으로 자동 이동하여 출력을 유도
      router.push("/service/storage");
      
    } catch (e) {
      console.error(e);
      toast.error("저장 실패");
    }
    setIsSaving(false);
  };

  const toggleDifficulty = (d: Difficulty) => {
    if (d === '킬러' && userPlan !== 'MAKERS') { toast.error("Maker's Plan 전용입니다."); return; }
    setDifficulties(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => setAcademyLogo(ev.target?.result as string);
      reader.readAsDataURL(e.target.files![0]);
    }
  };

  if (!isLoaded || !isMounted) return <div className="flex h-screen items-center justify-center">로딩 중...</div>;

  return (
    <div className="flex w-full h-[calc(100vh-64px)] bg-gray-50 font-sans overflow-hidden">
      
      {/* === Sidebar === */}
      <aside className="w-80 flex-shrink-0 bg-white border-r border-gray-200 overflow-hidden flex flex-col z-20">
        <div className="p-5 border-b border-gray-100 flex-shrink-0">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> 시험지 빌더
          </h1>
          <div className="flex mt-4 p-1 bg-gray-100 rounded-lg">
            <button onClick={() => setActiveTab('filter')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'filter' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>조건 설정</button>
            <button onClick={() => setActiveTab('order')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'order' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>순서/교체</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {activeTab === 'filter' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
              
              {/* 단원 선택 */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Filter className="w-4 h-4" /> 단원 선택</h3>
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
                                  setSelectedMajorTopics(prev => 
                                    prev.includes(major.name) ? prev.filter(t => t !== major.name) : [...prev, major.name]
                                  );
                                  setExamProblems([]); 
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
                                    if (!selectedMajorTopics.includes(major.name)) {
                                      setSelectedMajorTopics(prev => [...prev, major.name]);
                                    }
                                  }}
                                  className="rounded border-gray-300 text-blue-400 w-3 h-3"
                                />
                                <span className="text-xs text-slate-600">{minor}</span>
                              </label>
                            ))}
                          </div>
                        </details>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* 난이도 */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">난이도</h3>
                <div className="flex flex-wrap gap-2">
                  {['기본', '하', '중', '상', '킬러'].map((level) => (
                    <button
                      key={level}
                      onClick={() => toggleDifficulty(level as Difficulty)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1 ${difficulties.includes(level as Difficulty) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
                    >
                      {level} {level === '킬러' && userPlan !== 'MAKERS' && <Lock className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* ▼▼▼ [신규] 질문 형식 선택 UI 추가 (난이도 아래 또는 위) ▼▼▼ */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4"/> 문항 유형
                </h3>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={targetQuestionTypes.includes('SELECTION')}
                      onChange={() => toggleQuestionType('SELECTION')}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4" 
                    />
                    <span className="text-sm text-slate-700 font-bold">객관식</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={targetQuestionTypes.includes('ESSAY')}
                      onChange={() => toggleQuestionType('ESSAY')}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4" 
                    />
                    <span className="text-sm text-slate-700 font-bold">서답형</span>
                  </label>
                </div>
              </div>
              {/* ▲▲▲ [신규 끝] ▲▲▲ */}
              
              {/* [신규] 문항 필터 (사용 문항 제외) */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4"/> 문항 필터
                </h3>
                <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50 bg-white">
                  <input 
                    type="checkbox" 
                    checked={excludeUsed} 
                    onChange={(e) => setExcludeUsed(e.target.checked)} 
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4" 
                  />
                  <div>
                    <span className="text-sm font-bold text-slate-700 block">최근 1개월 내 사용 문항 제외</span>
                    <span className="text-xs text-slate-400">보관함에 저장된 기록 기준 ({usedProblemIds.length}개 제외됨)</span>
                  </div>
                </label>
              </div>

              {/* 문항 수 */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm mb-2">
                  <span>문항 수 (최대 50)</span>
                  <span className="font-bold text-blue-600">{questionCount}문항</span>
                </div>
                <input type="range" min="4" max="50" step="1" value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </div>

              {/* [신규] 레이아웃 설정 섹션 */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4"/> 배치 모드
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setLayoutMode('dense')}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs transition-all ${layoutMode === 'dense' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                  >
                    <QueueListIcon className="w-5 h-5 mb-1" />
                    기본(빼곡)
                  </button>
                  <button 
                    onClick={() => setLayoutMode('split-2')}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs transition-all ${layoutMode === 'split-2' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                  >
                    <ViewColumnsIcon className="w-5 h-5 mb-1" />
                    2분할
                  </button>
                  <button 
                    onClick={() => setLayoutMode('split-4')}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs transition-all ${layoutMode === 'split-4' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                  >
                    <Squares2X2Icon className="w-5 h-5 mb-1" />
                    4분할
                  </button>
                </div>
              </div>

              {/* 옵션 및 여백 */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Printer className="w-4 h-4"/> 옵션 및 여백
                </h3>
                
                <div className="space-y-2 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50">
                    <input type="checkbox" checked={printOptions.questions} onChange={(e) => setPrintOptions(prev => ({...prev, questions: e.target.checked}))} className="rounded text-blue-600" />
                    <span className="text-sm text-slate-700">문제지 포함</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50">
                    <input type="checkbox" checked={printOptions.answers} onChange={(e) => setPrintOptions(prev => ({...prev, answers: e.target.checked}))} className="rounded text-blue-600" />
                    <span className="text-sm text-slate-700">빠른 정답 포함</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50">
                    <input type="checkbox" checked={printOptions.solutions} onChange={(e) => setPrintOptions(prev => ({...prev, solutions: e.target.checked}))} className="rounded text-blue-600" />
                    <span className="text-sm text-slate-700">해설지 포함</span>
                  </label>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg space-y-3 border border-slate-200">
                   {/* [수정] 기본(Dense) 모드일 때만 문항 간격 조절 표시 */}
                   {layoutMode === 'dense' && (
                     <div>
                        <div className="flex justify-between text-xs mb-1 text-slate-600">
                           <span>문제 간격 (px)</span>
                           <span className="font-bold text-blue-600">{printOptions.questionPadding}</span>
                        </div>
                        <input 
                          type="range" min="10" max="100" step="5" 
                          value={printOptions.questionPadding} 
                          onChange={(e) => setPrintOptions(prev => ({...prev, questionPadding: Number(e.target.value)}))}
                          className="w-full h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                        />
                     </div>
                   )}
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
              
              {isMounted && (
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="exam-problems">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 pb-4">
                        {examProblems.map((prob, index) => (
                          <Draggable key={prob.id} draggableId={prob.id} index={index}>
                            {(provided, snapshot) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={`p-2 bg-white border rounded-lg flex items-center gap-3 shadow-sm group ${snapshot.isDragging ? 'shadow-lg border-blue-500 z-50' : 'border-gray-200'}`}>
                                <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-slate-100 rounded-full text-xs font-bold text-slate-500">{prob.number}</span>
                                <div className="relative w-12 h-12 bg-slate-50 rounded border border-slate-100 overflow-hidden flex-shrink-0">
                                  {prob.imageUrl ? <img src={prob.imageUrl} alt="" className="w-full h-full object-contain" /> : <div className="flex items-center justify-center h-full text-[10px] text-slate-300">Text</div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-slate-800 truncate">{prob.minorTopic}</p>
                                  <span className="text-[10px] text-slate-500">{prob.difficulty}</span>
                                </div>
                                <button onClick={() => handleReplaceProblem(prob.id, prob.majorTopic || "", prob.difficulty || "중")} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded">
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* === Main Preview === */}
      <main className="flex-1 flex flex-col h-full bg-slate-200/50 relative">
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
             {/* [수정] PDF 출력 버튼 제거하고, 저장 버튼 강조 */}
             <button onClick={handleSaveExam} disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50">
               <SaveIcon className="w-4 h-4" /> {isSaving ? "저장 중..." : "보관함 저장 (출력)"}
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent bg-slate-100">
          <div className="flex flex-col items-center gap-8 pb-20">
             {/* 페이지네이션 없이 전체 배열 전달 (내부에서 페이지 분배) */}
             <ExamPaperLayout 
               ref={printRef}
               // [중요] 배열이 존재할 때만 전달 (undefined 방지)
               problems={examProblems || []} 
               title={examTitle}
               instructor={instructorName}
               template={currentTemplate}
               printOptions={{
                 ...printOptions,
                 layoutMode: layoutMode
               }}
               isTeacherVersion={isTeacherMode} 
             />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ExamBuilderPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">로딩 중...</div>}>
      <ExamBuilderContent />
    </Suspense>
  );
}