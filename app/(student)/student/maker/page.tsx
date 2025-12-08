// app/(student)/student/maker/page.tsx

"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit } from "firebase/firestore";
import { 
  PlayIcon, 
  Printer, 
  Filter, 
  ListOrdered, 
  RotateCcw, 
  Lock, 
  FileText,
  ChevronDown,
  Save,
  CheckSquare,
  LayoutTemplate
 } from "lucide-react";
 import { 
  Squares2X2Icon, ViewColumnsIcon, QueueListIcon 
} from "@heroicons/react/24/outline";

import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useReactToPrint } from "react-to-print";
import { toast } from "react-hot-toast";

// 프로젝트 내 컴포넌트 및 타입 임포트
import { useProblemFetcher } from "@/hooks/useProblemFetcher";
import { SCIENCE_UNITS } from "@/types/scienceUnits";
import { Difficulty, DBProblem } from "@/types/problem";
import ExamPaperLayout, { ExamProblem as LayoutExamProblem } from "@/components/ExamPaperLayout";
import { TEMPLATES, LayoutMode } from "@/types/examTemplates";

// 학생용 Maker 페이지 내부 타입
interface StudentExamProblem {
  id: string;
  number: number;
  imageUrl?: string | null;
  content?: string;
  difficulty?: string;
  majorTopic?: string;
  minorTopic?: string;
  answer?: string | null;
  solutionUrl?: string | null;
  // [신규] 높이 정보 추가 (ExamPaperLayout 호환)
  height?: number;
  solutionHeight?: number;
}

