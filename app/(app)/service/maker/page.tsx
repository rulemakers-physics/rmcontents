// app/(app)/service/maker/page.tsx

"use client";

import React, { useState, useRef, useEffect, useMemo, Suspense, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import { SCIENCE_UNITS } from "@/types/scienceUnits"; 
import { 
  Printer, Lock, ChevronDown, Filter, FileText, 
  LayoutTemplate, Image as ImageIcon, SaveIcon, ListOrdered, 
  RotateCcw, FileCheck, CheckSquare, Settings2, CheckCircle2,
  Undo, Minus, Plus
} from "lucide-react";
import { 
  Squares2X2Icon, ViewColumnsIcon, QueueListIcon 
} from "@heroicons/react/24/outline";
import ExamPaperLayout from "@/components/ExamPaperLayout";
import { useAuth } from "@/context/AuthContext";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"; 
import { toast } from "react-hot-toast"; 
import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs, limit } from "firebase/firestore"; 
import { useRouter, useSearchParams } from "next/navigation"; 

import { useProblemFetcher } from "@/hooks/useProblemFetcher";
import { Difficulty, DBProblem } from "@/types/problem"; 
import { TEMPLATES, ExamTemplateStyle, LayoutMode } from "@/types/examTemplates";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { ExamPaperProblem, PrintOptions } from "@/types/exam";
import { getSecureImageSrc } from "@/lib/imageHelper";

// 난이도 정렬 순서
const DIFFICULTY_ORDER: Record<string, number> = {
  '기본': 1, '하': 2, '중': 3, '상': 4, '킬러': 5
};

