// app/(student)/student/study/take/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { 
  ClockIcon, ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon 
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

interface ExamProblem {
  problemId: string;
  number: number;
  content: string;
  imgUrl?: string;
  answer: string; // 정답
  userAnswer?: number | null; // 학생 답
  isCorrect?: boolean;
}

interface StudentExam {
  id: string;
  title: string;
  status: string;
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
  const [timeLeft, setTimeLeft] = useState(0); // 초 단위
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. 시험지 데이터 불러오기
  useEffect(() => {
    if (!user || !examId) return;

    const fetchExam = async () => {
      try {
        const docRef = doc(db, "student_exams", examId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as StudentExam;
          
          // 이미 완료된 시험이면 리포트 페이지로 이동
          if (data.status === 'completed') {
            toast("이미 제출된 시험입니다.");
            router.replace(`/student/report/${examId}`);
            return;
          }

          setExam({ id: docSnap.id, ...data });
          
          // 제한 시간 설정 (문항당 2분 계산)
          setTimeLeft(data.totalQuestions * 120); 
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

  // 2. 타이머 동작
  useEffect(() => {
    if (!exam || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true); // 시간 초과 시 강제 제출
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, exam]); // 의존성 배열 수정

  // 답안 마킹
  const handleMark = (qNum: number, choice: number) => {
    setAnswers(prev => ({ ...prev, [qNum]: choice }));
  };

  // 제출 및 채점 로직
  const handleSubmit = useCallback(async (isTimeOut = false) => {
    if (!exam || isSubmitting) return;

    if (!isTimeOut) {
      const answeredCount = Object.keys(answers).length;
      if (answeredCount < exam.totalQuestions) {
        if (!confirm(`아직 ${exam.totalQuestions - answeredCount}문제를 풀지 않았습니다. 제출하시겠습니까?`)) return;
      } else {
        if (!confirm("답안을 제출하시겠습니까?")) return;
      }
    }

    setIsSubmitting(true);
    const toastId = toast.loading("채점 중입니다...");

    try {
      // 채점 로직
      let correctCount = 0;
      const gradedProblems = exam.problems.map(p => {
        const userAns = answers[p.number] || 0; // 미응답은 0 처리
        // 정답 비교 (문자열/숫자 형변환 주의)
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
        timeSpent: (exam.totalQuestions * 120) - timeLeft // 소요 시간 기록
      });

      // 학습 코인 지급 (예: 100점이면 5코인, 그 외 1코인)
      // await updateDoc(doc(db, "users", user.uid), { coins: increment(score === 100 ? 5 : 1) });

      toast.success(`채점 완료! 점수: ${score}점`, { id: toastId });
      router.replace(`/student/report/${exam.id}`); // 상세 결과 페이지로 이동

    } catch (e) {
      console.error(e);
      toast.error("제출 중 오류가 발생했습니다.", { id: toastId });
      setIsSubmitting(false);
    }
  }, [exam, answers, isSubmitting, timeLeft, router]); // useCallback 의존성 추가

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isLoading || !exam) return <div className="flex h-screen items-center justify-center text-emerald-600">시험지 불러오는 중...</div>;

  const currentQ = exam.problems[currentQIdx];

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      
      {/* 1. 문제 영역 (메인) */}
      <div className="flex-1 flex flex-col h-full relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
              Test Mode
            </span>
            <h1 className="text-lg font-bold text-slate-800 truncate max-w-md">{exam.title}</h1>
          </div>
          <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
            <ClockIcon className="w-6 h-6" />
            {formatTime(timeLeft)}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-slate-50">
          <div className="max-w-3xl w-full bg-white min-h-[600px] shadow-sm border border-slate-200 rounded-xl p-6 md:p-10 relative">
            <span className="absolute top-6 left-6 text-emerald-600 font-extrabold text-2xl border-b-2 border-emerald-600 pb-1">
              Q{currentQ.number}.
            </span>
            
            <div className="mt-10 space-y-8">
              {/* 문제 이미지/텍스트 영역 */}
              <div className="min-h-[300px] flex flex-col items-center">
                {currentQ.imgUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentQ.imgUrl} alt="문제 이미지" className="max-w-full object-contain max-h-[500px]" />
                ) : (
                  <div className="w-full p-10 bg-slate-50 rounded-xl text-center text-slate-400">
                    이미지가 없는 문항입니다. <br/> {currentQ.content}
                  </div>
                )}
              </div>
              
              {/* 선택지 (빠른 마킹용) */}
              <div className="grid grid-cols-5 gap-3 md:gap-4 pt-4 border-t border-slate-100">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleMark(currentQ.number, num)}
                    className={`py-3 md:py-4 rounded-xl border-2 text-lg font-bold transition-all ${
                      answers[currentQ.number] === num
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 hover:border-emerald-300 text-slate-400 hover:text-emerald-600"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 하단 네비게이션 */}
        <div className="h-16 md:h-20 bg-white border-t border-slate-200 flex items-center justify-center gap-4 md:gap-8 flex-shrink-0 px-4">
          <button 
            onClick={() => setCurrentQIdx(prev => Math.max(0, prev - 1))}
            disabled={currentQIdx === 0}
            className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent font-bold text-slate-600 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" /> <span className="hidden md:inline">이전 문제</span>
          </button>
          
          <span className="text-slate-400 font-medium text-sm md:text-base">
            <span className="text-slate-900 font-bold">{currentQIdx + 1}</span> / {exam.totalQuestions}
          </span>

          <button 
            onClick={() => setCurrentQIdx(prev => Math.min(exam.totalQuestions - 1, prev + 1))}
            disabled={currentQIdx === exam.totalQuestions - 1}
            className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent font-bold text-slate-600 transition-colors"
          >
            <span className="hidden md:inline">다음 문제</span> <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. OMR 카드 (PC: 사이드바, Mobile: 숨김/모달 처리 필요하지만 일단 PC 최적화) */}
      <div className="hidden md:flex w-80 bg-white border-l border-slate-200 flex-col z-20 shadow-xl">
        <div className="p-6 border-b border-slate-100 bg-emerald-50">
          <h2 className="font-bold text-emerald-900 text-lg flex items-center gap-2">
            <CheckCircleIcon className="w-6 h-6" /> OMR 카드
          </h2>
          <p className="text-emerald-600 text-xs mt-1">남은 문항: {exam.totalQuestions - Object.keys(answers).length}개</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
          {exam.problems.map((q, idx) => (
            <div key={q.problemId} className="flex items-center justify-between group">
              <span 
                onClick={() => setCurrentQIdx(idx)}
                className={`w-8 font-bold text-sm cursor-pointer hover:text-emerald-600 ${currentQIdx === idx ? 'text-emerald-600 underline' : 'text-slate-500'}`}
              >
                {q.number}
              </span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleMark(q.number, num)}
                    className={`w-7 h-7 rounded-full text-xs font-bold border transition-all ${
                      answers[q.number] === num
                        ? "bg-slate-800 border-slate-800 text-white"
                        : "bg-white border-slate-200 text-slate-300 hover:border-slate-400"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <button 
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? "제출 중..." : "답안 제출"}
          </button>
        </div>
      </div>

    </div>
  );
}