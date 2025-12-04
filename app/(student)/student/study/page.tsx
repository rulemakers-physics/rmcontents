// app/(student)/student/study/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, query, where, getDocs, addDoc, serverTimestamp, limit 
} from "firebase/firestore";
import { SCIENCE_UNITS } from "@/types/scienceUnits";
import { 
  BeakerIcon, 
  CheckIcon, 
  PlayIcon, 
  AdjustmentsHorizontalIcon, 
  ArrowPathIcon,
  BoltIcon,
  ClockIcon
} from "@heroicons/react/24/solid";
import { toast } from "react-hot-toast";

export default function StudentStudyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 선택 상태 관리
  const [selectedMajor, setSelectedMajor] = useState("");
  const [selectedMinors, setSelectedMinors] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("중");
  const [questionCount, setQuestionCount] = useState(10);
  
  // 응시 모드 선택 (test: 실전, practice: 연습)
  const [examMode, setExamMode] = useState<'test' | 'practice'>('test');
  
  const [isCreating, setIsCreating] = useState(false);

  // 현재 선택된 대단원의 소단원 리스트 추출
  const currentMinorTopics = SCIENCE_UNITS.flatMap(u => u.majorTopics).find(m => m.name === selectedMajor)?.minorTopics || [];

  // 대시보드에서 '오늘의 미션'으로 넘어온 경우 자동 설정
  useEffect(() => {
    const mode = searchParams.get("mode");
    const unit = searchParams.get("unit");
    
    if (mode === "daily" && unit) {
      // 해당 unit(대단원명)과 일치하는 대단원 찾기
      const major = SCIENCE_UNITS.flatMap(u => u.majorTopics).find(m => m.name === unit);
      if (major) {
        setSelectedMajor(major.name);
        setSelectedMinors(major.minorTopics.slice(0, 3)); // 임의로 3개 소단원 선택
        setQuestionCount(5); // 데일리 미션은 5문제
        setExamMode('practice'); // 데일리 미션은 연습 모드 기본
        toast("오늘의 미션 설정을 불러왔습니다.", { icon: "🔔" });
      }
    }
  }, [searchParams]);

  // 소단원 토글 핸들러
  const toggleMinor = (topic: string) => {
    setSelectedMinors(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  // 시험 시작 핸들러 (실제 문제 생성 및 DB 저장)
  const handleStartTest = async () => {
    if (!user) return;
    if (!selectedMajor) return toast.error("대단원을 선택해주세요.");
    if (selectedMinors.length === 0) return toast.error("소단원을 최소 1개 이상 선택해주세요.");

    setIsCreating(true);
    const toastId = toast.loading("맞춤형 문제를 선별하고 있습니다...");

    try {
      // 1. 문제 DB 조회
      // 실제로는 랜덤 셔플 및 소단원 필터링 로직이 더 정교해야 함 (Firestore 쿼리 한계 고려)
      const problemsRef = collection(db, "problems");
      
      // Firestore 'in' 쿼리는 최대 10개까지만 가능하므로, 
      // 여기서는 대단원과 난이도로 먼저 필터링하고 클라이언트에서 소단원을 거릅니다.
      const q = query(
        problemsRef,
        where("majorTopic", "==", selectedMajor),
        where("difficulty", "==", difficulty),
        limit(50) // 풀을 충분히 가져옴
      );
      
      const snapshot = await getDocs(q);
      let problems = snapshot.docs.map(doc => ({
        id: doc.id,
        content: doc.data().content,
        imgUrl: doc.data().imgUrl,
        answer: doc.data().answer,
        difficulty: doc.data().difficulty,
        majorTopic: doc.data().majorTopic,
        minorTopic: doc.data().minorTopic,
        explanation: doc.data().explanation || "해설이 준비중입니다.",
      }));

      // 2. 소단원 필터링 및 랜덤 셔플
      problems = problems.filter(p => selectedMinors.includes(p.minorTopic));
      problems.sort(() => Math.random() - 0.5); // 랜덤 섞기
      problems = problems.slice(0, questionCount); // 요청한 개수만큼 자르기

      if (problems.length === 0) {
        toast.error("조건에 맞는 문제가 부족합니다. 난이도나 범위를 조정해주세요.", { id: toastId });
        setIsCreating(false);
        return;
      }

      // 3. student_exams 컬렉션에 시험지 생성
      const examRef = await addDoc(collection(db, "student_exams"), {
        userId: user.uid,
        userName: user.displayName || "학생",
        title: `${selectedMajor} ${examMode === 'test' ? '실전 모의고사' : '집중 연습'}`,
        createdAt: serverTimestamp(),
        status: "in_progress", // 진행 중
        totalQuestions: problems.length,
        difficulty: difficulty,
        mode: examMode, // [신규] 모드 저장 (test | practice)
        
        // 문제 데이터 포함 (정답 포함) - 보안상 정답은 별도 관리 권장되나 B2C 편의상 포함
        problems: problems.map((p, idx) => ({
          problemId: p.id,
          number: idx + 1,
          content: p.content || "",
          imgUrl: p.imgUrl || "",
          answer: p.answer,
          explanation: p.explanation, // 연습 모드용 해설 저장
          userAnswer: null, // 학생 답 (초기값 null)
          isCorrect: false
        }))
      });

      toast.success("시험지 생성 완료!", { id: toastId });
      
      // 4. 시험 응시 페이지로 이동 (생성된 doc ID 전달)
      router.push(`/student/study/take?examId=${examRef.id}`);

    } catch (e) {
      console.error(e);
      toast.error("시험 생성 중 오류가 발생했습니다.", { id: toastId });
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold mb-4">
            Self-Directed Learning
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900">나만의 문제집 만들기</h1>
          <p className="text-slate-500 mt-2">
            부족한 단원을 선택해 나만의 맞춤형 테스트를 만들어보세요.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Controls (Left Column - 2/3) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. 단원 선택 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BeakerIcon className="w-5 h-5 text-emerald-500" /> 단원 선택
              </h3>
              
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">대단원</label>
                <select 
                  value={selectedMajor} 
                  onChange={(e) => {
                    setSelectedMajor(e.target.value);
                    setSelectedMinors([]); // 대단원 변경 시 소단원 초기화
                  }}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow"
                >
                  <option value="">대단원을 선택하세요</option>
                  {SCIENCE_UNITS.flatMap(u => u.majorTopics).map(m => (
                    <option key={m.name} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>

              {selectedMajor ? (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase flex justify-between">
                    <span>소단원 선택</span>
                    <button 
                      onClick={() => setSelectedMinors(currentMinorTopics)}
                      className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-xs font-bold"
                    >
                      <ArrowPathIcon className="w-3 h-3" /> 전체 선택
                    </button>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentMinorTopics.map(minor => (
                      <button
                        key={minor}
                        onClick={() => toggleMinor(minor)}
                        className={`p-3 rounded-xl text-sm font-medium text-left transition-all border ${
                          selectedMinors.includes(minor)
                            ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm ring-1 ring-emerald-500/20"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="truncate">{minor}</span>
                          {selectedMinors.includes(minor) && <CheckIcon className="w-4 h-4 text-emerald-500" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  대단원을 먼저 선택해주세요.
                </div>
              )}
            </div>

            {/* 2. 상세 옵션 (모드 선택 포함) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AdjustmentsHorizontalIcon className="w-5 h-5 text-emerald-500" /> 상세 옵션
              </h3>
              
              <div className="space-y-6">
                {/* 학습 모드 선택 */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">학습 모드</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setExamMode('test')}
                      className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                        examMode === 'test' 
                          ? 'bg-slate-800 border-slate-800 text-white shadow-md' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <ClockIcon className="w-6 h-6" />
                      <span className="font-bold text-sm">실전 모의고사</span>
                      <span className="text-[10px] opacity-70">타이머 O / 해설 나중에</span>
                    </button>
                    <button
                      onClick={() => setExamMode('practice')}
                      className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                        examMode === 'practice' 
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <BoltIcon className="w-6 h-6" />
                      <span className="font-bold text-sm">집중 연습 모드</span>
                      <span className="text-[10px] opacity-70">타이머 X / 즉시 채점</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* 난이도 */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">난이도</label>
                    <div className="flex gap-2">
                      {['하', '중', '상', '킬러'].map(lvl => (
                        <button
                          key={lvl}
                          onClick={() => setDifficulty(lvl)}
                          className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-all ${
                            difficulty === lvl 
                              ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                              : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 문항 수 */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">문항 수: {questionCount}문제</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" min="5" max="30" step="5" 
                        value={questionCount} 
                        onChange={(e) => setQuestionCount(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                      <span>5문제</span>
                      <span>30문제</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Sticky Sidebar (Right Column - 1/3) */}
          <div className="lg:col-span-1">
            <div className={`sticky top-8 bg-white p-6 rounded-2xl border shadow-lg ring-4 ${examMode === 'practice' ? 'border-emerald-100 ring-emerald-50/50' : 'border-slate-200 ring-slate-100'}`}>
              <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">
                {examMode === 'practice' ? 'Drill Summary' : 'Test Summary'}
              </h3>
              
              <ul className="space-y-4 mb-8">
                <li className="flex justify-between text-sm">
                  <span className="text-slate-500">선택 대단원</span>
                  <span className="font-bold text-slate-900 truncate max-w-[140px] text-right">{selectedMajor || "-"}</span>
                </li>
                <li className="flex justify-between text-sm">
                  <span className="text-slate-500">소단원 수</span>
                  <span className="font-bold text-emerald-600">{selectedMinors.length}개</span>
                </li>
                <li className="flex justify-between text-sm">
                  <span className="text-slate-500">난이도</span>
                  <span className="font-bold text-slate-900">{difficulty}</span>
                </li>
                <li className="flex justify-between text-sm">
                  <span className="text-slate-500">예상 소요 시간</span>
                  <span className="font-bold text-slate-900">{questionCount * 2}분</span>
                </li>
                <li className="flex justify-between text-sm pt-2 border-t border-dashed border-slate-200">
                  <span className="text-slate-500">모드</span>
                  <span className={`font-bold ${examMode === 'practice' ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {examMode === 'practice' ? '연습 (해설 즉시 확인)' : '실전 (시간 제한)'}
                  </span>
                </li>
              </ul>

              <button 
                onClick={handleStartTest}
                disabled={isCreating || !selectedMajor || selectedMinors.length === 0}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  examMode === 'practice' 
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-200' 
                    : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-300'
                }`}
              >
                {isCreating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <PlayIcon className="w-5 h-5" />
                    {examMode === 'practice' ? '연습 시작하기' : '시험 시작하기'}
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}