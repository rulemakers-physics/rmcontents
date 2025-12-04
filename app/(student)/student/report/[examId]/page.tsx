"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { 
  ArrowLeftIcon, CheckCircleIcon, XCircleIcon, 
  LightBulbIcon, BookmarkIcon, TagIcon 
} from "@heroicons/react/24/solid";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

// 오답 원인 옵션 정의
const WRONG_REASONS = [
  { label: "몰라서", value: "concept", color: "bg-red-100 text-red-700 border-red-200" },
  { label: "실수", value: "mistake", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { label: "찍음", value: "guess", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { label: "시간부족", value: "time", color: "bg-gray-100 text-gray-700 border-gray-200" },
];

interface ExamProblem {
  problemId: string;
  number: number;
  content: string;
  imgUrl?: string;
  answer: string;
  userAnswer?: number;
  isCorrect?: boolean;
  explanation?: string; // 텍스트 해설
  solutionUrl?: string; // [신규] 해설 이미지 URL
  majorTopic?: string;
  wrongReason?: string; // [신규] 오답 원인
}

interface StudentExam {
  id: string;
  title: string;
  score: number;
  problems: ExamProblem[];
  createdAt: any;
}

export default function ExamResultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;

  const [exam, setExam] = useState<StudentExam | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'wrong'>('wrong');
  const [openExplanation, setOpenExplanation] = useState<number | null>(null);

  useEffect(() => {
    if (!examId) return;
    const fetchExam = async () => {
      try {
        const docRef = doc(db, "student_exams", examId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setExam({ id: snap.id, ...snap.data() } as StudentExam);
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

  // 오답 원인 태깅 핸들러
  const handleTagReason = async (problemNumber: number, reasonValue: string) => {
    if (!exam) return;

    // 로컬 상태 업데이트
    const updatedProblems = exam.problems.map(p => 
      p.number === problemNumber ? { ...p, wrongReason: reasonValue } : p
    );
    setExam(prev => prev ? { ...prev, problems: updatedProblems } : null);

    // DB 업데이트
    try {
      const docRef = doc(db, "student_exams", examId);
      await updateDoc(docRef, { problems: updatedProblems });
      toast.success("오답 원인이 저장되었습니다.");
    } catch (e) {
      console.error(e);
      toast.error("저장 실패");
    }
  };

  if (loading) return <div className="p-10 text-center">결과 불러오는 중...</div>;
  if (!exam) return <div className="p-10 text-center">결과를 찾을 수 없습니다.</div>;

  const filteredProblems = filterMode === 'wrong' 
    ? exam.problems.filter(p => !p.isCorrect) 
    : exam.problems;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto min-h-screen bg-slate-50 font-sans">
      
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold mb-6 transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" /> 목록으로
      </button>

      {/* 점수 카드 */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
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
            {/* 원형 차트 (SVG) */}
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
      <div className="space-y-6">
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

              {/* 문제 내용 */}
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

                {/* 오답 원인 태그 (틀린 문제만) */}
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

                {/* 해설 (아코디언) */}
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
                    
                    <div className="mt-4 flex justify-end">
                      <button className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-blue-500 transition-colors">
                        <BookmarkIcon className="w-4 h-4" /> 오답 노트에 저장됨
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}