function ExamBuilderContent() {
  const { userData, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams(); 
  const examId = searchParams.get("id");
  const userPlan = userData?.plan || "BASIC";

  const [activeTab, setActiveTab] = useState<'filter' | 'order'>('filter');

  // 난이도별 문항 수 배분 상태
  const [difficultyCounts, setDifficultyCounts] = useState<Record<Difficulty, number>>({
    "기본": 5, "하": 5, "중": 10, "상": 0, "킬러": 0
  });
  
  // 총 문항 수 자동 계산
  const questionCount = useMemo(() => 
    Object.values(difficultyCounts).reduce((a, b) => a + b, 0), 
  [difficultyCounts]);

  const [selectedMajorTopics, setSelectedMajorTopics] = useState<string[]>([]);
  const [selectedMinorTopics, setSelectedMinorTopics] = useState<string[]>([]);

  // 필터 상태
  const [excludeUsed, setExcludeUsed] = useState(true);
  const [usedProblemIds, setUsedProblemIds] = useState<string[]>([]);
  const [excludeNonCurriculum, setExcludeNonCurriculum] = useState(false);

  // 메타데이터 & 옵션
  const [examTitle, setExamTitle] = useState("제목을 입력해주세요");
  const [subTitle, setSubTitle] = useState("2025학년도 1학기 대비"); 
  const [academyName, setAcademyName] = useState(userData?.academy || ""); 
  const [instructorName, setInstructorName] = useState(userData?.name || "선생님 성함");
  const [academyLogo, setAcademyLogo] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
  const [printOptions, setPrintOptions] = useState<Omit<PrintOptions, "layoutMode">>({
    questions: true,
    answers: true,
    solutions: true,
    questionPadding: 40
  });

  const [currentTemplate, setCurrentTemplate] = useState<ExamTemplateStyle>(TEMPLATES[0]);
  const [isTeacherMode, setIsTeacherMode] = useState(false);

  const [examProblems, setExamProblems] = useState<ExamPaperProblem[]>([]);
  const [history, setHistory] = useState<ExamPaperProblem[][]>([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false); 
  const [isMounted, setIsMounted] = useState(false);
  
  // 질문 형식 상태
  const [targetQuestionTypes, setTargetQuestionTypes] = useState<string[]>(['SELECTION', 'ESSAY']);
  // 레이아웃 모드 상태
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('dense');

  // [누락 수정] 문항 유형 토글 핸들러
  const toggleQuestionType = (type: string) => {
    setTargetQuestionTypes(prev => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev; 
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  // 되돌리기(Undo) 핸들러
  const handleUndo = useCallback(() => {
    if (history.length === 0) {
      toast.error("이전 상태가 없습니다.");
      return;
    }
    const previousState = history[history.length - 1];
    setExamProblems(previousState);
    setHistory(prev => prev.slice(0, -1));
    toast.success("실행 취소되었습니다.");
  }, [history]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 최근 사용 문항 조회
  useEffect(() => {
    if (!user) return;
    const fetchUsedProblems = async () => {
      try {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const q = query(
          collection(db, "saved_exams"),
          where("userId", "==", user.uid),
          where("createdAt", ">=", oneMonthAgo)
        );
        const snapshot = await getDocs(q);
        const usedIds = new Set<string>();
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (Array.isArray(data.problems)) {
            data.problems.forEach((p: any) => { if (p.id) usedIds.add(p.id); });
          }
        });
        setUsedProblemIds(Array.from(usedIds));
      } catch (error) {
        console.error("사용된 문제 조회 실패:", error);
      }
    };
    fetchUsedProblems();
  }, [user]);

  // 문제 데이터 Fetcher
  const { problems: fetchedProblems, loading: isFetching } = useProblemFetcher({
    selectedMajorTopics,
    selectedMinorTopics,
    difficulties: [], // 전체 난이도를 가져와서 클라이언트에서 배분
    excludedProblemIds: excludeUsed ? usedProblemIds : [],
    questionTypes: targetQuestionTypes,
    excludeNonCurriculum: excludeNonCurriculum,
  });

  // 대단원 선택 핸들러
  const handleMajorTopicChange = (majorName: string, isChecked: boolean) => {
    const targetMajor = SCIENCE_UNITS.flatMap(u => u.majorTopics).find(m => m.name === majorName);
    if (!targetMajor) return;

    setSelectedMajorTopics(prev => 
      isChecked ? [...prev, majorName] : prev.filter(t => t !== majorName)
    );

    setSelectedMinorTopics(prev => {
      const otherMinors = prev.filter(m => !targetMajor.minorTopics.includes(m));
      return isChecked ? [...otherMinors, ...targetMajor.minorTopics] : otherMinors;
    });
    
    setExamProblems([]); 
  };

  // 난이도별 문항 수 조절 핸들러
  const updateDifficultyCount = (level: Difficulty, delta: number) => {
    if (level === '킬러' && delta > 0 && userPlan !== 'MAKERS') {
      toast.error("킬러 문항은 Maker's Plan 전용입니다.");
      return;
    }

    setDifficultyCounts(prev => {
      const newValue = Math.max(0, prev[level] + delta);
      const currentTotal = Object.values(prev).reduce((a, b) => a + b, 0);
      if (delta > 0 && currentTotal >= 50) {
        toast.error("최대 50문항까지 구성 가능합니다.");
        return prev;
      }
      return { ...prev, [level]: newValue };
    });
  };

  // 문제 배분 및 정렬 로직 (자동 생성)
  useEffect(() => {
    if (!isLoaded || isFetching) return;

    if (selectedMinorTopics.length === 0) {
      setExamProblems([]);
      return;
    }

    const poolByDiff: Record<string, DBProblem[]> = { '기본': [], '하': [], '중': [], '상': [], '킬러': [] };
    fetchedProblems.forEach(p => {
      if (poolByDiff[p.difficulty]) poolByDiff[p.difficulty].push(p);
    });

    let selectedProblems: DBProblem[] = [];

    Object.entries(difficultyCounts).forEach(([diff, count]) => {
      const pool = poolByDiff[diff];
      if (pool && pool.length > 0) {
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        selectedProblems.push(...shuffled.slice(0, count));
      }
    });

    // 정렬: 소단원 순서 -> 난이도 오름차순
    const allMinorTopicsOrdered = SCIENCE_UNITS.flatMap(s => s.majorTopics.flatMap(m => m.minorTopics));
    
    selectedProblems.sort((a, b) => {
      const idxA = allMinorTopicsOrdered.indexOf(a.minorTopic);
      const idxB = allMinorTopicsOrdered.indexOf(b.minorTopic);
      if (idxA !== idxB) return idxA - idxB;

      const diffA = DIFFICULTY_ORDER[a.difficulty] || 3;
      const diffB = DIFFICULTY_ORDER[b.difficulty] || 3;
      return diffA - diffB;
    });

    const formatted: ExamPaperProblem[] = selectedProblems.map((p, idx) => ({
      id: p.id,
      number: idx + 1,
      imageUrl: p.imgUrl,
      content: p.content,
      difficulty: p.difficulty,
      majorTopic: p.majorTopic,
      minorTopic: p.minorTopic,
      answer: p.answer || null,
      solutionUrl: p.solutionUrl || null,
      height: (p as any).imgHeight,         
      solutionHeight: (p as any).solutionHeight,
      materialLevel: p.materialLevel,
    }));

    setExamProblems(formatted);

  }, [fetchedProblems, difficultyCounts, isLoaded, isFetching, selectedMinorTopics]);

  // 문제 교체 핸들러
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
        setHistory(prev => [...prev, examProblems]); 

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
          if (data.subTitle) setSubTitle(data.subTitle);
          if (data.academyName) setAcademyName(data.academyName);
          if (data.academyLogo) setAcademyLogo(data.academyLogo);
          const savedTemplate = TEMPLATES.find(t => t.id === data.templateId);
          if (savedTemplate) setCurrentTemplate(savedTemplate);
          if (data.layoutMode) setLayoutMode(data.layoutMode as LayoutMode);
          if (data.questionPadding) setPrintOptions((prev: any) => ({ ...prev, questionPadding: data.questionPadding }));
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
      const draft = { title: examTitle, problems: examProblems, updatedAt: Date.now() };
      localStorage.setItem("exam_draft", JSON.stringify(draft));
    }
  }, [examProblems, examTitle, examId, isMounted]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    setHistory(prev => [...prev, examProblems]);
    const items = Array.from(examProblems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    const renumberedItems = items.map((item, index) => ({ ...item, number: index + 1 }));
    setExamProblems(renumberedItems);
  };

  const printRef = useRef<HTMLDivElement>(null);

  // 로고 업로드 핸들러
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !user) return;
    setIsUploadingLogo(true);
    const file = e.target.files[0];
    try {
      const uniqueName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `logos/${user.uid}/${uniqueName}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setAcademyLogo(url);
      toast.success("로고가 등록되었습니다.");
    } catch (error) {
      toast.error("로고 업로드 실패");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // 저장 핸들러
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
        subTitle, 
        academyName,
        problems: cleanProblems,
        templateId: currentTemplate.id,
        layoutMode: layoutMode,
        questionPadding: printOptions.questionPadding,
        academyLogo: academyLogo, 
        createdAt: serverTimestamp(),
        problemCount: examProblems.length,
      });
      
      toast.success("시험지가 보관함에 저장되었습니다!");
      router.push("/service/storage");
    } catch (e) {
      console.error(e);
      toast.error("저장 실패");
    }
    setIsSaving(false);
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

        {/* 컨텐츠 영역: 탭에 따라 구조가 다름 */}
        <div className="flex-1 min-h-0 flex flex-col relative"> 
          
          {/* 1. 조건 설정 탭 (전체 스크롤) */}
          {activeTab === 'filter' && (
            <div className="absolute inset-0 overflow-y-auto p-5 custom-scrollbar space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
              
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
                                onChange={(e) => handleMajorTopicChange(major.name, e.target.checked)}
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

              {/* 난이도별 문항 수 배분 */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex justify-between">
                  <span>난이도 배분</span>
                  <span className="text-blue-600">{questionCount}문항</span>
                </h3>
                <div className="space-y-2">
                  {(['기본', '하', '중', '상', '킬러'] as Difficulty[]).map((level) => (
                    <div key={level} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold w-8 text-center ${level === '킬러' ? 'text-red-500' : 'text-slate-600'}`}>
                          {level}
                        </span>
                        {level === '킬러' && <Lock className="w-3 h-3 text-red-400" />}
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => updateDifficultyCount(level, -1)}
                          className="p-1 text-slate-400 hover:text-blue-600 bg-slate-50 rounded"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold w-4 text-center">{difficultyCounts[level]}</span>
                        <button 
                          onClick={() => updateDifficultyCount(level, 1)}
                          className="p-1 text-slate-400 hover:text-blue-600 bg-slate-50 rounded"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 문항 유형 */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4"/> 문항 유형
                </h3>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={targetQuestionTypes.includes('SELECTION')} onChange={() => toggleQuestionType('SELECTION')} className="rounded text-blue-600 w-4 h-4" />
                    <span className="text-sm text-slate-700 font-bold">객관식</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={targetQuestionTypes.includes('ESSAY')} onChange={() => toggleQuestionType('ESSAY')} className="rounded text-blue-600 w-4 h-4" />
                    <span className="text-sm text-slate-700 font-bold">서답형</span>
                  </label>
                </div>
              </div>
              
              {/* 문항 필터 */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4"/> 문항 필터
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50 bg-white">
                    <input type="checkbox" checked={excludeUsed} onChange={(e) => setExcludeUsed(e.target.checked)} className="rounded text-blue-600 w-4 h-4" />
                    <div>
                      <span className="text-sm font-bold text-slate-700 block">사용 문항 제외</span>
                      <span className="text-xs text-slate-400">최근 1개월 내 사용된 문제 제외</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50 bg-white">
                    <input type="checkbox" checked={excludeNonCurriculum} onChange={(e) => setExcludeNonCurriculum(e.target.checked)} className="rounded text-blue-600 w-4 h-4" />
                    <div>
                      <span className="text-sm font-bold text-slate-700 block">심화 교과 문항 제외</span>
                      <span className="text-xs text-slate-400">심화 교과 및 교육과정 외 문항 제외 (교과서 중심)</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 레이아웃 설정 */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4"/> 배치 모드
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setLayoutMode('dense')} className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs transition-all ${layoutMode === 'dense' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                    <QueueListIcon className="w-5 h-5 mb-1" /> 기본(빼곡)
                  </button>
                  <button onClick={() => setLayoutMode('split-2')} className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs transition-all ${layoutMode === 'split-2' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                    <ViewColumnsIcon className="w-5 h-5 mb-1" /> 2분할
                  </button>
                  <button onClick={() => setLayoutMode('split-4')} className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs transition-all ${layoutMode === 'split-4' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                    <Squares2X2Icon className="w-5 h-5 mb-1" /> 4분할
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg space-y-3 border border-slate-200">
                   {layoutMode === 'dense' && (
                     <div>
                        <div className="flex justify-between text-xs mb-1 text-slate-600">
                           <span>문제 간격 (px)</span>
                           <span className="font-bold text-blue-600">{printOptions.questionPadding}</span>
                        </div>
                        <input type="range" min="10" max="100" step="5" value={printOptions.questionPadding} onChange={(e) => setPrintOptions(prev => ({...prev, questionPadding: Number(e.target.value)}))} className="w-full h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                     </div>
                   )}
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

          {/* 2. 순서/교체 탭 (헤더 고정 + 리스트 스크롤) */}
          {activeTab === 'order' && (
            <div className="absolute inset-0 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
              
              {/* Sticky Header Area */}
              <div className="p-5 pb-3 border-b border-gray-100 bg-white z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <ListOrdered className="w-4 h-4"/> 문항 순서
                  </h3>
                  <button 
                    onClick={handleUndo}
                    disabled={history.length === 0}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-bold transition-colors ${
                      history.length > 0 
                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-blue-600" 
                        : "bg-slate-50 text-slate-300 cursor-not-allowed"
                    }`}
                    title="마지막 변경 취소 (Ctrl+Z)"
                  >
                    <Undo className="w-3.5 h-3.5" /> 되돌리기
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">드래그하여 순서를 변경하세요.</p>
              </div>
              
              {/* Scrollable List */}
              <div className="flex-1 overflow-y-auto p-5 pt-2 custom-scrollbar">
                {isMounted && (
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="exam-problems">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 pb-4">
                          {examProblems.map((prob, index) => (
                            <Draggable key={prob.id} draggableId={prob.id} index={index}>
                              {(provided, snapshot) => (
                                <div 
                                  ref={provided.innerRef} 
                                  {...provided.draggableProps} 
                                  {...provided.dragHandleProps} 
                                  onContextMenu={(e) => e.preventDefault()}
                                  className={`p-2 bg-white border rounded-lg flex items-center gap-3 shadow-sm group ${snapshot.isDragging ? 'shadow-lg border-blue-500 z-50' : 'border-gray-200'}`}
                                >
                                  <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-slate-100 rounded-full text-xs font-bold text-slate-500">{prob.number}</span>
                                  <div className="relative w-12 h-12 bg-slate-50 rounded border border-slate-100 overflow-hidden flex-shrink-0">
                                    {prob.imageUrl ? (
                                      <img 
                                        src={getSecureImageSrc(prob.imageUrl)}
                                        alt={`Problem ${prob.number}`}
                                        className="w-full h-full object-contain pointer-events-none"
                                        onContextMenu={(e) => e.preventDefault()}
                                      />
                                    ) : (
                                      <div className="flex items-center justify-center h-full text-[10px] text-slate-300">Text</div>
                                    )}
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
            </div>
          )}
        </div>
      </aside>

      {/* === Main Preview === */}
      <main className="flex-1 flex flex-col h-full bg-slate-200/50 relative">
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex flex-col gap-1 w-full max-w-lg">
                <input 
                  type="text" 
                  value={examTitle} 
                  onChange={(e) => setExamTitle(e.target.value)} 
                  className="font-bold text-lg text-gray-800 outline-none bg-transparent placeholder-gray-300 w-full" 
                  placeholder="시험지 제목 입력" 
                />
                <div className="flex gap-2">
                   <input 
                     type="text" 
                     value={subTitle} 
                     onChange={(e) => setSubTitle(e.target.value)} 
                     className="text-xs font-medium text-slate-500 outline-none bg-transparent w-40 border-b border-transparent hover:border-slate-200 focus:border-blue-400" 
                     placeholder="부제목 (예: 2025 대비)" 
                   />
                   <span className="text-slate-300">|</span>
                   <input 
                     type="text" 
                     value={academyName} 
                     onChange={(e) => setAcademyName(e.target.value)} 
                     className="text-xs font-medium text-slate-500 outline-none bg-transparent w-32 border-b border-transparent hover:border-slate-200 focus:border-blue-400" 
                     placeholder="학원명 입력" 
                   />
                   <span className="text-slate-300">|</span>
                   <input 
                     type="text" 
                     value={instructorName} 
                     onChange={(e) => setInstructorName(e.target.value)} 
                     className="text-xs font-medium text-slate-500 outline-none bg-transparent w-24 border-b border-transparent hover:border-slate-200 focus:border-blue-400" 
                     placeholder="선생님 성함" 
                   />
                </div>
            </div>
            
            <label className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-xs text-gray-700 transition-colors ${isUploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <ImageIcon className="w-3 h-3" /> 
              {isUploadingLogo ? "업로드 중..." : (academyLogo ? "로고 변경" : "학원 로고")}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleLogoUpload} 
                className="hidden" 
                disabled={isUploadingLogo}
              />
            </label>
          </div>
          
          <div className="flex gap-3">
             <button onClick={handleSaveExam} disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50">
               <SaveIcon className="w-4 h-4" /> {isSaving ? "저장 중..." : "보관함 저장 (출력)"}
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent bg-slate-100">
          <div className="flex flex-col items-center gap-8 pb-20">
             <ExamPaperLayout 
               ref={printRef}
               problems={examProblems || []} 
               title={examTitle}
               instructor={instructorName}
               template={currentTemplate}
               printOptions={{ ...printOptions, layoutMode: layoutMode }}
               isTeacherVersion={isTeacherMode}
               academyLogo={academyLogo}
               subTitle={subTitle}
               academyName={academyName}
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