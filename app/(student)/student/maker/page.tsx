"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Save
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useReactToPrint } from "react-to-print";
import { toast } from "react-hot-toast";

// 프로젝트 내 컴포넌트 및 타입 임포트
import { useProblemFetcher } from "@/hooks/useProblemFetcher";
import { SCIENCE_UNITS } from "@/types/scienceUnits";
import { Difficulty, DBProblem } from "@/types/problem";
import ExamPaperLayout, { ExamProblem as LayoutExamProblem } from "@/components/ExamPaperLayout";
import { TEMPLATES } from "@/types/examTemplates";

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
}

export default function StudentMakerPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  
  // 학생 플랜 확인 (STD_PREMIUM인지 확인)
  const isPremium = userData?.plan === 'STD_PREMIUM';

  // --- 상태 관리 ---
  const [activeTab, setActiveTab] = useState<'filter' | 'list'>('filter');
  
  // 필터 상태
  const [selectedMajorTopics, setSelectedMajorTopics] = useState<string[]>([]);
  const [selectedMinorTopics, setSelectedMinorTopics] = useState<string[]>([]); // 소단원 필터 추가 가능
  const [difficulties, setDifficulties] = useState<Difficulty[]>(["중"]);
  const [questionCount, setQuestionCount] = useState(10); 

  // 생성된 문제 목록
  const [examProblems, setExamProblems] = useState<StudentExamProblem[]>([]);
  const [examTitle, setExamTitle] = useState("나만의 모의고사");
  const [isCreating, setIsCreating] = useState(false);

  // PDF 출력용 Ref
  const printRef = useRef<HTMLDivElement>(null);

  // 문제 데이터 Fetcher Hook 사용
  const { problems: fetchedProblems, loading: isFetching } = useProblemFetcher({
    selectedMajorTopics,
    selectedMinorTopics,
    difficulties
  });

  // 1. 문제 자동 구성 (Fetcher 결과 반영)
  useEffect(() => {
    if (isFetching) return;
    
    // 필터 조건이 변경되어 새로운 문제들이 로드되었고, 현재 문제 리스트가 비어있다면 채워넣음
    // (실제 UX에서는 '생성' 버튼을 눌러야 바뀌게 할 수도 있지만, 여기선 반응형으로 구현)
    if (fetchedProblems.length > 0 && examProblems.length === 0) {
       const formatted = fetchedProblems.slice(0, questionCount).map((p, idx) => ({
         id: p.id,
         number: idx + 1,
         imageUrl: p.imgUrl,
         content: p.content,
         difficulty: p.difficulty,
         majorTopic: p.majorTopic,
         minorTopic: p.minorTopic,
         answer: p.answer,
         solutionUrl: p.solutionUrl
       }));
       setExamProblems(formatted);
    }
  }, [fetchedProblems, questionCount, examProblems.length, isFetching]);

  // 2. 문제 교체 (Reroll) 핸들러
  const handleReplaceProblem = useCallback(async (problemId: string, currentMajor: string, currentDifficulty: string) => {
    if (!currentMajor) return;
    const toastId = toast.loading("유사 문제를 찾는 중...");

    try {
      // 같은 단원, 같은 난이도의 문제 조회
      const q = query(
        collection(db, "problems"),
        where("majorTopic", "==", currentMajor),
        where("difficulty", "==", currentDifficulty),
        limit(20) // 넉넉히 가져와서 랜덤 선택
      );
      const snap = await getDocs(q);
      const candidates = snap.docs.map(d => ({ id: d.id, ...d.data() } as DBProblem));
      
      // 현재 리스트에 이미 있는 문제는 제외
      const currentIds = examProblems.map(p => p.id);
      const validCandidates = candidates.filter(p => !currentIds.includes(p.id));

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
              solutionUrl: newProbData.solutionUrl
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
  }, [examProblems]);

  // 3. 온라인 시험 시작 (CBT)
  const handleStartExam = async () => {
    if (examProblems.length === 0) return toast.error("문제가 없습니다. 조건을 선택해주세요.");
    if (!examTitle.trim()) return toast.error("시험지 제목을 입력해주세요.");

    setIsCreating(true);
    const toastId = toast.loading("시험지를 생성하고 있습니다...");

    try {
      // student_exams 컬렉션에 저장 (CBT용)
      const examRef = await addDoc(collection(db, "student_exams"), {
        userId: user?.uid,
        userName: userData?.name || "학생",
        title: examTitle,
        createdAt: serverTimestamp(),
        status: "in_progress",
        totalQuestions: examProblems.length,
        difficulty: difficulties.join(", "),
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

  // 4. PDF 출력 핸들러
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: examTitle,
  });

  // Drag End 핸들러
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(examProblems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // 번호 재할당
    const renumbered = items.map((item, idx) => ({ ...item, number: idx + 1 }));
    setExamProblems(renumbered);
  };

  // 난이도 토글 (학생용: 킬러 제한)
  const toggleDifficulty = (d: Difficulty) => {
    if (d === '킬러' && !isPremium) {
      if(confirm("킬러 문항은 프리미엄 멤버십 전용입니다.\n멤버십을 업그레이드 하시겠습니까?")) {
         router.push("/pricing");
      }
      return;
    }
    setDifficulties(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  // 페이지네이션용 (PDF 출력용 데이터 변환)
  const pagedProblems = React.useMemo(() => {
    const itemsPerPage = 4; // 페이지당 4문제
    const pages: LayoutExamProblem[][] = [];
    for (let i = 0; i < examProblems.length; i += itemsPerPage) {
      // 타입 호환성을 위해 변환
      const pageSlice = examProblems.slice(i, i + itemsPerPage).map(p => ({
        ...p,
        answer: p.answer || null, // nullish 처리 확실하게
        imageUrl: p.imageUrl || null,
        solutionUrl: p.solutionUrl || null
      }));
      pages.push(pageSlice);
    }
    return pages;
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
                            // 새로운 단원 선택 시 문제 목록 초기화하고 다시 불러오기
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
                    onClick={() => {
                      toggleDifficulty(level as Difficulty);
                      setExamProblems([]); // 난이도 변경 시 리셋
                    }}
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
                  setExamProblems([]); // 문항 수 변경 시 리셋
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>5</span>
                <span>30</span>
              </div>
            </div>
          </div>

        </div>
      </aside>

      {/* === [Right] 메인 편집 영역 === */}
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
            {/* PDF 출력 버튼 */}
            <button 
              onClick={() => handlePrint && handlePrint()}
              disabled={examProblems.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 hover:text-blue-600 transition-colors"
            >
              <Printer className="w-4 h-4" /> PDF 저장
            </button>

            {/* CBT 응시 버튼 */}
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

        {/* === [Hidden] PDF 출력용 컴포넌트 === 
          화면에는 보이지 않지만(handlePrint 실행 시) 렌더링되어 인쇄됨.
          강사용 ExamPaperLayout을 재사용하되, 심플한 옵션 적용.
        */}
        <div style={{ display: "none" }}>
          <ExamPaperLayout
            ref={printRef}
            pages={pagedProblems}
            title={examTitle}
            instructor={userData?.name || "학생"}
            template={TEMPLATES[0]} // 기본 심플 템플릿 사용
            printOptions={{
              questions: true,
              answers: true,  // 정답 포함
              solutions: false // 해설 미포함 (기본값)
            }}
            isTeacherVersion={false}
          />
        </div>

      </main>
    </div>
  );
}