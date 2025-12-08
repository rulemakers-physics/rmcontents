// app/(student)/student/study/take/page.tsx

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { 
  ClockIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CheckCircleIcon,
  LightBulbIcon,
  EyeIcon,
  Bars3BottomRightIcon
} from "@heroicons/react/24/outline";
import { PencilSquareIcon } from "@heroicons/react/24/solid";
import { toast } from "react-hot-toast";

// DrawingLayer 경로는 프로젝트 구조에 맞게 확인해주세요
import DrawingLayer, { Stroke } from "@/components/DrawingLayer"; 

interface ExamProblem {
  problemId: string;
  number: number;
  content: string;
  imgUrl?: string;
  answer: string;
  explanation?: string;
  userAnswer?: number | null;
  isCorrect?: boolean;
}

interface StudentExam {
  id: string;
  title: string;
  status: string;
  mode?: 'test' | 'practice';
  totalQuestions: number;
  problems: ExamProblem[];
  createdAt: Timestamp;
}

export default function ExamTakePage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get("examId");

  const [exam, setExam] = useState<StudentExam | null>(null);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(0); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // [연습 모드] 문제별 정답 확인 여부
  const [checkedProblems, setCheckedProblems] = useState<Record<number, boolean>>({});

  // [필기] 기본 켜짐
  const [isPenMode, setIsPenMode] = useState(true); 
  const [drawings, setDrawings] = useState<Record<number, Stroke[]>>({});

  // 모바일 대응용 사이드바 토글
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 1. 시험지 로드
  useEffect(() => {
    if (!user || !examId) return;

    const fetchExam = async () => {
      try {
        const docRef = doc(db, "student_exams", examId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as Omit<StudentExam, "id">;
          
          if (data.status === 'completed') {
            toast("이미 제출된 시험입니다.");
            router.replace(`/student/report/${examId}`);
            return;
          }

          setExam({ id: docSnap.id, ...data });
          
          if (data.mode !== 'practice') {
            setTimeLeft(data.totalQuestions * 120); 
          }
        } else {
          toast.error("시험지를 찾을 수 없습니다.");
          router.back();
        }
      } catch (e) {
        console.error(e);
        toast.error("로드 실패");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExam();
  }, [user, examId, router]);

  // 2. 타이머
  useEffect(() => {
    if (!exam || exam.mode === 'practice' || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, exam]);

  useEffect(() => {
    if (exam && exam.mode !== 'practice' && timeLeft === 0 && !isLoading) {
       handleSubmit(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, exam, isLoading]);

  // 핸들러들
  const handleMark = (qNum: number, choice: number) => {
    setAnswers(prev => ({ ...prev, [qNum]: choice }));
  };

  const handleCheckAnswer = (qNum: number) => {
    if (!answers[qNum]) return toast.error("답안을 먼저 선택해주세요.");
    setCheckedProblems(prev => ({ ...prev, [qNum]: true }));
  };

  const handleSaveDrawing = (newStrokes: Stroke[]) => {
    if (!exam) return;
    const currentNum = exam.problems[currentQIdx].number;
    setDrawings(prev => ({ ...prev, [currentNum]: newStrokes }));
  };

  const handleSubmit = useCallback(async (isTimeOut = false) => {
    if (!exam || isSubmitting) return;

    if (!isTimeOut) {
      const answeredCount = Object.keys(answers).length;
      if (answeredCount < exam.totalQuestions) {
        if (!confirm(`아직 ${exam.totalQuestions - answeredCount}문제를 풀지 않았습니다. 정말 제출하시겠습니까?`)) return;
      } else {
        if (!confirm(exam.mode === 'practice' ? "학습을 종료하시겠습니까?" : "답안을 제출하시겠습니까?")) return;
      }
    }

    setIsSubmitting(true);
    const toastId = toast.loading("채점 중...");

    try {
      let correctCount = 0;
      const gradedProblems = exam.problems.map(p => {
        const userAns = answers[p.number] || 0;
        const isCorrect = String(userAns) === String(p.answer);
        if (isCorrect) correctCount++;
        return { ...p, userAnswer: userAns, isCorrect };
      });

      const score = Math.round((correctCount / exam.totalQuestions) * 100);

      await updateDoc(doc(db, "student_exams", exam.id), {
        problems: gradedProblems,
        score,
        correctCount,
        status: "completed",
        completedAt: serverTimestamp(),
        timeSpent: exam.mode !== 'practice' ? (exam.totalQuestions * 120) - timeLeft : null
      });

      toast.success(`완료! 점수: ${score}점`, { id: toastId });
      router.replace(`/student/report/${exam.id}`);

    } catch (e) {
      console.error(e);
      toast.error("오류 발생", { id: toastId });
      setIsSubmitting(false);
    }
  }, [exam, answers, isSubmitting, timeLeft, router]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isLoading || !exam) return <div className="flex h-screen items-center justify-center font-bold text-slate-500">로딩 중...</div>;

  const currentQ = exam.problems[currentQIdx];
  const isPractice = exam.mode === 'practice';
  const isChecked = checkedProblems[currentQ.number];
  const isCorrect = String(answers[currentQ.number]) === String(currentQ.answer);

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      
      {/* [1. 메인 시험지 영역] 
        - 왼쪽 전체를 차지
        - 문제 텍스트/이미지 위에 DrawingLayer가 오버레이됨
      */}
      <div className="flex-1 flex flex-col relative h-full">
        {/* 상단 헤더 (타이틀 & 툴바) */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-20 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600">
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-bold text-slate-800 truncate max-w-[200px] md:max-w-md">{exam.title}</h1>
          </div>
          
          <div className="flex items-center gap-3">
             {/* 필기 모드 토글 */}
            <button
              onClick={() => setIsPenMode(!isPenMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                isPenMode ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              <PencilSquareIcon className="w-4 h-4" />
              {isPenMode ? "필기 ON" : "필기 OFF"}
            </button>
            
            {/* 사이드바 토글 (모바일용) */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 text-slate-500 bg-slate-50 rounded-lg"
            >
              <Bars3BottomRightIcon className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* 시험지 컨텐츠 영역 (스크롤 가능) 
            - Canvas와 컨텐츠가 같이 스크롤 되어야 하므로 
              relative wrapper(overflow-auto) 안에 컨텐츠와 canvas를 absolute로 배치
        */}
        <div className="flex-1 relative overflow-hidden bg-white">
          {/* 스크롤 가능한 컨테이너 */}
          <div className="w-full h-full overflow-y-auto relative custom-scrollbar">
            
            {/* A. 문제 컨텐츠 (가장 밑바닥 레이어, z-0) */}
            <div className="min-h-full w-full flex flex-col items-center p-8 md:p-12 pb-32">
              <div className="max-w-3xl w-full">
                {/* 문제 번호 */}
                <div className="mb-6 border-b-2 border-slate-800 pb-2 flex justify-between items-end select-none">
                  <h2 className="text-3xl font-black text-slate-800">Q.{currentQ.number}</h2>
                  {isPractice && isChecked && (
                    <span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                      {isCorrect ? "정답입니다! 🎉" : "오답입니다 😅"}
                    </span>
                  )}
                </div>

                {/* 문제 내용 (텍스트 드래그 방지: select-none) */}
                <div className="prose prose-slate max-w-none select-none pointer-events-none">
                  {currentQ.imgUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={currentQ.imgUrl} alt="문제" className="w-full max-w-2xl mx-auto object-contain border border-slate-100 rounded-lg mb-8" />
                  ) : (
                    <p className="text-xl leading-loose text-slate-900 font-serif whitespace-pre-wrap mb-8">
                      {currentQ.content}
                    </p>
                  )}
                  
                  {/* (선택지가 텍스트라면 여기에 표시할 수도 있지만, 보통은 OMR로 대체) */}
                </div>

                {/* 연습 모드 해설 (문제 아래에 표시) */}
                {isPractice && isChecked && (
                   <div className="mt-12 p-6 bg-yellow-50 border border-yellow-100 rounded-xl select-text pointer-events-auto">
                     <h3 className="font-bold text-yellow-800 flex items-center gap-2 mb-3">
                       <LightBulbIcon className="w-5 h-5" /> 해설
                     </h3>
                     <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                       {currentQ.explanation || "해설이 없습니다."}
                     </p>
                   </div>
                )}
              </div>
            </div>

            {/* B. Drawing Layer (그 위에 덮는 레이어, z-10) */}
            {/* inset-0으로 설정하여 컨텐츠 높이에 맞춰 늘어나게 함 */}
            <div className={`absolute inset-0 w-full min-h-full z-10 ${!isPenMode ? 'pointer-events-none' : ''}`}>
               <DrawingLayer 
                  initialData={drawings[currentQ.number] || []}
                  onSave={handleSaveDrawing}
                  disabled={!isPenMode}
               />
            </div>

          </div>
        </div>
      </div>

      {/* [2. 우측 OMR 사이드바]
        - 문제 답안 마킹 및 네비게이션
      */}
      <div className={`
        fixed inset-y-0 right-0 z-30 w-80 bg-slate-50 border-l border-slate-200 shadow-xl flex flex-col transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        md:relative md:translate-x-0 md:flex-shrink-0
      `}>
        
        {/* 사이드바 헤더 (타이머 & 상태) */}
        <div className="p-5 bg-white border-b border-slate-200">
           {!isPractice ? (
            <div className={`flex items-center justify-between font-mono font-bold text-xl ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>
              <div className="flex items-center gap-2">
                <ClockIcon className="w-6 h-6" />
                <span>남은 시간</span>
              </div>
              <span>{formatTime(timeLeft)}</span>
            </div>
           ) : (
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-lg">
              <CheckCircleIcon className="w-6 h-6" />
              <span>학습 모드</span>
            </div>
           )}
           <div className="mt-2 text-xs text-slate-400 font-medium text-right">
             진행률: {Math.round((Object.keys(answers).length / exam.totalQuestions) * 100)}%
           </div>
        </div>

        {/* 현재 문제 답안 마킹 (가장 중요한 액션) */}
        <div className="p-6 bg-white border-b border-slate-200 flex-shrink-0">
          <div className="mb-3 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">정답 표기</h3>
            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">Q.{currentQ.number}</span>
          </div>
          
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((num) => {
               const isSelected = answers[currentQ.number] === num;
               let btnClass = "h-12 rounded-lg border-2 font-bold text-lg transition-all active:scale-95 shadow-sm ";
               
               if (isPractice && isChecked) {
                 // 결과 표시
                 if (String(num) === String(currentQ.answer)) {
                    btnClass += "bg-green-500 border-green-500 text-white";
                 } else if (isSelected) {
                    btnClass += "bg-red-500 border-red-500 text-white";
                 } else {
                    btnClass += "bg-slate-50 border-slate-100 text-slate-300";
                 }
               } else {
                 // 일반 선택
                 if (isSelected) {
                    btnClass += "bg-slate-800 border-slate-800 text-white";
                 } else {
                    btnClass += "bg-white border-slate-200 text-slate-500 hover:border-slate-400 hover:bg-slate-50";
                 }
               }

               return (
                 <button
                   key={num}
                   onClick={() => !isChecked && handleMark(currentQ.number, num)}
                   disabled={isPractice && isChecked}
                   className={btnClass}
                 >
                   {num}
                 </button>
               )
            })}
          </div>

          {/* 연습모드 정답확인 버튼 */}
          {isPractice && !isChecked && (
            <button 
              onClick={() => handleCheckAnswer(currentQ.number)}
              className="w-full mt-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-indigo-200 shadow-lg transition-all"
            >
              <EyeIcon className="w-5 h-5" /> 정답 확인
            </button>
          )}
        </div>

        {/* 문항 네비게이션 그리드 (스크롤) */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50">
          <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Question List</h4>
          <div className="grid grid-cols-5 gap-2.5">
            {exam.problems.map((q, idx) => {
              const isActive = currentQIdx === idx;
              const isMarked = !!answers[q.number];
              const isQChecked = isPractice && checkedProblems[q.number];
              const isQCorrect = isQChecked && String(answers[q.number]) === String(q.answer);
              
              let gridClass = "aspect-square rounded-lg text-xs font-bold border flex items-center justify-center transition-all ";
              
              if (isActive) {
                 gridClass += "ring-2 ring-indigo-500 border-transparent z-10 scale-105 ";
              } else {
                 gridClass += "border-slate-200 ";
              }

              if (isPractice && isQChecked) {
                 gridClass += isQCorrect ? "bg-green-100 text-green-700 border-green-200 " : "bg-red-50 text-red-500 border-red-200 ";
              } else if (isMarked) {
                 gridClass += isActive ? "bg-indigo-600 text-white " : "bg-slate-700 text-white border-slate-700 ";
              } else {
                 gridClass += "bg-white text-slate-400 hover:bg-white hover:text-slate-600 ";
              }

              return (
                <button
                  key={q.problemId}
                  onClick={() => setCurrentQIdx(idx)}
                  className={gridClass}
                >
                  {q.number}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* 네비게이션 버튼 & 제출 */}
        <div className="p-5 bg-white border-t border-slate-200 space-y-3">
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentQIdx(prev => Math.max(0, prev - 1))}
              disabled={currentQIdx === 0}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-50 text-slate-600"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setCurrentQIdx(prev => Math.min(exam.totalQuestions - 1, prev + 1))}
              disabled={currentQIdx === exam.totalQuestions - 1}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-50 text-slate-600"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>

          <button 
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-70 ${
              isPractice ? "bg-slate-800 hover:bg-slate-700" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isSubmitting ? "처리 중..." : (isPractice ? "학습 종료하기" : "답안 제출하기")}
          </button>
        </div>

      </div>
    </div>
  );
}