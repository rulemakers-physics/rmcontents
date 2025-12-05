// app/(student)/student/study/take/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
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
  EyeIcon
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

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
  mode?: 'test' | 'practice'; // 학습 모드
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

  // [연습 모드용] 문제별 정답 확인 여부 (true면 해설 표시)
  const [checkedProblems, setCheckedProblems] = useState<Record<number, boolean>>({});

  // 1. 시험지 로드
  useEffect(() => {
    if (!user || !examId) return;

    const fetchExam = async () => {
      try {
        const docRef = doc(db, "student_exams", examId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          // [수정됨] Omit을 사용하여 data 내부에 id가 없음을 명시하여 충돌 방지
          const data = docSnap.data() as Omit<StudentExam, "id">;
          
          // 이미 완료된 시험이면 리포트 페이지로 리다이렉트
          if (data.status === 'completed') {
            toast("이미 제출된 시험입니다.");
            router.replace(`/student/report/${examId}`);
            return;
          }

          // 이제 data에는 id가 없으므로 여기서 id를 병합해도 충돌 경고가 발생하지 않음
          setExam({ id: docSnap.id, ...data });
          
          // 실전 모드일 때만 타이머 설정 (문항당 2분)
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

  // 2. 타이머 동작 (실전 모드)
  useEffect(() => {
    if (!exam || exam.mode === 'practice' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // 시간 초과 시 자동 제출
          // 여기서는 handleSubmit을 직접 부르는 대신 별도 처리
          // (의존성 문제 회피를 위해 alert 후 이동 등 간소화 가능하나, handleSubmit 호출 시도)
          // 아래 handleSubmit은 useCallback으로 감싸져 있음.
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, exam]);

  // 시간이 0이 되었을 때 자동 제출 트리거 (useEffect 분리)
  useEffect(() => {
    if (exam && exam.mode !== 'practice' && timeLeft === 0 && !isLoading) {
       handleSubmit(true);
    }
  }, [timeLeft, exam, isLoading]);


  // 답안 마킹 핸들러
  const handleMark = (qNum: number, choice: number) => {
    setAnswers(prev => ({ ...prev, [qNum]: choice }));
  };

  // [연습 모드] 정답 확인 핸들러
  const handleCheckAnswer = (qNum: number) => {
    if (!answers[qNum]) return toast.error("답안을 먼저 선택해주세요.");
    setCheckedProblems(prev => ({ ...prev, [qNum]: true }));
  };

  // 제출 및 채점 로직
  const handleSubmit = useCallback(async (isTimeOut = false) => {
    if (!exam || isSubmitting) return;

    // 강제 제출(시간초과)이 아니면 확인 창 띄우기
    if (!isTimeOut) {
      const answeredCount = Object.keys(answers).length;
      if (answeredCount < exam.totalQuestions) {
        if (!confirm(`아직 ${exam.totalQuestions - answeredCount}문제를 풀지 않았습니다. 정말 제출하시겠습니까?`)) return;
      } else {
        if (!confirm(exam.mode === 'practice' ? "학습을 종료하고 결과를 저장하시겠습니까?" : "답안을 제출하시겠습니까?")) return;
      }
    }

    setIsSubmitting(true);
    const toastId = toast.loading("채점 및 저장 중...");

    try {
      let correctCount = 0;
      
      // 문제 배열 순회하며 채점
      const gradedProblems = exam.problems.map(p => {
        const userAns = answers[p.number] || 0; // 미응답은 0
        const isCorrect = String(userAns) === String(p.answer);
        if (isCorrect) correctCount++;
        
        return {
          ...p,
          userAnswer: userAns,
          isCorrect
        };
      });

      const score = Math.round((correctCount / exam.totalQuestions) * 100);

      // DB 업데이트
      await updateDoc(doc(db, "student_exams", exam.id), {
        problems: gradedProblems,
        score,
        correctCount,
        status: "completed",
        completedAt: serverTimestamp(),
        // 소요 시간 저장 (실전모드: 전체시간 - 남은시간, 연습모드: null 또는 별도 측정)
        timeSpent: exam.mode !== 'practice' ? (exam.totalQuestions * 120) - timeLeft : null
      });

      toast.success(`채점 완료! 점수: ${score}점`, { id: toastId });
      
      // 결과 페이지로 이동
      router.replace(`/student/report/${exam.id}`);

    } catch (e) {
      console.error(e);
      toast.error("제출 중 오류가 발생했습니다.", { id: toastId });
      setIsSubmitting(false);
    }
  }, [exam, answers, isSubmitting, timeLeft, router]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isLoading || !exam) return <div className="flex h-screen items-center justify-center text-emerald-600 font-bold">시험지를 불러오는 중...</div>;

  const currentQ = exam.problems[currentQIdx];
  const isPractice = exam.mode === 'practice';
  
  // 현재 문제 확인 여부 (연습 모드)
  const isChecked = checkedProblems[currentQ.number];
  // 정답 여부 (화면 표시용)
  const isCorrect = String(answers[currentQ.number]) === String(currentQ.answer);

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      
      {/* 1. 메인 문제 영역 */}
      <div className="flex-1 flex flex-col h-full relative">
        
        {/* 상단 헤더 */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${isPractice ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-800 text-white'}`}>
              {isPractice ? 'Practice Mode' : 'Real Test'}
            </span>
            <h1 className="text-lg font-bold text-slate-800 truncate max-w-md">{exam.title}</h1>
          </div>
          {!isPractice && (
            <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
              <ClockIcon className="w-6 h-6" />
              {formatTime(timeLeft)}
            </div>
          )}
        </header>

        {/* 문제 뷰어 (스크롤 영역) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-slate-50">
          <div className="max-w-3xl w-full space-y-6">
            
            {/* 문제 카드 */}
            <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6 md:p-10 relative">
              <div className="flex justify-between items-start mb-6">
                <span className="text-emerald-600 font-extrabold text-2xl border-b-2 border-emerald-600 pb-1">
                  Q{currentQ.number}.
                </span>
                
                {/* [연습 모드] 정답 확인 결과 배지 */}
                {isPractice && isChecked && (
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1 ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isCorrect ? "정답입니다! 🎉" : "오답입니다 😅"}
                  </span>
                )}
              </div>
              
              {/* 문제 이미지/텍스트 */}
              <div className="min-h-[250px] mb-8 flex flex-col items-center justify-center">
                {currentQ.imgUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={currentQ.imgUrl} alt="문제" className="max-w-full object-contain max-h-[500px]" />
                ) : (
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-lg text-center px-4">
                    {currentQ.content || "문제 내용이 없습니다."}
                  </p>
                )}
              </div>

              {/* 선택지 (5지선다) */}
              <div className="grid grid-cols-5 gap-3 md:gap-4 pt-6 border-t border-slate-100">
                {[1, 2, 3, 4, 5].map((num) => {
                  const isSelected = answers[currentQ.number] === num;
                  
                  // 스타일링 로직
                  let btnStyle = "border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-600 hover:bg-slate-50";
                  
                  // [연습 모드 & 확인 됨]
                  if (isPractice && isChecked) {
                    if (String(num) === String(currentQ.answer)) {
                      // 실제 정답 (초록색)
                      btnStyle = "bg-green-500 text-white border-green-500 shadow-md ring-2 ring-green-200"; 
                    } else if (isSelected) {
                      // 내가 고른 오답 (빨간색)
                      btnStyle = "bg-red-500 text-white border-red-500 shadow-md ring-2 ring-red-200"; 
                    } else {
                      // 나머지
                      btnStyle = "border-slate-100 text-slate-300 opacity-50";
                    }
                  } 
                  // [일반 선택 상태]
                  else if (isSelected) {
                    btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-700 font-extrabold ring-1 ring-emerald-200";
                  }

                  return (
                    <button
                      key={num}
                      onClick={() => !isChecked && handleMark(currentQ.number, num)}
                      disabled={isPractice && isChecked} // 확인 후 변경 불가
                      className={`py-3 md:py-4 rounded-xl border-2 text-lg font-bold transition-all ${btnStyle}`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* [연습 모드] 해설 카드 (확인 시에만 노출) */}
            {isPractice && isChecked && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm animate-in slide-in-from-bottom-4 duration-500">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <LightBulbIcon className="w-5 h-5 text-yellow-500" /> 해설 및 풀이
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {currentQ.explanation || "해설이 준비되지 않았습니다."}
                </p>
              </div>
            )}

            {/* [연습 모드] 정답 확인 버튼 */}
            {isPractice && !isChecked && (
              <div className="flex justify-center pb-10">
                <button 
                  onClick={() => handleCheckAnswer(currentQ.number)}
                  className="px-8 py-3 bg-slate-800 text-white rounded-full font-bold shadow-lg hover:bg-slate-700 transition-transform active:scale-95 flex items-center gap-2"
                >
                  <EyeIcon className="w-5 h-5" /> 정답 확인하기
                </button>
              </div>
            )}

          </div>
        </div>

        {/* 하단 네비게이션 */}
        <div className="h-20 bg-white border-t border-slate-200 flex items-center justify-center gap-6 md:gap-12 flex-shrink-0 px-4 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
          <button 
            onClick={() => {
              setCurrentQIdx(prev => Math.max(0, prev - 1));
              // 페이지 이동 시 상단 스크롤 등의 처리가 필요할 수 있음
            }}
            disabled={currentQIdx === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent font-bold text-slate-600 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" /> <span className="hidden md:inline">이전 문제</span>
          </button>
          
          <span className="text-slate-400 font-medium text-lg">
            <span className="text-slate-900 font-black">{currentQIdx + 1}</span> / {exam.totalQuestions}
          </span>

          <button 
            onClick={() => setCurrentQIdx(prev => Math.min(exam.totalQuestions - 1, prev + 1))}
            disabled={currentQIdx === exam.totalQuestions - 1}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent font-bold text-slate-600 transition-colors"
          >
            <span className="hidden md:inline">다음 문제</span> <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. OMR 카드 (PC: 사이드바) */}
      <div className="hidden md:flex w-80 bg-white border-l border-slate-200 flex-col z-20 shadow-xl">
        <div className="p-6 border-b border-slate-100 bg-emerald-50">
          <h2 className="font-bold text-emerald-900 text-lg flex items-center gap-2">
            <CheckCircleIcon className="w-6 h-6" /> OMR 카드
          </h2>
          <p className="text-emerald-600 text-xs mt-1 font-medium">
            {isPractice ? "풀이 현황" : `남은 문항: ${exam.totalQuestions - Object.keys(answers).length}개`}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar bg-slate-50/50">
          {exam.problems.map((q, idx) => {
            const isAnsSelected = !!answers[q.number];
            const isQChecked = isPractice && checkedProblems[q.number];
            const isQCorrect = String(answers[q.number]) === String(q.answer);

            return (
              <div key={q.problemId} className="flex items-center justify-between group p-2 rounded-lg hover:bg-white transition-colors">
                <span 
                  onClick={() => setCurrentQIdx(idx)}
                  className={`w-8 font-bold text-sm cursor-pointer ${currentQIdx === idx ? 'text-emerald-600 underline' : 'text-slate-500'}`}
                >
                  {q.number}
                </span>
                
                {/* 문항별 상태 표시 */}
                <div className="flex gap-1.5">
                  {/* 연습 모드에서 확인 완료 시: O/X 표시 */}
                  {isPractice && isQChecked ? (
                    <div className={`w-full text-right text-xs font-bold ${isQCorrect ? 'text-green-600' : 'text-red-500'}`}>
                      {isQCorrect ? "정답" : "오답"}
                    </div>
                  ) : (
                    // 일반 모드 또는 확인 전: 번호 버튼들
                    [1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() => !isQChecked && handleMark(q.number, num)}
                        disabled={isPractice && isQChecked}
                        className={`w-6 h-6 rounded-full text-[10px] font-bold border transition-all ${
                          answers[q.number] === num
                            ? "bg-slate-800 border-slate-800 text-white"
                            : "bg-white border-slate-200 text-slate-300 hover:border-slate-400"
                        }`}
                      >
                        {num}
                      </button>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-6 border-t border-slate-200 bg-white">
          <button 
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
              isPractice 
               ? "bg-slate-800 text-white hover:bg-slate-700 shadow-slate-200" 
               : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200"
            }`}
          >
            {isSubmitting ? "처리 중..." : (isPractice ? "학습 종료" : "답안 제출")}
          </button>
        </div>
      </div>

    </div>
  );
}