"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { 
  doc, getDoc, updateDoc, addDoc, collection, serverTimestamp, 
  query, where, getDocs, limit, setDoc, deleteDoc, onSnapshot 
} from "firebase/firestore";
import { 
  ArrowLeftIcon, CheckCircleIcon, XCircleIcon, 
  LightBulbIcon, TagIcon,
  ArrowPathIcon, 
  SparklesIcon,
  XMarkIcon, 
  FireIcon,
  RocketLaunchIcon,
  BookmarkIcon as BookmarkIconSolid // 채워진 아이콘
} from "@heroicons/react/24/solid";
import { 
  ChevronDownIcon, 
  BookmarkIcon as BookmarkIconOutline // 빈 아이콘
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { DBProblem } from "@/types/problem";

// 오답 원인 옵션 정의
const WRONG_REASONS = [
  { label: "몰라서", value: "concept", color: "bg-red-100 text-red-700 border-red-200" },
  { label: "실수", value: "mistake", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { label: "찍음", value: "guess", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { label: "시간부족", value: "time", color: "bg-gray-100 text-gray-700 border-gray-200" },
];

interface ProblemDoc extends DBProblem {
  id: string;
}

interface ExamProblem {
  problemId: string;
  number: number;
  content: string;
  imgUrl?: string;
  answer: string;
  userAnswer?: number;
  isCorrect?: boolean;
  explanation?: string;
  solutionUrl?: string;
  majorTopic?: string;
  wrongReason?: string;
}

interface StudentExam {
  id: string;
  title: string;
  score: number;
  problems: ExamProblem[];
  createdAt: any;
}

export default function ExamResultDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;

  const [exam, setExam] = useState<StudentExam | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'wrong'>('wrong');
  const [openExplanation, setOpenExplanation] = useState<number | null>(null);
  
  // 스크랩 상태 관리 (Scrapped IDs)
  const [scrappedIds, setScrappedIds] = useState<Set<string>>(new Set());

  // 모달 상태
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    type: 'retry' | 'similar' | null;
    count: number;
  }>({ isOpen: false, type: null, count: 0 });

  const [isCreatingReview, setIsCreatingReview] = useState(false);

  // 1. 시험 정보 로드
  useEffect(() => {
    if (!examId) return;
    const fetchExam = async () => {
      try {
        const docRef = doc(db, "student_exams", examId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setExam({ id: snap.id, ...snap.data() } as StudentExam);
        } else {
          toast.error("시험 정보를 찾을 수 없습니다.");
        }
      } catch (e) {
        console.error(e);
        toast.error("시험 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [examId]);

  // 2. [신규] 스크랩 상태 실시간 동기화
  useEffect(() => {
    if (!user) return;
    
    // 사용자의 모든 스크랩 ID를 구독 (개수가 많지 않다고 가정)
    // 최적화가 필요하면 'where problemId in [...]' 쿼리를 사용하거나 별도 로직 적용
    const q = collection(db, "users", user.uid, "scraps");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ids = new Set(snapshot.docs.map(doc => doc.id));
      setScrappedIds(ids);
    });

    return () => unsubscribe();
  }, [user]);

  // 3. [신규] 스크랩 토글 핸들러
  const handleToggleScrap = async (problem: ExamProblem) => {
    if (!user) return;

    const scrapRef = doc(db, "users", user.uid, "scraps", problem.problemId);
    const isScrapped = scrappedIds.has(problem.problemId);

    try {
      if (isScrapped) {
        // 스크랩 취소 (삭제)
        await deleteDoc(scrapRef);
        toast.success("스크랩북에서 삭제되었습니다.");
      } else {
        // 스크랩 저장 (추가)
        await setDoc(scrapRef, {
          problemId: problem.problemId,
          content: problem.content,
          imgUrl: problem.imgUrl || null,
          answer: problem.answer,
          explanation: problem.explanation || null,
          solutionUrl: problem.solutionUrl || null,
          majorTopic: problem.majorTopic || null,
          scrappedAt: serverTimestamp(),
          sourceExamId: examId, // 출처 시험지 ID
          sourceExamTitle: exam?.title || "알 수 없음"
        });
        toast.success("스크랩북에 저장되었습니다.");
      }
    } catch (e) {
      console.error(e);
      toast.error("작업 중 오류가 발생했습니다.");
    }
  };

  // 오답 원인 태깅
  const handleTagReason = async (problemNumber: number, reasonValue: string) => {
    if (!exam) return;
    const updatedProblems = exam.problems.map(p => 
      p.number === problemNumber ? { ...p, wrongReason: reasonValue } : p
    );
    setExam(prev => prev ? { ...prev, problems: updatedProblems } : null);
    try {
      const docRef = doc(db, "student_exams", examId);
      await updateDoc(docRef, { problems: updatedProblems });
      toast.success("오답 원인이 저장되었습니다.");
    } catch (e) {
      console.error(e);
      toast.error("저장 실패");
    }
  };

  // 모달 트리거
  const triggerReviewModal = (type: 'retry' | 'similar') => {
    if (!exam) return;
    const wrongCount = exam.problems.filter(p => !p.isCorrect).length;
    if (wrongCount === 0) {
      return toast.success("틀린 문제가 없습니다! 완벽합니다 🎉");
    }
    setReviewModal({ isOpen: true, type, count: wrongCount });
  };

  // 학습 세션 실행 (다시 풀기 / 유사 문제)
  const executeReview = async () => {
    if (!exam || !user || !reviewModal.type) return;
    
    setIsCreatingReview(true);
    const toastId = toast.loading("학습 세션을 생성하고 있습니다...");
    const wrongProblems = exam.problems.filter(p => !p.isCorrect);

    try {
      let newProblems = [];
      let newTitle = "";
      let newDifficulty = "";

      if (reviewModal.type === 'retry') {
        newTitle = `[오답복습] ${exam.title}`;
        newDifficulty = "Review";
        newProblems = wrongProblems.map((p, idx) => ({
          ...p,
          number: idx + 1,
          userAnswer: null, 
          isCorrect: false,
          wrongReason: null 
        }));

      } else {
        newTitle = `[유사유형] ${exam.title} 복습`;
        newDifficulty = "Adaptive";
        
        for (const p of wrongProblems) {
          let similarProblemData: any = null;
          
          const originalDocRef = doc(db, "problems", p.problemId);
          const originalSnap = await getDoc(originalDocRef);
          
          if (originalSnap.exists()) {
            const originalData = originalSnap.data() as ProblemDoc;

            if (originalData.similarProblems && originalData.similarProblems.length > 0) {
              const targetSim = originalData.similarProblems[Math.floor(Math.random() * originalData.similarProblems.length)];
              const q = query(collection(db, "problems"), where("filename", "==", targetSim.targetFilename), limit(1));
              const simSnap = await getDocs(q);
              if (!simSnap.empty) {
                similarProblemData = { id: simSnap.docs[0].id, ...simSnap.docs[0].data() };
              }
            } 
            
            if (!similarProblemData) {
               const fallbackQ = query(
                 collection(db, "problems"),
                 where("majorTopic", "==", originalData.majorTopic),
                 where("difficulty", "==", originalData.difficulty),
                 limit(10)
               );
               const fallbackSnap = await getDocs(fallbackQ);
               const candidates = fallbackSnap.docs
                 .map(d => ({ id: d.id, ...d.data() }))
                 .filter((c: any) => c.id !== p.problemId);
               
               if (candidates.length > 0) {
                 similarProblemData = candidates[Math.floor(Math.random() * candidates.length)];
               }
            }
          }

          const finalData = similarProblemData || { ...p, id: p.problemId };
          
          newProblems.push({
            problemId: finalData.id || finalData.problemId,
            number: newProblems.length + 1,
            content: finalData.content || "",
            imgUrl: finalData.imgUrl || finalData.imageUrl || "",
            answer: finalData.answer || "",
            majorTopic: finalData.majorTopic || "기타",
            minorTopic: finalData.minorTopic || "",
            solutionUrl: finalData.solutionUrl || null,
            userAnswer: null,
            isCorrect: false
          });
        }
      }

      const docRef = await addDoc(collection(db, "student_exams"), {
        userId: user.uid,
        userName: user.displayName || "학생",
        title: newTitle,
        createdAt: serverTimestamp(),
        status: "in_progress",
        totalQuestions: newProblems.length,
        difficulty: newDifficulty,
        problems: newProblems
      });

      toast.success("준비 완료! 시험장으로 이동합니다.", { id: toastId });
      router.push(`/student/study/take?examId=${docRef.id}`);

    } catch (e) {
      console.error(e);
      toast.error("생성 중 오류가 발생했습니다.", { id: toastId });
      setIsCreatingReview(false);
      setReviewModal({ ...reviewModal, isOpen: false });
    }
  };

  if (loading) return <div className="p-10 text-center">결과 불러오는 중...</div>;
  if (!exam) return <div className="p-10 text-center">결과를 찾을 수 없습니다.</div>;

  const filteredProblems = filterMode === 'wrong' 
    ? exam.problems.filter(p => !p.isCorrect) 
    : exam.problems;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto min-h-screen bg-slate-50 font-sans relative">
      
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold mb-6 transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" /> 목록으로
      </button>

      {/* 점수 카드 */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex-1">
            <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold mb-3">
              {exam.createdAt?.toDate().toLocaleDateString()} 응시
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900">{exam.title}</h1>
            <p className="text-slate-500 mt-1">
              총 {exam.problems.length}문제 중 <span className="text-emerald-600 font-bold">{exam.problems.filter(p=>p.isCorrect).length}문제</span> 정답
            </p>
          </div>
          
          <div className="text-center">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                <path className="text-emerald-500" strokeDasharray={`${exam.score}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-900">{exam.score}</span>
                <span className="text-xs text-slate-400 font-bold uppercase">Score</span>
              </div>
            </div>
          </div>
        </div>

        {/* 액션 버튼 (오답이 있을 때만 표시) */}
        {exam.problems.some(p => !p.isCorrect) && (
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => triggerReviewModal('retry')}
              disabled={isCreatingReview}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className="w-5 h-5" />
              오답 다시 풀기
            </button>
            <button 
              onClick={() => triggerReviewModal('similar')}
              disabled={isCreatingReview}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-colors disabled:opacity-50"
            >
              <SparklesIcon className="w-5 h-5" />
              유사 문항 도전
            </button>
          </div>
        )}
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 mb-6">
        <button 
          onClick={() => setFilterMode('all')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filterMode === 'all' ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-100'}`}
        >
          전체 문항
        </button>
        <button 
          onClick={() => setFilterMode('wrong')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filterMode === 'wrong' ? 'bg-red-500 text-white shadow-md shadow-red-200' : 'bg-white text-slate-500 hover:bg-slate-100'}`}
        >
          오답 노트 ({exam.problems.filter(p=>!p.isCorrect).length})
        </button>
      </div>

      {/* 문제 리스트 */}
      <div className="space-y-6 pb-20">
        {filteredProblems.length === 0 ? (
          <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            {filterMode === 'wrong' ? "틀린 문제가 없습니다! 완벽해요 🎉" : "표시할 문제가 없습니다."}
          </div>
        ) : (
          filteredProblems.map((problem) => (
            <div key={problem.problemId} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              
              {/* 문제 헤더 */}
              <div className={`px-6 py-4 flex justify-between items-center border-b ${problem.isCorrect ? 'bg-slate-50 border-slate-100' : 'bg-red-50 border-red-100'}`}>
                <div className="flex items-center gap-3">
                  <span className={`flex items-center gap-1 text-sm font-bold ${problem.isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                    {problem.isCorrect ? <CheckCircleIcon className="w-5 h-5"/> : <XCircleIcon className="w-5 h-5"/>}
                    Q{problem.number}
                  </span>
                  <span className="text-xs text-slate-400 font-medium px-2 py-0.5 bg-white rounded border border-slate-200">
                    {problem.majorTopic || "단원 정보"}
                  </span>
                </div>
                <button 
                  onClick={() => setOpenExplanation(openExplanation === problem.number ? null : problem.number)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  {openExplanation === problem.number ? "해설 접기" : "해설 보기"}
                  <ChevronDownIcon className={`w-4 h-4 transition-transform ${openExplanation === problem.number ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* 문제 본문 */}
              <div className="p-6 md:p-8">
                {problem.imgUrl && (
                  <div className="mb-6 flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={problem.imgUrl} alt="문제" className="max-w-full max-h-[400px] object-contain" />
                  </div>
                )}
                {problem.content && (
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed mb-6">{problem.content}</p>
                )}

                {/* 정답 비교 */}
                <div className="flex items-center gap-4 text-sm bg-slate-50 p-4 rounded-xl mb-4">
                  <div className="flex-1">
                    <span className="block text-xs font-bold text-slate-400 uppercase mb-1">내가 고른 답</span>
                    <span className={`font-bold text-lg ${problem.isCorrect ? 'text-emerald-600' : 'text-red-500 decoration-wavy underline'}`}>
                      {problem.userAnswer || "미응답"}
                    </span>
                  </div>
                  <div className="w-px h-8 bg-slate-200"></div>
                  <div className="flex-1">
                    <span className="block text-xs font-bold text-slate-400 uppercase mb-1">실제 정답</span>
                    <span className="font-bold text-lg text-slate-800">{problem.answer}</span>
                  </div>
                </div>

                {/* 오답 원인 태그 */}
                {!problem.isCorrect && (
                  <div className="border-t border-slate-100 pt-4 mt-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-500">
                        <TagIcon className="w-4 h-4" /> 틀린 이유:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {WRONG_REASONS.map((reason) => (
                          <button
                            key={reason.value}
                            onClick={() => handleTagReason(problem.number, reason.value)}
                            className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                              problem.wrongReason === reason.value 
                                ? `${reason.color} ring-2 ring-offset-1 ring-slate-100` 
                                : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                            }`}
                          >
                            {reason.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 해설 및 스크랩 버튼 */}
                {openExplanation === problem.number && (
                  <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg shrink-0">
                        <LightBulbIcon className="w-5 h-5" />
                      </div>
                      <div className="w-full">
                        <h4 className="text-sm font-bold text-slate-800 mb-2">해설 및 풀이</h4>
                        {problem.solutionUrl ? (
                          <div className="mt-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={problem.solutionUrl} 
                              alt="해설 이미지" 
                              className="max-w-full rounded-lg border border-slate-200 shadow-sm"
                            />
                          </div>
                        ) : (
                          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {problem.explanation || "해설이 준비되지 않았습니다."}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* [신규] 스크랩 토글 버튼 */}
                    <div className="mt-4 flex justify-end">
                      <button 
                        onClick={() => handleToggleScrap(problem)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                          scrappedIds.has(problem.problemId)
                            ? "bg-blue-50 text-blue-600 border-blue-200"
                            : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {scrappedIds.has(problem.problemId) ? (
                          <>
                            <BookmarkIconSolid className="w-4 h-4" /> 저장됨 (스크랩북)
                          </>
                        ) : (
                          <>
                            <BookmarkIconOutline className="w-4 h-4" /> 스크랩하기
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 학습 준비 모달 */}
      {reviewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 relative">
            <button 
              onClick={() => setReviewModal({ ...reviewModal, isOpen: false })}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                reviewModal.type === 'retry' ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-500'
              }`}>
                {reviewModal.type === 'retry' ? <FireIcon className="w-8 h-8" /> : <RocketLaunchIcon className="w-8 h-8" />}
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {reviewModal.type === 'retry' ? '오답 완전 정복' : '실전 응용력 키우기'}
              </h3>
              
              <p className="text-slate-500 mb-6 leading-relaxed">
                {reviewModal.type === 'retry' ? (
                  <>
                    틀린 <strong className="text-red-500">{reviewModal.count}문제</strong>를 다시 풀어봅니다.<br/>
                    이번에는 실수 없이 다 맞혀볼까요?
                  </>
                ) : (
                  <>
                    오답과 유사한 <strong className="text-indigo-500">{reviewModal.count}문제</strong>를 준비했습니다.<br/>
                    비슷한 유형도 완벽하게 풀어보세요!
                  </>
                )}
              </p>

              <button 
                onClick={executeReview}
                disabled={isCreatingReview}
                className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  reviewModal.type === 'retry' 
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-200' 
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                }`}
              >
                {isCreatingReview ? (
                  "생성 중..." 
                ) : (
                  <>
                    {reviewModal.type === 'retry' ? "복습 시작하기" : "도전 시작하기"} 
                    <ArrowLeftIcon className="w-4 h-4 rotate-180" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}