// app/(student)/student/mistake-note/page.tsx

"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, query, where, getDocs, orderBy, 
  doc, updateDoc, getDoc, deleteDoc, setDoc, serverTimestamp, onSnapshot 
} from "firebase/firestore";
import { 
  ClipboardDocumentListIcon, 
  TagIcon, 
  ChevronDownIcon, // [추가] 해설 접기/펼치기 아이콘
  BookmarkIcon as BookmarkIconOutline // [추가] 빈 스크랩 아이콘
} from "@heroicons/react/24/outline";
import { 
  XCircleIcon, 
  ExclamationTriangleIcon, 
  QuestionMarkCircleIcon, 
  ClockIcon,
  CheckCircleIcon, // [추가]
  LightBulbIcon,   // [추가] 해설 아이콘
  BookmarkIcon as BookmarkIconSolid // [추가] 채워진 스크랩 아이콘
} from "@heroicons/react/24/solid";
import { toast } from "react-hot-toast";

// 오답 원인 옵션 (성적 리포트와 동일)
const WRONG_REASONS = [
  { label: "몰라서", value: "concept", color: "bg-red-100 text-red-700 border-red-200" },
  { label: "실수", value: "mistake", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { label: "찍음", value: "guess", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { label: "시간부족", value: "time", color: "bg-gray-100 text-gray-700 border-gray-200" },
];

const REASON_TABS = [
  { id: 'all', label: '전체 오답', icon: ClipboardDocumentListIcon, color: 'text-slate-600', bg: 'bg-slate-100' },
  { id: 'concept', label: '몰라서', icon: QuestionMarkCircleIcon, color: 'text-red-600', bg: 'bg-red-100' },
  { id: 'mistake', label: '실수', icon: ExclamationTriangleIcon, color: 'text-orange-600', bg: 'bg-orange-100' },
  { id: 'guess', label: '찍음', icon: XCircleIcon, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  { id: 'time', label: '시간부족', icon: ClockIcon, color: 'text-gray-600', bg: 'bg-gray-200' },
];

interface ExamProblem {
  examId: string; // [추가] 원본 시험지 ID (업데이트용)
  problemId: string;
  content: string;
  imgUrl?: string;
  answer: string;
  userAnswer?: number;
  wrongReason?: string;
  explanation?: string; // [추가]
  solutionUrl?: string; // [추가]
  majorTopic?: string;  // [추가]
  examTitle: string;
  examDate: any;
}

export default function MistakeNotePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [allWrongProblems, setAllWrongProblems] = useState<ExamProblem[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  
  // [신규] 상태 관리
  const [openExplanationId, setOpenExplanationId] = useState<string | null>(null); // 현재 열린 해설 ID (examId_problemId 조합)
  const [scrappedIds, setScrappedIds] = useState<Set<string>>(new Set());

  // 1. 오답 데이터 로드
  useEffect(() => {
    if (!user) return;

    const fetchWrongProblems = async () => {
      try {
        const q = query(
          collection(db, "student_exams"),
          where("userId", "==", user.uid),
          where("status", "==", "completed"),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        
        let problems: ExamProblem[] = [];
        
        snap.forEach(doc => {
          const data = doc.data();
          if (data.problems) {
            // 틀린 문제만 필터링
            const wrongs = data.problems
              .filter((p: any) => !p.isCorrect)
              .map((p: any) => ({
                examId: doc.id, // 시험지 ID 저장
                problemId: p.problemId,
                content: p.content,
                imgUrl: p.imgUrl,
                answer: p.answer,
                userAnswer: p.userAnswer,
                wrongReason: p.wrongReason || 'untagged',
                explanation: p.explanation,
                solutionUrl: p.solutionUrl,
                majorTopic: p.majorTopic,
                examTitle: data.title,
                examDate: data.createdAt
              }));
            problems = [...problems, ...wrongs];
          }
        });

        setAllWrongProblems(problems);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchWrongProblems();
  }, [user]);

  // 2. 스크랩 상태 실시간 동기화
  useEffect(() => {
    if (!user) return;
    const q = collection(db, "users", user.uid, "scraps");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ids = new Set(snapshot.docs.map(doc => doc.id));
      setScrappedIds(ids);
    });
    return () => unsubscribe();
  }, [user]);

  // 3. 필터링된 문제 목록
  const filteredProblems = useMemo(() => {
    if (activeTab === 'all') return allWrongProblems;
    return allWrongProblems.filter(p => p.wrongReason === activeTab);
  }, [activeTab, allWrongProblems]);

  // --- 핸들러 ---

  // A. 오답 원인 태깅 (DB 업데이트 포함)
  const handleTagReason = async (examId: string, problemId: string, newReason: string) => {
    // 1. 로컬 상태 즉시 업데이트 (UI 반응성)
    setAllWrongProblems(prev => prev.map(p => {
      if (p.examId === examId && p.problemId === problemId) {
        return { ...p, wrongReason: newReason };
      }
      return p;
    }));

    // 2. DB 업데이트
    try {
      const examRef = doc(db, "student_exams", examId);
      const examSnap = await getDoc(examRef);
      
      if (examSnap.exists()) {
        const examData = examSnap.data();
        const updatedProblems = examData.problems.map((p: any) => {
          if (p.problemId === problemId) {
            return { ...p, wrongReason: newReason };
          }
          return p;
        });
        
        await updateDoc(examRef, { problems: updatedProblems });
        toast.success("오답 원인이 수정되었습니다.");
      }
    } catch (e) {
      console.error(e);
      toast.error("저장 실패");
    }
  };

  // B. 스크랩 토글
  const handleToggleScrap = async (problem: ExamProblem) => {
    if (!user) return;
    const scrapRef = doc(db, "users", user.uid, "scraps", problem.problemId);
    const isScrapped = scrappedIds.has(problem.problemId);

    try {
      if (isScrapped) {
        await deleteDoc(scrapRef);
        toast.success("스크랩 취소됨");
      } else {
        await setDoc(scrapRef, {
          problemId: problem.problemId,
          content: problem.content,
          imgUrl: problem.imgUrl || null,
          answer: problem.answer,
          explanation: problem.explanation || null,
          solutionUrl: problem.solutionUrl || null,
          majorTopic: problem.majorTopic || null,
          scrappedAt: serverTimestamp(),
          sourceExamId: problem.examId,
          sourceExamTitle: problem.examTitle
        });
        toast.success("스크랩 저장됨");
      }
    } catch (e) {
      console.error(e);
      toast.error("작업 실패");
    }
  };

  // C. 해설 토글 (Unique Key: examId_problemId)
  const toggleExplanation = (uniqueKey: string) => {
    setOpenExplanationId(prev => prev === uniqueKey ? null : uniqueKey);
  };

  if (loading) return <div className="p-10 text-center text-slate-400">오답 분석 중...</div>;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto min-h-screen bg-slate-50 font-sans">
      
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <TagIcon className="w-8 h-8 text-indigo-600" />
          유형별 오답 분석
        </h1>
        <p className="text-slate-500 mt-1">내가 틀린 이유를 분석하고 약점을 보완하세요.</p>
      </div>

      {/* 탭 메뉴 */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
        {REASON_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all border-2 ${
              activeTab === tab.id 
                ? `${tab.bg} ${tab.color} border-${tab.color.split('-')[1]}-200`
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label} 
            <span className="ml-1 text-xs opacity-70">
              {tab.id === 'all' 
                ? allWrongProblems.length 
                : allWrongProblems.filter(p => p.wrongReason === tab.id).length}
            </span>
          </button>
        ))}
      </div>

      {/* 문제 리스트 */}
      <div className="space-y-6">
        {filteredProblems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
            <p className="text-lg font-bold">해당 유형의 오답이 없습니다.</p>
            <p className="text-sm mt-2">시험 결과 페이지에서 오답 원인을 태그해보세요!</p>
          </div>
        ) : (
          filteredProblems.map((p, idx) => {
            const uniqueKey = `${p.examId}_${p.problemId}`;
            const isOpen = openExplanationId === uniqueKey;

            return (
              <div key={uniqueKey} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                
                {/* 1. 메타 정보 (출처 등) */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase mb-2 ${
                      REASON_TABS.find(t => t.id === p.wrongReason)?.bg || 'bg-slate-100'
                    } ${
                      REASON_TABS.find(t => t.id === p.wrongReason)?.color || 'text-slate-500'
                    }`}>
                      {REASON_TABS.find(t => t.id === p.wrongReason)?.label || '태그 미지정'}
                    </span>
                    <h3 className="text-xs text-slate-400 font-medium">
                      {p.examTitle} · {p.examDate?.toDate().toLocaleDateString()}
                    </h3>
                  </div>
                </div>

                {/* 2. 문제 내용 */}
                <div className="mb-6">
                  {p.imgUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imgUrl} alt="문제" className="max-w-full max-h-[300px] object-contain rounded-lg" />
                  ) : (
                    <p className="text-slate-800 text-sm whitespace-pre-wrap leading-relaxed">{p.content}</p>
                  )}
                </div>

                {/* 3. 정답 비교 박스 */}
                <div className="flex items-center gap-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                  <div className="flex-1">
                    <span className="block text-[10px] text-slate-400 font-bold mb-0.5">내 답</span>
                    <span className="font-bold text-red-500 decoration-wavy underline text-sm">{p.userAnswer || "-"}</span>
                  </div>
                  <div className="w-px h-6 bg-slate-200"></div>
                  <div className="flex-1">
                    <span className="block text-[10px] text-slate-400 font-bold mb-0.5">정답</span>
                    <span className="font-bold text-slate-800 text-sm">{p.answer}</span>
                  </div>
                </div>

                {/* 4. 하단 컨트롤바 (태그 수정, 해설, 스크랩) */}
                <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  
                  {/* [수정] 오답 원인 변경 버튼 (ring 제거 -> border 사용) */}
                  <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto scrollbar-hide pb-2 sm:pb-0">
                    <span className="text-xs font-bold text-slate-400 shrink-0">이유 변경:</span>
                    {WRONG_REASONS.map((reason) => (
                      <button
                        key={reason.value}
                        onClick={() => handleTagReason(p.examId, p.problemId, reason.value)}
                        className={`px-2 py-1 rounded text-[10px] font-bold border transition-all whitespace-nowrap ${
                          p.wrongReason === reason.value 
                            ? reason.color // WRONG_REASONS에 이미 border-{color}-200 정의됨
                            : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {reason.label}
                      </button>
                    ))}
                  </div>

                  {/* 액션 버튼 (해설, 스크랩) */}
                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <button 
                      onClick={() => toggleExplanation(uniqueKey)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      {isOpen ? "해설 접기" : "해설 보기"}
                      <ChevronDownIcon className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <button 
                      onClick={() => handleToggleScrap(p)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        scrappedIds.has(p.problemId)
                          ? "bg-blue-50 text-blue-600 border-blue-200"
                          : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {scrappedIds.has(p.problemId) ? (
                        <>
                          <BookmarkIconSolid className="w-3 h-3" /> 저장됨
                        </>
                      ) : (
                        <>
                          <BookmarkIconOutline className="w-3 h-3" /> 스크랩
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 5. 해설 영역 (아코디언) */}
                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-yellow-100 text-yellow-600 rounded-lg shrink-0 mt-0.5">
                        <LightBulbIcon className="w-4 h-4" />
                      </div>
                      <div className="w-full">
                        <h4 className="text-xs font-bold text-slate-800 mb-2">해설 및 풀이</h4>
                        {p.solutionUrl ? (
                          <div className="mt-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={p.solutionUrl} 
                              alt="해설 이미지" 
                              className="max-w-full rounded-lg border border-slate-200 shadow-sm"
                            />
                          </div>
                        ) : (
                          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {p.explanation || "해설이 준비되지 않았습니다."}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}