// app/(app)/service/maker/page.tsx

"use client";

import React, { useState, useRef, useEffect, useMemo, Suspense, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import { SCIENCE_UNITS } from "@/types/scienceUnits"; 
import { 
  Printer, Lock, ChevronDown, Filter, 
  LayoutTemplate, Image as ImageIcon, SaveIcon, ListOrdered, 
  RotateCcw, CheckSquare, Settings2, CheckCircle2,
  Undo, Minus, Plus, GripVertical, Info
} from "lucide-react";
import { 
  Squares2X2Icon, ViewColumnsIcon, QueueListIcon, ListBulletIcon,
  MapIcon, Cog6ToothIcon, ChartBarIcon, UserGroupIcon, QuestionMarkCircleIcon // [수정] 올바른 패키지에서 임포트
} from "@heroicons/react/24/outline";
import ExamPaperLayout from "@/components/ExamPaperLayout";
import { ExamPaperProblem, PrintOptions } from "@/types/exam";
import { useAuth } from "@/context/AuthContext";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"; 
import { toast } from "react-hot-toast"; 
import { db, storage } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs, limit, orderBy } from "firebase/firestore"; 
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter, useSearchParams } from "next/navigation"; 

import { useProblemFetcher } from "@/hooks/useProblemFetcher";
import { Difficulty, DBProblem } from "@/types/problem"; 
import { TEMPLATES, ExamTemplateStyle, LayoutMode } from "@/types/examTemplates";
import { getSecureImageSrc } from "@/lib/imageHelper";
import ExamBuilderTour from "@/components/ExamBuilderTour";
import ExamAnalysisPanel from "@/components/ExamAnalysisPanel";
import { ClassData } from "@/types/academy";

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

  // --- [상태] 레이아웃 제어 ---
  const [leftSidebarTab, setLeftSidebarTab] = useState<'units' | 'settings' | 'order'>('units');
  const [showAnalysis, setShowAnalysis] = useState(true);

  // --- [상태] 필터 및 설정 ---
  // 난이도별 문항 수 배분 상태 (기본값 설정)
  const [difficultyCounts, setDifficultyCounts] = useState<Record<Difficulty, number>>({
    "기본": 0, "하": 5, "중": 10, "상": 5, "킬러": 0
  });

  // 총 문항 수 (자동 계산)
  const questionCount = useMemo(() => 
    Object.values(difficultyCounts).reduce((a, b) => a + b, 0), 
  [difficultyCounts]);

  const [selectedMajorTopics, setSelectedMajorTopics] = useState<string[]>([]);
  const [selectedMinorTopics, setSelectedMinorTopics] = useState<string[]>([]);

  // 기타 필터
  const [excludeUsed, setExcludeUsed] = useState(true);
  const [usedProblemIds, setUsedProblemIds] = useState<string[]>([]);
  const [excludeNonCurriculum, setExcludeNonCurriculum] = useState(false);
  const [targetQuestionTypes, setTargetQuestionTypes] = useState<string[]>(['SELECTION', 'ESSAY']);

  // Refs
  const isDraftLoadedRef = useRef(false);
  const isDbLoadedRef = useRef(false);

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
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('dense');
  const [isClinicMode, setIsClinicMode] = useState(false);

  // 문제 데이터
  const [examProblems, setExamProblems] = useState<ExamPaperProblem[]>([]);
  const [history, setHistory] = useState<ExamPaperProblem[][]>([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false); 
  const [isMounted, setIsMounted] = useState(false);

  // [신규] 반 선택 관련 상태
  const [availableClasses, setAvailableClasses] = useState<ClassData[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  // 마운트 체크
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
    difficulties: [], // 전체 난이도를 가져와서 클라이언트에서 선별
    excludedProblemIds: excludeUsed ? usedProblemIds : [],
    questionTypes: targetQuestionTypes,
    excludeNonCurriculum: excludeNonCurriculum,
  });

  // [기능] 문항 유형 토글
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

  // [기능] 난이도별 문항 수 조절 (수정된 버전)
  const updateDifficultyCount = (level: Difficulty, delta: number) => {
    isDraftLoadedRef.current = false;
    isDbLoadedRef.current = false;
    
    // 1. 킬러 문항 권한 체크
    if (level === '킬러' && delta > 0 && userPlan !== 'MAKERS') {
      toast.error("킬러 문항은 Maker's Plan 전용입니다.");
      return;
    }

    // 2. [변경] 유효성 검사를 setState 밖에서 먼저 수행
    // 현재 상태(difficultyCounts)를 기준으로 총합 계산
    const currentTotal = Object.values(difficultyCounts).reduce((a, b) => a + b, 0);

    // 문항을 추가(delta > 0)하려는데 이미 50개 이상이라면? -> 중단
    if (delta > 0 && currentTotal >= 50) {
      toast.error("최대 50문항까지 구성 가능합니다.");
      return; // 상태 업데이트(setDifficultyCounts)를 아예 실행하지 않고 종료
    }

    // 3. 검사를 통과했으므로 안전하게 값 변경
    setDifficultyCounts(prev => {
      const newValue = Math.max(0, prev[level] + delta);
      return { ...prev, [level]: newValue };
    });
  };

  // [신규] 난이도 직접 입력 핸들러
  const handleDifficultyInput = (level: Difficulty, valueStr: string) => {
    isDraftLoadedRef.current = false;
    isDbLoadedRef.current = false;

    // 1. 숫자만 추출
    let newValue = parseInt(valueStr.replace(/[^0-9]/g, ''), 10);
    if (isNaN(newValue)) newValue = 0;
    
    const currentCount = difficultyCounts[level];
    const delta = newValue - currentCount;

    if (delta === 0) return; // 변경 없음

    // 2. 킬러 문항 권한 체크 (증가 시에만)
    if (level === '킬러' && delta > 0 && userPlan !== 'MAKERS') {
      toast.error("킬러 문항은 Maker's Plan 전용입니다.");
      return; // 변경 취소 (기존 값 유지)
    }

    // 3. 50문제 한도 체크 및 자동 조절 (Clamping)
    const currentTotal = Object.values(difficultyCounts).reduce((a, b) => a + b, 0);
    const otherTotal = currentTotal - currentCount; // 현재 레벨 제외한 나머지 합
    const maxAllowed = 50 - otherTotal; // 이 레벨에 할당 가능한 최대치

    if (newValue > maxAllowed) {
      newValue = maxAllowed;
      toast.error(`최대 50문항까지만 가능하여 ${newValue}개로 조절되었습니다.`);
    }

    setDifficultyCounts(prev => ({ ...prev, [level]: newValue }));
  };

  // 대단원 선택 핸들러
  const handleMajorTopicChange = (majorName: string, isChecked: boolean) => {
    isDraftLoadedRef.current = false;
    isDbLoadedRef.current = false;
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

  // 소단원 선택 핸들러
  const handleMinorTopicChange = (minor: string, isChecked: boolean) => {
    isDraftLoadedRef.current = false;
    isDbLoadedRef.current = false;
    
    setSelectedMinorTopics(prev => {
      if (isChecked) return [...prev, minor];
      return prev.filter(t => t !== minor);
    });

    if (isChecked) {
      const parentMajor = SCIENCE_UNITS.flatMap(u => u.majorTopics)
        .find(major => major.minorTopics.includes(minor));
      if (parentMajor) {
        setSelectedMajorTopics(prev => {
          if (prev.includes(parentMajor.name)) return prev;
          return [...prev, parentMajor.name];
        });
      }
    }
    setExamProblems([]); 
  };

  // [수정된 로직] 사용자 제안 반영: 낮은 난이도부터 단원별로 돌아가며 채우기
  useEffect(() => {
    if (!isLoaded || isFetching) return;
    if (isClinicMode) return;
    if (isDbLoadedRef.current) { isDbLoadedRef.current = false; return; }
    if (isDraftLoadedRef.current) { isDraftLoadedRef.current = false; return; }

    if (fetchedProblems.length > 0) {
      // 1. 문제 풀(Pool) 구성: Difficulty -> MinorTopic -> DBProblem[]
      const pool: Record<string, Record<string, DBProblem[]>> = {};
      
      fetchedProblems.forEach(p => {
        if (!pool[p.difficulty]) pool[p.difficulty] = {};
        if (!pool[p.difficulty][p.minorTopic]) pool[p.difficulty][p.minorTopic] = [];
        pool[p.difficulty][p.minorTopic].push(p);
      });

      // 2. 단원별 누적 선택 횟수 카운터 (Global Tracker)
      const topicUsageCount: Record<string, number> = {};
      // 초기값에 약간의 랜덤성을 주어(0 또는 -0.5 등) 매번 똑같은 단원 순서로 뽑히는 것 방지 (선택 사항)
      selectedMinorTopics.forEach(topic => {
        topicUsageCount[topic] = 0;
      });

      const finalSelectedProblems: DBProblem[] = [];

      // 3. [핵심] 난이도 오름차순 순회 (기본 -> 킬러)
      // 사용자의 의도대로 낮은 난이도부터 채워나갑니다.
      const difficultySequence: Difficulty[] = ['기본', '하', '중', '상', '킬러'];

      difficultySequence.forEach((diff) => {
        const targetCount = difficultyCounts[diff] || 0;
        if (targetCount <= 0) return;

        let needed = targetCount;
        
        // 해당 난이도의 목표 개수를 채울 때까지 반복
        while (needed > 0) {
          // A. 현재 난이도의 문제를 '하나라도 가지고 있는' 소단원만 후보로 선정
          const availableTopics = selectedMinorTopics.filter(topic => 
            pool[diff] && pool[diff][topic] && pool[diff][topic].length > 0
          );

          // 더 이상 뽑을 수 있는 소단원이 없으면 중단 (문제 부족 시 무한루프 방지)
          if (availableTopics.length === 0) break;

          // B. [우선순위 결정]
          // 1순위: 지금까지 가장 적게 뽑힌 단원 (topicUsageCount 오름차순)
          // 2순위: 동률일 경우 랜덤 (매번 같은 단원만 먼저 뽑히는 쏠림 방지)
          availableTopics.sort((a, b) => {
            const countDiff = topicUsageCount[a] - topicUsageCount[b];
            if (countDiff !== 0) return countDiff;
            return Math.random() - 0.5;
          });

          // C. 최우선 단원 선정
          const targetTopic = availableTopics[0];
          const topicPool = pool[diff][targetTopic];
          
          // D. 해당 단원 풀에서 랜덤 1개 추출
          const randIdx = Math.floor(Math.random() * topicPool.length);
          const selectedProblem = topicPool[randIdx];

          // E. 결과 저장 및 상태 업데이트
          finalSelectedProblems.push(selectedProblem);
          
          topicUsageCount[targetTopic]++; // 이 단원은 이제 1번 더 뽑힌 상태가 됨
          topicPool.splice(randIdx, 1);   // 중복 방지를 위해 풀에서 제거
          
          needed--;
        }
      });

      // 4. 정렬 (소단원 순서 -> 난이도 순서)
      const allMinorTopicsOrdered = SCIENCE_UNITS.flatMap(s => s.majorTopics.flatMap(m => m.minorTopics));
      
      finalSelectedProblems.sort((a, b) => {
         const idxA = allMinorTopicsOrdered.indexOf(a.minorTopic);
         const idxB = allMinorTopicsOrdered.indexOf(b.minorTopic);
         if (idxA !== idxB) return idxA - idxB;
         
         const diffA = DIFFICULTY_ORDER[a.difficulty] || 3;
         const diffB = DIFFICULTY_ORDER[b.difficulty] || 3;
         return diffA - diffB;
      });

      // 5. 화면 표시용 데이터 매핑
      const formatted: ExamPaperProblem[] = finalSelectedProblems.map((p, idx) => ({
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
        dataTypes: (p as any).dataTypes,
        isConvergence: (p as any).isConvergence,
      }));
        
      setExamProblems(formatted);
    } 
    else if (fetchedProblems.length === 0 && selectedMajorTopics.length > 0) {
      setExamProblems([]);
    }
  }, [
    fetchedProblems, 
    difficultyCounts, 
    isLoaded, 
    isFetching, 
    isClinicMode, 
    selectedMajorTopics.length, 
    JSON.stringify(selectedMinorTopics) 
  ]);

  // 문제 교체 핸들러
  const handleReplaceProblem = useCallback(async (problemId: string, currentMajor: string, currentDifficulty: string) => {
    if (!currentMajor) return;
    const toastId = toast.loading("유사 문항을 탐색 중...");
    
    try {
      const currentProblemRef = doc(db, "problems", problemId);
      const currentProblemSnap = await getDoc(currentProblemRef);
      const currentProblemData = currentProblemSnap.data() as DBProblem;

      let newProblemData: DBProblem | null = null;

      // 1. DB에 저장된 유사 문항 우선 검색
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

      // 2. 없으면 같은 조건 검색
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
        setHistory(prev => [...prev, examProblems]); // 히스토리 저장

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
              solutionHeight: (newProblemData as any).solutionHeight,
              materialLevel: newProblemData!.materialLevel
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
          const { title, problems, updatedAt, selectedMajorTopics: savedMajor, selectedMinorTopics: savedMinor } = parsed;
          
          if (Date.now() - updatedAt < 24 * 60 * 60 * 1000) {
            setExamTitle(title || "");
            if (savedMajor) setSelectedMajorTopics(savedMajor);
            if (savedMinor) setSelectedMinorTopics(savedMinor);
            
            if (Array.isArray(problems) && problems.length > 0) {
              setExamProblems(problems);
              isDraftLoadedRef.current = true;
            }
            toast("임시 저장된 시험지를 불러왔습니다.", { icon: '📂' });
          }
        } catch (e) {
          localStorage.removeItem("exam_draft");
        }
      }
      setIsLoaded(true);
    }
  }, [examId, isMounted]);
  
  // [신규] 사용자가 접근 가능한 반 목록 불러오기
  useEffect(() => {
    if (!user || !userData) return;
    
    const fetchClasses = async () => {
      try {
        let q;
        // 원장: 본인 소유의 모든 반
        if (userData.role === 'director') {
          q = query(
            collection(db, "classes"),
            where("ownerId", "==", user.uid),
            orderBy("createdAt", "desc")
          );
        } 
        // 강사: 본인이 담당하는 반
        else {
          q = query(
            collection(db, "classes"),
            where("instructorId", "==", user.uid),
            orderBy("createdAt", "desc")
          );
        }
        
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassData));
        setAvailableClasses(list);
        
        // (수정 모드일 때) 불러온 시험지에 classId가 있다면 자동 선택
        // -> loadExam useEffect에서 처리됨
      } catch (e) {
        console.error("반 목록 로딩 실패", e);
      }
    };
    
    fetchClasses();
  }, [user, userData]);

  // DB 시험지 불러오기 (수정 모드)
  useEffect(() => {
    if (!examId) return;
    const loadExam = async () => {
      try {
        const docRef = doc(db, "saved_exams", examId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          setExamTitle(data.title);
          setInstructorName(data.instructorName);
          if (data.subTitle) setSubTitle(data.subTitle);
          if (data.academyName) setAcademyName(data.academyName);
          if (data.academyLogo) setAcademyLogo(data.academyLogo);

          const savedTemplate = TEMPLATES.find(t => t.id === data.templateId);
          if (savedTemplate) setCurrentTemplate(savedTemplate);
          if (data.layoutMode) setLayoutMode(data.layoutMode as LayoutMode);
          if (data.questionPadding) setPrintOptions((prev: any) => ({ ...prev, questionPadding: data.questionPadding }));

          if (data.selectedMajorTopics) setSelectedMajorTopics(data.selectedMajorTopics);
          if (data.selectedMinorTopics) setSelectedMinorTopics(data.selectedMinorTopics);

          if (data.isClinic) setIsClinicMode(true);
          else setIsClinicMode(false);

          // [신규] 저장된 반 정보 복구
          if (data.classId) setSelectedClassId(data.classId);

          setExamProblems(data.problems || []);
          isDbLoadedRef.current = true;

          toast.success("시험지를 불러왔습니다.");
        }
      } catch (error) {
        console.error(error);
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
      const draft = { 
        title: examTitle, 
        problems: examProblems,
        selectedMajorTopics,
        selectedMinorTopics,
        updatedAt: Date.now() 
      };
      localStorage.setItem("exam_draft", JSON.stringify(draft));
    }
  }, [examProblems, examTitle, examId, isMounted, selectedMajorTopics, selectedMinorTopics]);

  // 드래그 앤 드롭
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

  // 로고 업로드
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

  // 저장하기
  const handleSaveExam = async () => {
    // [수정] user와 userData가 모두 있는지 확인합니다.
    if (!user || !userData) { 
      toast.error("로그인 정보가 없습니다."); 
      return; 
    }
    if (examProblems.length === 0) { toast.error("문제가 없습니다."); return; }
    // [신규] 반 선택 강제 (선택 사항으로 둘 수도 있지만, 데이터 구조상 필수로 권장)
    if (!selectedClassId) {
      toast.error("이 시험지를 사용할 반을 선택해주세요.");
      return;
    }

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
        solutionHeight: p.solutionHeight,
        materialLevel: p.materialLevel || null,
        customLabel: p.customLabel || null
      }));

      // 선택된 반 이름 찾기
      const targetClass = availableClasses.find(c => c.id === selectedClassId);
      // [신규] 소유주 ID 결정 (원장이면 본인, 강사면 소속 원장)
      const ownerId = userData.role === 'director' ? user.uid : (userData.ownerId || user.uid);

      await addDoc(collection(db, "saved_exams"), {
        userId: user.uid,
        ownerId: ownerId,
        instructorName,
        title: examTitle,
        subTitle, 
        academyName,
        problems: cleanProblems,
        
        selectedMajorTopics, 
        selectedMinorTopics,
        
        templateId: currentTemplate.id,
        layoutMode: layoutMode,
        questionPadding: printOptions.questionPadding,
        academyLogo: academyLogo, 

        // [신규] 반 정보 저장
        classId: selectedClassId,
        className: targetClass?.name || "미지정 반",

        createdAt: serverTimestamp(),
        problemCount: examProblems.length,
        
        isClinic: isClinicMode 
      }); 
      
      toast.success("시험지가 보관함에 저장되었습니다!");
      router.push("/service/storage");
    } catch (e) {
      console.error(e);
      toast.error("저장 실패");
    }
    setIsSaving(false);
  };

  // Undo (되돌리기)
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

  // [신규] 투어 다시보기 핸들러
  const handleRestartTour = () => {
    if (confirm("이용 가이드를 다시 보시겠습니까?\n(페이지가 새로고침 됩니다)")) {
      localStorage.removeItem("hasSeenExamBuilderTour_v5");
      window.location.reload();
    }
  };

  if (!isLoaded || !isMounted) return <div className="flex h-screen items-center justify-center">로딩 중...</div>;

  return (
    <div className="flex w-full h-[calc(100vh-64px)] bg-gray-50 font-sans overflow-hidden">
      <ExamBuilderTour />
      
      {/* 1. 통합 왼쪽 사이드바 */}
      <aside className="w-96 flex-shrink-0 bg-white border-r border-gray-200 overflow-hidden flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="flex border-b border-gray-100">
          <button 
            id="tab-units"
            onClick={() => setLeftSidebarTab('units')} 
            className={`flex-1 py-4 text-xs font-bold transition-all border-b-2 flex flex-col items-center gap-1 ${leftSidebarTab === 'units' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <MapIcon className="w-5 h-5" /> 단원 선택
          </button>
          <button 
            id="tab-settings"
            onClick={() => setLeftSidebarTab('settings')} 
            className={`flex-1 py-4 text-xs font-bold transition-all border-b-2 flex flex-col items-center gap-1 ${leftSidebarTab === 'settings' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <Cog6ToothIcon className="w-5 h-5" /> 구성 설정
          </button>
          <button 
            id="tab-order"
            onClick={() => setLeftSidebarTab('order')} 
            className={`flex-1 py-4 text-xs font-bold transition-all border-b-2 flex flex-col items-center gap-1 ${leftSidebarTab === 'order' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <ListBulletIcon className="w-5 h-5" /> 문항 순서
            {examProblems.length > 0 && <span className="bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] absolute top-2 ml-4">{examProblems.length}</span>}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-slate-50/30">
          
          {/* TAB 1: 단원 선택 */}
          {leftSidebarTab === 'units' && (
            <div id="maker-unit-selection" className="p-5 animate-in fade-in slide-in-from-left-2 duration-200">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-800 mb-1">출제 범위 선택</h3>
                <p className="text-xs text-slate-400">대단원 또는 소단원을 체크하세요.</p>
              </div>
              {isClinicMode && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
                   <div className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg flex items-center gap-1">
                     <Lock className="w-3 h-3" /> 클리닉 모드 (필터 잠김)
                   </div>
                </div>
              )}
              <div className="space-y-2">
                {SCIENCE_UNITS.map((subject) => (
                  <div key={subject.name} className="mb-2">
                    <div className="text-xs font-bold text-gray-400 mb-1 ml-1">{subject.name}</div>
                    {subject.majorTopics.map((major) => (
                      <details key={major.name} className="group mb-1 border rounded-xl border-gray-200 bg-white overflow-hidden shadow-sm">
                        <summary className="flex items-center justify-between text-sm cursor-pointer list-none p-3 hover:bg-gray-50 transition-colors">
                          <label className="flex items-center gap-2 cursor-pointer w-full select-none" onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" checked={selectedMajorTopics.includes(major.name)} onChange={(e) => handleMajorTopicChange(major.name, e.target.checked)} className="rounded text-blue-600 w-4 h-4 border-gray-300 focus:ring-blue-500" />
                            <span className={`font-bold ${selectedMajorTopics.includes(major.name) ? "text-slate-800" : "text-slate-500"}`}>{major.name.split('. ')[1] || major.name}</span>
                          </label>
                          <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform"/>
                        </summary>
                        <div className="px-3 pb-3 pt-1 space-y-1 bg-gray-50/50 border-t border-gray-100">
                          {major.minorTopics.map((minor) => (
                            <label key={minor} className="flex items-center gap-2 py-1.5 px-2 cursor-pointer hover:bg-blue-50 rounded-lg transition-colors group/item">
                              <input type="checkbox" checked={selectedMinorTopics.includes(minor)} onChange={(e) => handleMinorTopicChange(minor, e.target.checked)} className="rounded border-gray-300 text-blue-500 w-3.5 h-3.5 focus:ring-blue-500" />
                              <span className={`text-xs ${selectedMinorTopics.includes(minor) ? "text-blue-700 font-bold" : "text-slate-600 group-hover/item:text-slate-900"}`}>{minor}</span>
                            </label>
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: 설정 */}
          {leftSidebarTab === 'settings' && (
            <div id="maker-settings-panel" className="p-5 animate-in fade-in slide-in-from-left-2 duration-200 space-y-6">
               {isClinicMode && (
                  <div className="text-center p-4 bg-yellow-50 border border-yellow-100 rounded-xl mb-4">
                    <p className="text-base font-bold text-yellow-700">⚠️ 클리닉 수정 모드</p>
                    <p className="text-[12px] text-yellow-600 mt-1">오답 클리닉의 구조 유지를 위해 자동 생성 필터가 제한됩니다.</p>
                  </div>
                )}

               {/* [수정됨] 난이도 배분 UI */}
               <div className={isClinicMode ? 'opacity-50 pointer-events-none' : ''}>
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex justify-between">
                    <span>난이도 배분</span>
                    <span className="text-blue-600">{questionCount}문항</span>
                  </h3>
                  <div className="space-y-2">
                    {(['기본', '하', '중', '상', '킬러'] as Difficulty[]).map((level) => (
                      <div key={level} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold w-8 text-center ${level === '킬러' ? 'text-red-500' : 'text-slate-600'}`}>{level}</span>
                          
                          {/* [수정] 킬러 문항 자물쇠: MAKERS 플랜이 아닐 때만 표시 */}
                          {level === '킬러' && userPlan !== 'MAKERS' && (
                            <Lock className="w-3 h-3 text-red-400" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          {/* 마이너스 버튼 */}
                          <button 
                            onClick={() => updateDifficultyCount(level, -1)} 
                            className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          
                          {/* [수정] 숫자 직접 입력 인풋 */}
                          <input
                            type="text"
                            inputMode="numeric"
                            value={difficultyCounts[level]}
                            onChange={(e) => handleDifficultyInput(level, e.target.value)}
                            onFocus={(e) => e.target.select()} // 클릭 시 전체 선택되어 바로 수정 편하게
                            className="w-10 h-7 text-center text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none transition-all"
                          />
                          
                          {/* 플러스 버튼 */}
                          <button 
                            onClick={() => updateDifficultyCount(level, 1)} 
                            className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>

               {/* 문항 유형 */}
               <div className={`pt-4 border-t border-gray-200 ${isClinicMode ? 'opacity-50 pointer-events-none' : ''}`}>
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> 문항 유형</h3>
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

               {/* 필터 옵션 */}
               <div className={`pt-4 border-t border-gray-200 ${isClinicMode ? 'opacity-50 pointer-events-none' : ''}`}>
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><CheckSquare className="w-4 h-4"/> 필터 옵션</h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50 bg-white">
                      <input type="checkbox" checked={excludeUsed} onChange={(e) => setExcludeUsed(e.target.checked)} className="rounded text-blue-600 w-4 h-4" />
                      <div><span className="text-sm font-bold text-slate-700 block">사용 문항 제외</span><span className="text-xs text-slate-400">최근 1개월 내 사용된 문제 제외</span></div>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50 bg-white">
                      <input type="checkbox" checked={excludeNonCurriculum} onChange={(e) => setExcludeNonCurriculum(e.target.checked)} className="rounded text-blue-600 w-4 h-4" />
                      <div><span className="text-sm font-bold text-slate-700 block">심화 교과 문항 제외</span><span className="text-xs text-slate-400">교육과정 외 문항 제외</span></div>
                    </label>
                  </div>
               </div>

               {/* 레이아웃 */}
               <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><LayoutTemplate className="w-4 h-4"/> 배치 모드</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => setLayoutMode('dense')} className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs transition-all ${layoutMode === 'dense' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}><QueueListIcon className="w-5 h-5 mb-1" /> 기본</button>
                    <button onClick={() => setLayoutMode('split-2')} className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs transition-all ${layoutMode === 'split-2' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}><ViewColumnsIcon className="w-5 h-5 mb-1" /> 2분할</button>
                    <button onClick={() => setLayoutMode('split-4')} className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs transition-all ${layoutMode === 'split-4' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}><Squares2X2Icon className="w-5 h-5 mb-1" /> 4분할</button>
                  </div>
                  {layoutMode === 'dense' && (
                     <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="flex justify-between text-xs mb-1 text-slate-600"><span>문제 간격 (px)</span><span className="font-bold text-blue-600">{printOptions.questionPadding}</span></div>
                        <input type="range" min="10" max="100" step="5" value={printOptions.questionPadding} onChange={(e) => setPrintOptions(prev => ({...prev, questionPadding: Number(e.target.value)}))} className="w-full h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                     </div>
                  )}
               </div>

               {/* 출력 옵션 */}
               <div className="pt-4 border-t border-gray-200 pb-10">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Printer className="w-4 h-4"/> 출력 옵션</h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50"><input type="checkbox" checked={printOptions.questions} onChange={(e) => setPrintOptions(prev => ({...prev, questions: e.target.checked}))} className="rounded text-blue-600" /><span className="text-sm text-slate-700">문제지 포함</span></label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50"><input type="checkbox" checked={printOptions.answers} onChange={(e) => setPrintOptions(prev => ({...prev, answers: e.target.checked}))} className="rounded text-blue-600" /><span className="text-sm text-slate-700">빠른 정답 포함</span></label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50"><input type="checkbox" checked={printOptions.solutions} onChange={(e) => setPrintOptions(prev => ({...prev, solutions: e.target.checked}))} className="rounded text-blue-600" /><span className="text-sm text-slate-700">해설지 포함</span></label>
                  </div>
               </div>
            </div>
          )}

          {/* TAB 3: 순서 */}
          {leftSidebarTab === 'order' && (
            <div id="maker-order-panel" className="p-0 animate-in fade-in slide-in-from-left-2 duration-200 h-full flex flex-col">
               <div className="p-4 border-b border-gray-100 bg-white z-10">
                 <div className="flex items-center justify-between mb-3">
                   <span className="text-xs font-bold text-slate-500">총 {examProblems.length} 문항</span>
                   <button onClick={handleUndo} disabled={history.length === 0} className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-bold transition-colors ${history.length > 0 ? "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-blue-600" : "bg-slate-50 text-slate-300 cursor-not-allowed"}`}><Undo className="w-3.5 h-3.5" /> 되돌리기</button>
                 </div>
               </div>
               <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-10">
                {isMounted && (
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="exam-problems">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                          {examProblems.length === 0 ? <div className="text-center py-10 text-gray-400 text-sm">문제가 없습니다.<br/>왼쪽 탭에서 단원을 선택해주세요.</div> : examProblems.map((prob, index) => (
                            <Draggable key={prob.id} draggableId={prob.id} index={index}>
                              {(provided, snapshot) => (
                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} onContextMenu={(e) => e.preventDefault()} className={`p-2 bg-white border rounded-lg flex items-center gap-3 shadow-sm group cursor-grab active:cursor-grabbing ${snapshot.isDragging ? 'shadow-lg border-blue-500 z-50' : 'border-gray-200 hover:border-blue-300'}`}>
                                  <div className="text-slate-300 group-hover:text-slate-400 transition-colors"><GripVertical className="w-4 h-4" /></div>
                                  <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-slate-100 rounded-full text-xs font-bold text-slate-500">{prob.number}</span>
                                  <div className="relative w-10 h-10 bg-slate-50 rounded border border-slate-100 overflow-hidden flex-shrink-0">
                                    {prob.imageUrl ? <img src={getSecureImageSrc(prob.imageUrl)} alt={`Problem ${prob.number}`} className="w-full h-full object-contain pointer-events-none" /> : <div className="flex items-center justify-center h-full text-[10px] text-slate-300">Text</div>}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-800 truncate">{prob.minorTopic}</p>
                                    <span className="text-[10px] text-slate-500">{prob.difficulty}</span>
                                  </div>
                                  <button onClick={() => handleReplaceProblem(prob.id, prob.majorTopic || "", prob.difficulty || "중")} onPointerDown={(e) => e.stopPropagation()} className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded cursor-pointer" title="유사 문항 교체"><RotateCcw className="w-3.5 h-3.5" /></button>
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

      {/* 2. 메인 프리뷰 */}
      <main className="flex-1 flex flex-col h-full bg-slate-100 relative min-w-0 transition-all duration-300">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 shadow-sm z-10">
          <div id="maker-exam-title" className="flex items-center gap-4 flex-1">
            {/* [신규] 반 선택 드롭다운 (제목 입력 왼쪽에 배치) */}
            <div className="relative">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <option value="">반 선택 (필수)</option>
                {availableClasses.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
              <UserGroupIcon className="w-4 h-4 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="h-6 w-px bg-slate-200 mx-2"></div>

            <div className="flex flex-col gap-1 w-full max-w-lg">
                <input type="text" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} className="font-bold text-lg text-gray-800 outline-none bg-transparent placeholder-gray-300 w-full truncate" placeholder="시험지 제목 입력" />
                <div className="flex gap-2">
                   <input type="text" value={subTitle} onChange={(e) => setSubTitle(e.target.value)} className="text-xs font-medium text-slate-500 outline-none bg-transparent w-40 border-b border-transparent hover:border-slate-200 focus:border-blue-400 truncate" placeholder="부제목" />
                   <span className="text-slate-300">|</span>
                   <input type="text" value={academyName} onChange={(e) => setAcademyName(e.target.value)} className="text-xs font-medium text-slate-500 outline-none bg-transparent w-32 border-b border-transparent hover:border-slate-200 focus:border-blue-400 truncate" placeholder="학원명" />
                   <span className="text-slate-300">|</span>
                   <input type="text" value={instructorName} onChange={(e) => setInstructorName(e.target.value)} className="text-xs font-medium text-slate-500 outline-none bg-transparent w-24 border-b border-transparent hover:border-slate-200 focus:border-blue-400 truncate" placeholder="선생님" />
                </div>
            </div>
            <label className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-xs text-gray-700 transition-colors ${isUploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <ImageIcon className="w-3 h-3" /> {isUploadingLogo ? "업로드 중..." : (academyLogo ? "로고 변경" : "학원 로고")}
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={isUploadingLogo} />
            </label>
          </div>
          <div className="flex gap-3 ml-auto">
             {/* [신규] 투어 다시보기 버튼 */}
             <button 
               onClick={handleRestartTour} 
               className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
               title="가이드 다시보기"
             >
               <QuestionMarkCircleIcon className="w-5 h-5" />
             </button>
             {/* [신규] 분석 패널 토글 버튼 */}
             <button onClick={() => setShowAnalysis(!showAnalysis)} className={`p-2 rounded-lg transition-colors border ${showAnalysis ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`} title="분석 패널 토글"><ChartBarIcon className="w-5 h-5" /></button>
             <button id="maker-save-button" onClick={handleSaveExam} disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"><SaveIcon className="w-4 h-4" /> {isSaving ? "저장 중..." : "보관함 저장"}</button>
          </div>
        </header>
        <div id="maker-preview-stage" className="flex-1 overflow-y-auto p-10 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent bg-slate-100">
          <div className="flex flex-col items-center gap-8 pb-20">
             <ExamPaperLayout ref={printRef} id={examId || undefined} problems={examProblems || []} title={examTitle} instructor={instructorName} template={currentTemplate} printOptions={{ ...printOptions, layoutMode: layoutMode }} isTeacherVersion={isTeacherMode} academyLogo={academyLogo} subTitle={subTitle} academyName={academyName} />
          </div>
        </div>
      </main>

      {/* 3. 우측 분석 패널 */}
      <aside className={`flex-shrink-0 bg-white border-l border-gray-200 transition-all duration-300 ease-in-out z-10 ${showAnalysis ? "w-80 translate-x-0" : "w-0 translate-x-full opacity-0 overflow-hidden"}`}>
        <ExamAnalysisPanel problems={examProblems} />
      </aside>
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