export default function StudentMakerPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  
  const isPremium = userData?.plan === 'STD_PREMIUM';

  const [activeTab, setActiveTab] = useState<'filter' | 'list'>('filter');
  
  const [selectedMajorTopics, setSelectedMajorTopics] = useState<string[]>([]);
  const [selectedMinorTopics, setSelectedMinorTopics] = useState<string[]>([]); 
  const [difficulties, setDifficulties] = useState<Difficulty[]>(["중"]);
  const [questionCount, setQuestionCount] = useState(10); 

  const [excludeUsed, setExcludeUsed] = useState(true);
  const [usedProblemIds, setUsedProblemIds] = useState<string[]>([]);

  // [신규] 레이아웃 및 인쇄 옵션 상태 추가
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('dense');
  const [printOptions, setPrintOptions] = useState({
    questions: true,
    answers: true,
    solutions: true,
    questionPadding: 40,
    solutionPadding: 20
  });

  const [examProblems, setExamProblems] = useState<StudentExamProblem[]>([]);
  const [examTitle, setExamTitle] = useState("나만의 모의고사");
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingAndPrinting, setIsSavingAndPrinting] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  // [신규] 최근 1개월 내 사용된 문제 ID 조회 (학습 기록 기준)
  useEffect(() => {
    if (!user) return;

    const fetchUsedProblems = async () => {
      try {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        // 학생의 학습 기록(student_exams)에서 최근 1개월 내 문제 조회
        const q = query(
          collection(db, "student_exams"),
          where("userId", "==", user.uid),
          where("createdAt", ">=", oneMonthAgo)
        );

        const snapshot = await getDocs(q);
        const usedIds = new Set<string>();

        snapshot.forEach((doc) => {
          const data = doc.data();
          if (Array.isArray(data.problems)) {
            data.problems.forEach((p: any) => {
              // problemId 필드 사용
              if (p.problemId) usedIds.add(p.problemId);
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

  // 문제 데이터 Fetcher Hook 사용 (필터링 적용)
  const { problems: fetchedProblems, loading: isFetching } = useProblemFetcher({
    selectedMajorTopics,
    selectedMinorTopics,
    difficulties,
    // [신규] 사용된 문항 ID 전달
    excludedProblemIds: excludeUsed ? usedProblemIds : [],
  });

  // 1. 문제 자동 구성 (Fetcher 결과 반영)
  useEffect(() => {
    if (isFetching) return;
    
    // 조건이 변경되어 새 문제가 로드되었고, 목록이 비어있다면(또는 사용자가 리셋했을 때) 채워넣음
    if (fetchedProblems.length > 0 && (examProblems.length === 0 || activeTab === 'filter')) {
       // [수정] 탭 변경이나 조건 변경 시 바로 반영되지 않도록 조건 강화 가능하나, 
       // 여기서는 단순화를 위해 빈 배열일 때만 채우는 기존 로직 유지 + 명시적 리셋 필요
       if (examProblems.length === 0) {
         const formatted = fetchedProblems.slice(0, questionCount).map((p, idx) => ({
           id: p.id,
           number: idx + 1,
           imageUrl: p.imgUrl,
           content: p.content,
           difficulty: p.difficulty,
           majorTopic: p.majorTopic,
           minorTopic: p.minorTopic,
           answer: p.answer,
           solutionUrl: p.solutionUrl,
           height: (p as any).imgHeight,
           solutionHeight: (p as any).solutionHeight
         }));
         setExamProblems(formatted);
       }
    } else if (fetchedProblems.length === 0 && selectedMajorTopics.length > 0) {
      // 조건에 맞는 문제가 없을 경우 초기화
      setExamProblems([]);
    }
  }, [fetchedProblems, questionCount, examProblems.length, isFetching, selectedMajorTopics.length]);

  // 2. 문제 교체 (Reroll) 핸들러
  const handleReplaceProblem = useCallback(async (problemId: string, currentMajor: string, currentDifficulty: string) => {
    if (!currentMajor) return;
    const toastId = toast.loading("유사 문제를 찾는 중...");

    try {
      const q = query(
        collection(db, "problems"),
        where("majorTopic", "==", currentMajor),
        where("difficulty", "==", currentDifficulty),
        limit(30)
      );
      const snap = await getDocs(q);
      const candidates = snap.docs.map(d => ({ id: d.id, ...d.data() } as DBProblem));
      
      const currentIds = examProblems.map(p => p.id);
      
      // [수정] 교체 시에도 '이미 사용한 문항' 및 '현재 리스트 문항' 제외
      const validCandidates = candidates.filter(p => 
        !currentIds.includes(p.id) && 
        (!excludeUsed || !usedProblemIds.includes(p.id))
      );

      if (validCandidates.length > 0) {
        const newProbData = validCandidates[Math.floor(Math.random() * validCandidates.length)];
        
        setExamProblems(prev => prev.map(p => {
          if (p.id === problemId) {
            return {
              ...p,
              id: newProbData.id,
              imageUrl: newProbData.imgUrl,
              content: newProbData.content,
              answer: newProbData.answer,
              solutionUrl: newProbData.solutionUrl,
              height: (newProbData as any).imgHeight,
              solutionHeight: (newProbData as any).solutionHeight
            };
          }
          return p;
        }));
        toast.success("문제가 교체되었습니다!", { id: toastId });
      } else {
        toast.error("교체할 만한 적절한 문제가 없어요.", { id: toastId });
      }
    } catch (e) {
      console.error(e);
      toast.error("오류가 발생했습니다.", { id: toastId });
    }
  }, [examProblems, excludeUsed, usedProblemIds]);

  // 3. 온라인 시험 시작 (CBT) - 저장 로직 포함
  const handleStartExam = async () => {
    if (examProblems.length === 0) return toast.error("문제가 없습니다. 조건을 선택해주세요.");
    if (!examTitle.trim()) return toast.error("시험지 제목을 입력해주세요.");

    setIsCreating(true);
    const toastId = toast.loading("시험지를 생성하고 있습니다...");

    try {
      const examRef = await addDoc(collection(db, "student_exams"), {
        userId: user?.uid,
        userName: userData?.name || "학생",
        title: examTitle,
        createdAt: serverTimestamp(),
        status: "in_progress",
        totalQuestions: examProblems.length,
        difficulty: difficulties.join(", "),
        // [신규] CBT 모드 명시
        mode: "test", 
        problems: examProblems.map((p, idx) => ({
          problemId: p.id,
          number: idx + 1,
          content: p.content || "",
          imgUrl: p.imageUrl || "",
          answer: p.answer || "",
          majorTopic: p.majorTopic || "기타", 
          minorTopic: p.minorTopic || "",
          solutionUrl: p.solutionUrl || null,
          userAnswer: null,
          isCorrect: false
        }))
      });

      toast.success("시험 준비 완료! 이동합니다.", { id: toastId });
      router.push(`/student/study/take?examId=${examRef.id}`);

    } catch (e) {
      console.error(e);
      toast.error("시험 생성 실패", { id: toastId });
      setIsCreating(false);
    }
  };

  // 4. [수정] 기록 저장 및 PDF 출력 핸들러
  // 기존 handlePrint 대신, DB에 먼저 저장하고 출력하도록 변경
  const triggerPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: examTitle,
    onAfterPrint: () => {
      // 출력 후 추가 동작이 필요하다면 여기에 작성
    }
  });

  // [수정] 4. 기록 저장 및 보관함 이동 핸들러
  const handleSaveToStorage = async () => {
    if (examProblems.length === 0) return toast.error("문제가 없습니다.");
    if (!examTitle.trim()) return toast.error("시험지 제목을 입력해주세요.");
    if (!user) return toast.error("로그인이 필요합니다.");

    setIsSavingAndPrinting(true);
    const toastId = toast.loading("보관함에 저장 중...");

    try {
      await addDoc(collection(db, "student_exams"), { // student_exams 컬렉션 사용 (학생용)
        userId: user.uid,
        userName: userData?.name || "학생",
        title: examTitle,
        createdAt: serverTimestamp(),
        status: "saved",
        mode: "print",
        totalQuestions: examProblems.length,
        difficulty: difficulties.join(", "),
        
        // [신규] 레이아웃 정보 저장
        layoutMode: layoutMode,
        questionPadding: printOptions.questionPadding,
        templateId: TEMPLATES[0].id, // 기본 템플릿 ID 명시

        problems: examProblems.map((p, idx) => ({
          problemId: p.id,
          number: idx + 1,
          content: p.content || "",
          imgUrl: p.imageUrl || "",
          answer: p.answer || "",
          majorTopic: p.majorTopic || "기타",
          minorTopic: p.minorTopic || "",
          solutionUrl: p.solutionUrl || null,
          height: p.height,
          solutionHeight: p.solutionHeight
        }))
      });

      toast.success("저장 완료! 보관함으로 이동합니다.", { id: toastId });
      router.push("/student/storage");

    } catch (e) {
      console.error(e);
      toast.error("저장 중 오류가 발생했습니다.", { id: toastId });
    } finally {
      setIsSavingAndPrinting(false);
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(examProblems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    const renumbered = items.map((item, idx) => ({ ...item, number: idx + 1 }));
    setExamProblems(renumbered);
  };

  const toggleDifficulty = (d: Difficulty) => {
    if (d === '킬러' && !isPremium) {
      if(confirm("킬러 문항은 프리미엄 멤버십 전용입니다.\n멤버십을 업그레이드 하시겠습니까?")) {
         router.push("/pricing");
      }
      return;
    }
    setDifficulties(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
    setExamProblems([]); // 난이도 변경 시 목록 초기화 (새로고침 유도)
  };

  // 페이지네이션 (PDF 출력용 데이터 변환 - ExamPaperLayout 호환)
  // 학생용은 심플하게 전체를 넘겨 Layout 내부에서 처리하도록 함 (ExamPaperLayout 최신 로직 따름)
  const layoutProblems = useMemo(() => {
    return examProblems.map(p => ({
      ...p,
      answer: p.answer || null,
      imageUrl: p.imageUrl || null,
      solutionUrl: p.solutionUrl || null
    }));
  }, [examProblems]);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-50 font-sans overflow-hidden">
      
      {/* === [Left] 설정 사이드바 === */}
      <aside className="w-80 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col z-10 h-full">
        <div className="p-6 border-b border-slate-100 flex-shrink-0">
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <ListOrdered className="w-6 h-6 text-emerald-600" />
            나만의 시험지
          </h1>
          <p className="text-xs text-slate-500 mt-2">약점을 보완할 맞춤 시험지를 만드세요.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
          
          {/* 1. 단원 선택 */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Filter className="w-4 h-4" /> 단원 선택
            </h3>
            <div className="space-y-2">
              {SCIENCE_UNITS.map((subject) => (
                <div key={subject.name} className="border border-slate-100 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500 border-b border-slate-100">
                    {subject.name}
                  </div>
                  <div className="p-2 space-y-1">
                    {subject.majorTopics.map((major) => (
                      <label 
                        key={major.name} 
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all hover:bg-slate-50 ${
                          selectedMajorTopics.includes(major.name) ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600'
                        }`}
                      >
                        <span className="text-sm truncate max-w-[180px]">{major.name}</span>
                        <input 
                          type="checkbox"
                          checked={selectedMajorTopics.includes(major.name)}
                          onChange={() => {
                            setSelectedMajorTopics(prev => 
                              prev.includes(major.name) ? prev.filter(t => t !== major.name) : [...prev, major.name]
                            );
                            setExamProblems([]); 
                          }}
                          className="accent-emerald-600 w-4 h-4 rounded border-slate-300"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. 난이도 & 문항 수 */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-2">난이도 선택</h3>
              <div className="flex flex-wrap gap-2">
                {['하', '중', '상', '킬러'].map((level) => (
                  <button
                    key={level}
                    onClick={() => toggleDifficulty(level as Difficulty)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1 ${
                      difficulties.includes(level as Difficulty)
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {level}
                    {level === '킬러' && !isPremium && <Lock className="w-3 h-3 text-slate-400" />}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500 font-bold">문항 수</span>
                <span className="font-bold text-emerald-600">{questionCount}문제</span>
              </div>
              <input 
                type="range" min="5" max="30" step="5" 
                value={questionCount} 
                onChange={(e) => {
                  setQuestionCount(Number(e.target.value));
                  setExamProblems([]);
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>5</span>
                <span>30</span>
              </div>
            </div>
          </div>

          {/* [신규] 3. 사용 문항 필터 */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <CheckSquare className="w-4 h-4"/> 필터 설정
            </h3>
            <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-200 rounded-xl hover:bg-slate-50 bg-white transition-colors">
              <input 
                type="checkbox" 
                checked={excludeUsed} 
                onChange={(e) => {
                  setExcludeUsed(e.target.checked);
                  setExamProblems([]); // 필터 변경 시 리셋
                }}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 accent-emerald-600" 
              />
              <div>
                <span className="text-sm font-bold text-slate-700 block">이미 푼 문제 제외</span>
                <span className="text-[10px] text-slate-400">최근 1개월 학습 기록 기준 ({usedProblemIds.length}개)</span>
              </div>
            </label>
          </div>

        </div>
      </aside>


          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4"/> 배치 모드
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => setLayoutMode('dense')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs transition-all ${layoutMode === 'dense' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <QueueListIcon className="w-5 h-5 mb-1" />
                기본(빼곡)
              </button>
              <button 
                onClick={() => setLayoutMode('split-2')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs transition-all ${layoutMode === 'split-2' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <ViewColumnsIcon className="w-5 h-5 mb-1" />
                2분할
              </button>
              <button 
                onClick={() => setLayoutMode('split-4')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs transition-all ${layoutMode === 'split-4' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <Squares2X2Icon className="w-5 h-5 mb-1" />
                4분할
              </button>
            </div>

            {/* 기본 모드일 때만 간격 조절 표시 */}
            {layoutMode === 'dense' && (
              <div className="mt-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex justify-between text-xs mb-1 text-slate-600">
                   <span>문제 간격</span>
                   <span className="font-bold text-blue-600">{printOptions.questionPadding}px</span>
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


      <main className="flex-1 flex flex-col h-full relative bg-slate-100/50">
        
        {/* 상단 툴바 */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 z-20 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <input 
              type="text" 
              value={examTitle} 
              onChange={(e) => setExamTitle(e.target.value)}
              className="text-lg font-bold text-slate-800 outline-none placeholder:text-slate-300 bg-transparent w-full max-w-md"
              placeholder="시험지 제목 (예: 중간고사 대비 1회)"
            />
          </div>
          
          <div className="flex items-center gap-3">
    {/* [변경] '보관함 저장' 버튼 */}
    <button 
      onClick={handleSaveToStorage}
      disabled={examProblems.length === 0 || isSavingAndPrinting}
      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm"
    >
      <Save className="w-4 h-4" /> 
      {isSavingAndPrinting ? "저장 중..." : "보관함 저장 (출력)"}
    </button>

    {/* CBT 응시 버튼 (유지) */}
    <button 
      onClick={handleStartExam}
      disabled={isCreating || examProblems.length === 0}
      className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none"
    >
      {isCreating ? "생성 중..." : (
        <>
          <PlayIcon className="w-4 h-4" /> 바로 응시하기
        </>
      )}
    </button>
  </div>
</header>

        {/* 문제 목록 (Drag & Drop) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          
          {examProblems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
                <FileText className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-lg font-bold text-slate-500">생성된 문제가 없습니다.</p>
              <p className="text-sm mt-2">왼쪽 사이드바에서 단원과 난이도를 선택해주세요.</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="student-exam-builder">
                {(provided) => (
                  <div 
                    {...provided.droppableProps} 
                    ref={provided.innerRef} 
                    className="max-w-4xl mx-auto space-y-4 pb-20"
                  >
                    {examProblems.map((prob, index) => (
                      <Draggable key={prob.id} draggableId={prob.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`bg-white p-5 rounded-2xl border shadow-sm flex gap-5 transition-all group ${
                              snapshot.isDragging 
                                ? "shadow-xl ring-2 ring-emerald-500 rotate-1 z-50 border-emerald-500" 
                                : "border-slate-200 hover:border-emerald-300"
                            }`}
                          >
                            {/* 드래그 핸들 & 번호 */}
                            <div 
                              {...provided.dragHandleProps}
                              className="flex flex-col items-center justify-center gap-1 w-12 border-r border-slate-100 pr-5 cursor-grab active:cursor-grabbing text-slate-400 hover:text-emerald-600"
                            >
                              <ListOrdered className="w-5 h-5 mb-1" />
                              <span className="text-xl font-black text-slate-800">{prob.number}</span>
                            </div>

                            {/* 문제 정보 */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    prob.difficulty === '상' || prob.difficulty === '킬러'
                                      ? 'bg-orange-50 text-orange-600 border-orange-100' 
                                      : 'bg-slate-50 text-slate-500 border-slate-100'
                                  }`}>
                                    {prob.difficulty || '중'}
                                  </span>
                                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                    {prob.minorTopic || prob.majorTopic || "단원 정보"}
                                  </span>
                                </div>
                                
                                {/* 교체 버튼 */}
                                <button 
                                  onClick={() => handleReplaceProblem(prob.id, prob.majorTopic!, prob.difficulty || "중")}
                                  className="text-xs font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                  title="다른 문제로 바꾸기"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" /> 문제 교체
                                </button>
                              </div>
                              
                              {/* 이미지 미리보기 */}
                              <div className="relative min-h-[120px] bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden p-4 group-hover:border-emerald-100 transition-colors">
                                {prob.imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img 
                                    src={prob.imageUrl} 
                                    alt={`문제 ${prob.number}`} 
                                    className="max-w-full max-h-[200px] object-contain mix-blend-multiply" 
                                  />
                                ) : (
                                  <div className="text-center p-4">
                                    <p className="text-sm text-slate-600 mb-2">{prob.content}</p>
                                    <span className="text-xs text-slate-400">(이미지 없음)</span>
                                  </div>
                                )}
                              </div>
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
          )}
        </div>

        {/* === [Hidden] PDF 출력용 컴포넌트 === */}
        <div style={{ display: "none" }}>
          <ExamPaperLayout
            ref={printRef}
            problems={layoutProblems}
            title={examTitle}
            instructor={userData?.name || "학생"}
            template={TEMPLATES[0]}
            printOptions={{
              ...printOptions,
              layoutMode: layoutMode // [신규] 선택된 레이아웃 모드 전달
            }}
            isTeacherVersion={false}
          />
        </div>

      </main>
    </div>
  );
}