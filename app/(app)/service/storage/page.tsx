// app/(app)/service/storage/page.tsx

"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, query, where, orderBy, getDocs, 
  deleteDoc, doc, Timestamp, addDoc, updateDoc, 
  serverTimestamp, writeBatch 
} from "firebase/firestore";
import { toast } from "react-hot-toast";

// --- Icons ---
import { 
  FolderIcon, TrashIcon, DocumentTextIcon, CalendarDaysIcon,
  PencilSquareIcon, PencilIcon, FolderPlusIcon, ArrowUturnLeftIcon,
  ChevronRightIcon, FolderOpenIcon, PrinterIcon, SparklesIcon,
  ChevronDownIcon, ChevronUpIcon, ListBulletIcon, Squares2X2Icon,
  MagnifyingGlassIcon, FunnelIcon, CheckCircleIcon, EllipsisHorizontalIcon,
  ArrowRightOnRectangleIcon, ChartBarIcon
} from "@heroicons/react/24/outline";

// --- DnD Kit (Grid View용 유지) ---
import { 
  DndContext, DragEndEvent, useDraggable, useDroppable,
  useSensor, useSensors, PointerSensor, TouchSensor
} from "@dnd-kit/core";

import ExamPrintModal from "@/components/ExamPrintModal";
import { SavedExam } from "@/types/exam";
import { LayoutMode } from "@/types/examTemplates";

// --- Helper Functions ---
const formatDate = (dateValue: any) => {
  if (!dateValue) return "-";
  if (dateValue.toDate) return dateValue.toDate().toLocaleDateString();
  return new Date(dateValue).toLocaleDateString();
};

// --- Types ---
interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: Timestamp;
}

// --- DnD Components (Grid View) ---
function DroppableFolder({ folder, children, onClick }: { folder: Folder, children: React.ReactNode, onClick: () => void }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `folder-${folder.id}`,
    data: { type: "folder", id: folder.id },
  });

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={`
        group relative p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center
        ${isOver 
          ? "bg-blue-100 border-blue-500 ring-2 ring-blue-300 shadow-lg scale-[1.02]" 
          : "bg-white border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md"
        }
      `}
    >
      {children}
    </div>
  );
}

function DroppableBackZone({ targetName, children, onClick }: { targetName: string, children: React.ReactNode, onClick: () => void }) {
  const { setNodeRef, isOver } = useDroppable({
    id: "nav-back-zone",
    data: { type: "back-zone" },
  });

  return (
    <div 
      ref={setNodeRef}
      onClick={onClick}
      className={`
        transition-all duration-200 rounded-xl border border-transparent
        ${isOver 
          ? "bg-blue-600 text-white shadow-lg scale-105 ring-4 ring-blue-200 border-blue-700 px-4 py-2" 
          : ""
        }
      `}
    >
      {isOver ? (
        <div className="flex items-center gap-2 font-bold animate-pulse">
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          {targetName}로 이동
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function DraggableExam({ exam, children }: { exam: SavedExam, children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `exam-${exam.id}`,
    data: { type: "exam", id: exam.id },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 9999,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        relative h-full transition-shadow touch-none
        ${isDragging ? "opacity-90 shadow-2xl rotate-2 scale-105 z-50" : ""}
      `}
    >
      {children}
    </div>
  );
}

// --- Main Page Component ---
export default function StoragePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Data State
  const [savedExams, setSavedExams] = useState<SavedExam[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View State
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<Folder[]>([]);

  // Filter & Sort State
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<'date-desc' | 'date-asc' | 'name-asc'>('date-desc');

  // Selection & Expansion State
  const [selectedExamIds, setSelectedExamIds] = useState<Set<string>>(new Set());
  const [expandedExamIds, setExpandedExamIds] = useState<Set<string>>(new Set());

  // Modal State
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isMoveMode, setIsMoveMode] = useState<boolean>(false); // 일괄 이동 모드
  const [isLegacyMoveMode, setIsLegacyMoveMode] = useState<string | null>(null); // 단일 이동 (Grid용)
  const [printTargetExam, setPrintTargetExam] = useState<SavedExam | null>(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string, name: string } | null>(null);
  const [renameInput, setRenameInput] = useState("");

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  // 1. Data Fetching
  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const folderQuery = query(collection(db, "folders"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
      const folderSnap = await getDocs(folderQuery);
      setFolders(folderSnap.docs.map(d => ({ id: d.id, ...d.data() } as Folder)));

      const examQuery = query(collection(db, "saved_exams"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
      const examSnap = await getDocs(examQuery);
      setSavedExams(examSnap.docs.map(d => ({ id: d.id, ...d.data() } as SavedExam)));

    } catch (err) {
      console.error(err);
      toast.error("데이터 로딩 실패");
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!loading && user) fetchData();
  }, [loading, user, fetchData]);

  // 2. Breadcrumbs
  useEffect(() => {
    if (!currentFolderId) {
      setFolderPath([]);
      return;
    }
    const path: Folder[] = [];
    let currentId: string | null = currentFolderId;
    // 무한 루프 방지용 limit
    let limit = 0;
    while (currentId && limit < 10) {
      const folder = folders.find(f => f.id === currentId);
      if (folder) {
        path.unshift(folder);
        currentId = folder.parentId;
      } else break;
      limit++;
    }
    setFolderPath(path);
  }, [currentFolderId, folders]);

  // 3. Process Data (Filter, Sort, Group)
  // [수정] processedExams와 clinicMap을 포함한 객체를 processedExams 변수로 받도록 rest syntax(...) 사용
  const { currentFolders, ...processedExams } = useMemo(() => {
    // A. Folders
    const currentFoldersFiltered = folders.filter(f => f.parentId === currentFolderId); // [참고] 내부 변수명 충돌 방지 위해 살짝 변경 권장되나 로직상 흐름은 유지

    // B. Exams Filtering
    let filtered = savedExams.filter(e => (e.folderId || null) === currentFolderId);

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(e => e.title.toLowerCase().includes(lower));
    }

    // C. Sorting [수정된 부분]
    filtered.sort((a, b) => {
      if (sortOption === 'name-asc') return a.title.localeCompare(b.title);
      
      // 안전한 날짜 변환 헬퍼 함수
      const getTime = (date: any) => {
        if (!date) return 0;
        // Firestore Timestamp
        if (typeof date.toDate === 'function') return date.toDate().getTime();
        // JS Date 객체
        if (date instanceof Date) return date.getTime();
        // 그 외 (number 등)
        return Number(date) || 0;
      };

      const dateA = getTime(a.createdAt);
      const dateB = getTime(b.createdAt);
      
      return sortOption === 'date-asc' ? dateA - dateB : dateB - dateA;
    });

    // D. Grouping (Tree Structure)
    // 현재 리스트에 있는 시험지들 중에서 '부모-자식' 관계 형성
    const parents: SavedExam[] = [];
    const clinicMap: Record<string, SavedExam[]> = {};

    // 1. 맵핑
    filtered.forEach(exam => {
      if (exam.isClinic && exam.parentExamId) {
        if (!clinicMap[exam.parentExamId]) clinicMap[exam.parentExamId] = [];
        clinicMap[exam.parentExamId].push(exam);
      }
    });

    // 2. 구조화 (부모가 현재 리스트에 없으면 클리닉도 최상위로 표시)
    filtered.forEach(exam => {
      // 클리닉인데 부모가 현재 리스트에 있으면 -> 건너뜀 (부모 밑에 넣을 거니까)
      // 단, 부모가 현재 리스트에 없으면 -> 그냥 보여줌
      const parentInList = exam.parentExamId ? filtered.find(e => e.id === exam.parentExamId) : false;
      
      if (exam.isClinic && parentInList) {
        // Skip (will be rendered under parent)
      } else {
        parents.push(exam);
      }
    });

    return { processedExams: parents, clinicMap, currentFolders: currentFoldersFiltered };
  }, [savedExams, folders, currentFolderId, searchTerm, sortOption]);

  const currentFolderObj = folders.find(f => f.id === currentFolderId);
  const parentFolderId = currentFolderObj?.parentId || null;
  const parentFolderName = parentFolderId ? folders.find(f => f.id === parentFolderId)?.name : "Root";

  // --- Handlers ---

  // Selection
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedExamIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedExamIds(newSet);
  };

  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      const allIds = new Set<string>();
      // 현재 보이는 모든 시험지 (클리닉 포함) ID 수집
      const addIdsRecursive = (exams: SavedExam[]) => {
        exams.forEach(e => {
          allIds.add(e.id);
          const children = (processedExams as any).clinicMap?.[e.id]; // useMemo 밖에서 접근 불가하므로 아래에서 처리
        });
      };
      // 단순하게 현재 필터된 원본 savedExams 중 현재 폴더에 있는 것들만
      const currentFolderExamIds = savedExams
        .filter(e => (e.folderId || null) === currentFolderId)
        .map(e => e.id);
      setSelectedExamIds(new Set(currentFolderExamIds));
    } else {
      setSelectedExamIds(new Set());
    }
  };

  const toggleExpansion = (id: string) => {
    const newSet = new Set(expandedExamIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedExamIds(newSet);
  };

  // Bulk Actions
  const handleBulkDelete = async () => {
    if (selectedExamIds.size === 0) return;
    if (!confirm(`선택한 ${selectedExamIds.size}개의 시험지를 삭제하시겠습니까?`)) return;

    try {
      const batch = writeBatch(db);
      selectedExamIds.forEach(id => {
        const ref = doc(db, "saved_exams", id);
        batch.delete(ref);
      });
      await batch.commit();
      
      setSavedExams(prev => prev.filter(e => !selectedExamIds.has(e.id)));
      setSelectedExamIds(new Set());
      toast.success("삭제되었습니다.");
    } catch (e) {
      console.error(e);
      toast.error("일괄 삭제 실패");
    }
  };

  const handleBulkMove = async (targetFolderId: string | null) => {
    try {
      const batch = writeBatch(db);
      selectedExamIds.forEach(id => {
        const ref = doc(db, "saved_exams", id);
        batch.update(ref, { folderId: targetFolderId });
      });
      await batch.commit();

      setSavedExams(prev => prev.map(e => selectedExamIds.has(e.id) ? { ...e, folderId: targetFolderId || undefined } : e));
      setSelectedExamIds(new Set());
      setIsMoveMode(false);
      toast.success("이동되었습니다.");
    } catch (e) {
      console.error(e);
      toast.error("이동 실패");
    }
  };

  // Single Item Actions
  const handleDeleteExam = async (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, "saved_exams", id));
      setSavedExams(prev => prev.filter(e => e.id !== id));
      toast.success("삭제됨");
    } catch (e) { toast.error("오류 발생"); }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return toast.error("폴더명을 입력해주세요.");
    if (!user) return;
    try {
      await addDoc(collection(db, "folders"), {
        userId: user.uid,
        name: newFolderName,
        parentId: currentFolderId,
        createdAt: serverTimestamp()
      });
      toast.success("폴더 생성 완료");
      setNewFolderName("");
      setIsCreateFolderOpen(false);
      fetchData();
    } catch (e) {
      toast.error("폴더 생성 실패");
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    const hasChildren = folders.some(f => f.parentId === folderId) || savedExams.some(e => e.folderId === folderId);
    if (hasChildren) return toast.error("폴더가 비어있지 않습니다.");
    if (!confirm("폴더를 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, "folders", folderId));
      setFolders(prev => prev.filter(f => f.id !== folderId));
      toast.success("폴더 삭제됨");
    } catch (e) { toast.error("오류 발생"); }
  };

  const handleRenameFolder = async () => {
    if (!renameInput.trim()) return toast.error("폴더명을 입력해주세요.");
    if (!renameTarget) return;
    try {
      await updateDoc(doc(db, "folders", renameTarget.id), { name: renameInput });
      setFolders(prev => prev.map(f => f.id === renameTarget.id ? { ...f, name: renameInput } : f));
      toast.success("변경되었습니다.");
      setIsRenameModalOpen(false);
    } catch (e) { toast.error("변경 실패"); }
  };

  // Navigation & Utils
  const handleCreateNew = () => {
    localStorage.removeItem("exam_draft");
    router.push("/service/maker");
  };

  const handleGoToGrade = (examId: string) => {
    router.push(`/manage/reports?action=input&examId=${examId}`);
  };

  // DnD Handlers (Grid View & Folder Move)
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const examId = active.data.current?.id;
    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType === "exam" && overType === "folder") {
      const targetFolderId = over.data.current?.id;
      // Optimistic update
      setSavedExams(prev => prev.map(e => e.id === examId ? { ...e, folderId: targetFolderId } : e));
      try {
        await updateDoc(doc(db, "saved_exams", examId), { folderId: targetFolderId });
        toast.success("이동되었습니다.");
      } catch (e) { toast.error("이동 실패"); fetchData(); }
    } else if (activeType === "exam" && overType === "back-zone") {
      if (!currentFolderId) return;
      setSavedExams(prev => prev.map(e => e.id === examId ? { ...e, folderId: parentFolderId || undefined } : e));
      try {
        await updateDoc(doc(db, "saved_exams", examId), { folderId: parentFolderId });
        toast.success(`${parentFolderName}로 이동했습니다.`);
      } catch (e) { toast.error("이동 실패"); fetchData(); }
    }
  };

  // --- Rendering Helpers ---
  const renderBadge = (exam: SavedExam) => {
    if (exam.isClinic) return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">클리닉</span>;
    // mode 필드가 없으면 기본적으로 실전/연습 구분 불가하나, 가상으로 구분
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">시험지</span>;
  };

  const handleOpenPrint = (exam: SavedExam) => {
    const printData: SavedExam = {
      ...exam,
      // 필요한 경우 누락된 필드 보정
      problems: exam.problems || [],
      layoutMode: (exam.layoutMode as LayoutMode) || 'dense',
      questionPadding: exam.questionPadding || 40,
      templateId: exam.templateId || 'math-pro'
    };
    setPrintTargetExam(printData);
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-blue-600"></div></div>;

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-full bg-slate-50 font-sans">
        
        {/* --- Header --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FolderIcon className="w-8 h-8 text-blue-600" />
              내 시험지 보관함
            </h1>
            
            {/* Breadcrumbs / Folder Nav */}
            <nav className="flex items-center gap-2 text-sm text-slate-500 min-h-[32px]">
              {currentFolderId ? (
                <DroppableBackZone targetName={parentFolderName || "Root"} onClick={() => setCurrentFolderId(parentFolderId)}>
                  <div className="flex items-center gap-2 group cursor-pointer">
                    <button className="flex items-center gap-1 font-bold text-slate-600 group-hover:text-blue-600 transition-colors">
                      <ArrowUturnLeftIcon className="w-4 h-4" /> {parentFolderName}
                    </button>
                    <ChevronRightIcon className="w-4 h-4 text-slate-300" />
                    <span className="font-bold text-blue-600 flex items-center gap-1">
                      <FolderOpenIcon className="w-4 h-4" /> {currentFolderObj?.name}
                    </span>
                  </div>
                </DroppableBackZone>
              ) : (
                <div className="flex items-center gap-1 px-2 py-1 font-medium text-slate-600">
                   <FolderOpenIcon className="w-4 h-4" /> Root (최상위)
                </div>
              )}
            </nav>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setIsCreateFolderOpen(true)} className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2 text-sm">
              <FolderPlusIcon className="w-4 h-4" /> 폴더 생성
            </button>
            <button onClick={handleCreateNew} className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg flex items-center gap-2 text-sm">
              <PencilSquareIcon className="w-4 h-4" /> 새 시험지
            </button>
          </div>
        </div>

        {/* --- Toolbar (Search, Filter, View Toggle, Bulk Actions) --- */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Left: Bulk Actions OR Search/Sort */}
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto no-scrollbar">
            {selectedExamIds.size > 0 ? (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg whitespace-nowrap">
                  {selectedExamIds.size}개 선택됨
                </span>
                <button onClick={() => setIsMoveMode(true)} className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">
                  <ArrowRightOnRectangleIcon className="w-4 h-4" /> 이동
                </button>
                <button onClick={handleBulkDelete} className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100">
                  <TrashIcon className="w-4 h-4" /> 삭제
                </button>
                <button onClick={() => setSelectedExamIds(new Set())} className="text-xs text-slate-400 hover:text-slate-600 underline ml-2">
                  선택 해제
                </button>
              </div>
            ) : (
              <>
                {/* Search */}
                <div className="relative group">
                  <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="시험지 제목 검색" 
                    className="pl-9 pr-4 py-2 w-48 md:w-64 bg-slate-50 border border-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-xl text-sm transition-all outline-none"
                  />
                </div>
                
                {/* Sort */}
                <div className="relative">
                  <select 
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as any)}
                    className="appearance-none pl-9 pr-8 py-2 bg-slate-50 border border-transparent hover:border-slate-200 rounded-xl text-sm font-bold text-slate-600 cursor-pointer focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                  >
                    <option value="date-desc">최신순</option>
                    <option value="date-asc">오래된순</option>
                    <option value="name-asc">이름순</option>
                  </select>
                  <FunnelIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </>
            )}
          </div>

          {/* Right: View Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="리스트 뷰"
            >
              <ListBulletIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="그리드 뷰"
            >
              <Squares2X2Icon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* 1. Folder List (Grid Only for Folders, or common) */}
            {currentFolders.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Folders</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {currentFolders.map((folder) => (
                    <DroppableFolder 
                      key={folder.id} 
                      folder={folder} 
                      onClick={() => setCurrentFolderId(folder.id)}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <FolderIcon className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-slate-700 truncate">{folder.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setRenameTarget(folder); setRenameInput(folder.name); setIsRenameModalOpen(true); }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </DroppableFolder>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Exam List */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
                Files ({processedExams.processedExams.length})
              </h3>
              
              {processedExams.processedExams.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                  <DocumentTextIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">이 폴더에는 시험지가 없습니다.</p>
                </div>
              ) : viewMode === 'list' ? (
                // === [LIST VIEW] ===
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  {/* [해결 1] table-fixed 적용 
                    - 열 너비를 고정하여 내부 콘텐츠 변화에도 레이아웃이 흔들리지 않게 함 
                  */}
                  <table className="w-full text-left border-collapse table-fixed">
                    <colgroup>
                      <col className="w-14" />
                      <col className="" />
                      <col className="w-24" />
                      <col className="w-32" />
                      <col className="w-40" />
                    </colgroup>
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase border-b border-slate-200">
                        <th className="p-4 text-center">
                          <input 
                            type="checkbox" 
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            checked={savedExams.length > 0 && selectedExamIds.size === savedExams.filter(e => (e.folderId || null) === currentFolderId).length}
                          />
                        </th>
                        <th className="p-4">시험지명</th>
                        <th className="p-4 text-center">문항수</th>
                        <th className="p-4 text-center">생성일</th>
                        <th className="p-4 text-center">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {processedExams.processedExams.map((exam) => {
                        const clinicList = processedExams.clinicMap[exam.id] || [];
                        const hasClinics = clinicList.length > 0;
                        const isExpanded = expandedExamIds.has(exam.id);

                        return (
                          <React.Fragment key={exam.id}>
                            {/* Parent Row */}
                            <tr className={`transition-colors group ${isExpanded ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}>
                              <td className="p-4 text-center">
                                <input 
                                  type="checkbox" 
                                  checked={selectedExamIds.has(exam.id)}
                                  onChange={() => toggleSelection(exam.id)}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                              </td>
                              <td className="p-4">
                                <div className="flex items-center">
                                  
                                  {/* [해결 2] 아이콘 공간 고정 (w-8) */}
                                  <div className="w-8 flex-shrink-0 flex justify-center mr-1">
                                    {hasClinics ? (
                                      <button 
                                        onClick={() => toggleExpansion(exam.id)}
                                        className="p-1 rounded-md hover:bg-slate-200 text-slate-400 transition-colors"
                                      >
                                        {isExpanded ? <ChevronUpIcon className="w-4 h-4"/> : <ChevronDownIcon className="w-4 h-4"/>}
                                      </button>
                                    ) : (
                                      // 아이콘이 없을 때도 공간을 차지하는 투명 박스
                                      <div className="w-6 h-6" /> 
                                    )}
                                  </div>

                                  <div className="flex flex-col min-w-0 pr-4"> {/* min-w-0: truncate 작동 필수 조건 */}
                                    <div className="flex items-center gap-2">
                                      {renderBadge(exam)}
                                      <span className="font-bold text-slate-800 truncate" title={exam.title}>
                                        {exam.title}
                                      </span>
                                    </div>
                                    <span className="text-xs text-slate-400 mt-0.5 truncate">
                                      ID: {exam.id}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-center text-sm font-medium text-slate-600">
                                {exam.problemCount}
                              </td>
                              <td className="p-4 text-center text-xs text-slate-500">
                                {formatDate(exam.createdAt)}
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleGoToGrade(exam.id)} title="성적 입력" className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg">
                                    <ChartBarIcon className="w-4 h-4" />
                                  </button>
                                  <Link href={`/service/maker?id=${exam.id}`} title="수정" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                    <PencilIcon className="w-4 h-4" />
                                  </Link>
                                  <button onClick={() => handleOpenPrint(exam)} title="인쇄" className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                    <PrinterIcon className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDeleteExam(exam.id)} title="삭제" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Nested Clinic Rows */}
                            {isExpanded && clinicList.map(clinic => (
                              <tr key={clinic.id} className="bg-slate-50/50 hover:bg-purple-50/10 transition-colors">
                                <td className="p-4 text-center relative">
                                  {/* 계층 연결선 디자인 (선택 사항) */}
                                  <div className="absolute right-0 top-0 bottom-1/2 w-px bg-slate-200" />
                                  <input 
                                    type="checkbox" 
                                    checked={selectedExamIds.has(clinic.id)}
                                    onChange={() => toggleSelection(clinic.id)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer relative z-10"
                                  />
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center pl-9"> {/* 부모 텍스트 시작점(w-8 + mr-1)과 맞추기 위해 패딩 조정 */}
                                    <ArrowUturnLeftIcon className="w-3 h-3 text-slate-300 rotate-180 mr-2 flex-shrink-0" />
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-700 border border-purple-200 mr-2 flex-shrink-0">클리닉</span>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-sm font-medium text-slate-700 truncate">{clinic.title}</span>
                                      <span className="text-xs text-slate-400">학생: {clinic.studentName || "-"}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 text-center text-sm text-slate-600">
                                  {clinic.problemCount}
                                </td>
                                <td className="p-4 text-center text-xs text-slate-500">
                                  {formatDate(clinic.createdAt)}
                                </td>
                                <td className="p-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <Link href={`/service/maker?id=${clinic.id}`} title="수정" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                      <PencilIcon className="w-4 h-4" />
                                    </Link>
                                    <button onClick={() => handleOpenPrint(clinic)} title="인쇄" className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                      <PrinterIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDeleteExam(clinic.id)} title="삭제" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                      <TrashIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                // === [GRID VIEW] (Existing Logic with Enhancements) ===
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {processedExams.processedExams.map((exam) => (
                    <DraggableExam key={exam.id} exam={exam}>
                      <div className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all relative flex flex-col justify-between h-full">
                        {/* Grid Card Content (Same as before but cleaner) */}
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div className={`p-2.5 rounded-xl transition-colors ${exam.isClinic ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                              {exam.isClinic ? <SparklesIcon className="w-6 h-6"/> : <DocumentTextIcon className="w-6 h-6" />}
                            </div>
                            <div className="flex gap-1" onPointerDown={(e) => e.stopPropagation()}>
                               {/* Single item move for grid */}
                               <button onClick={() => setIsLegacyMoveMode(exam.id)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><ArrowRightOnRectangleIcon className="w-5 h-5"/></button>
                               <button onClick={() => handleOpenPrint(exam)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><PrinterIcon className="w-5 h-5"/></button>
                               <button onClick={() => handleDeleteExam(exam.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">{exam.title}</h3>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span className="flex items-center gap-1"><CalendarDaysIcon className="w-3.5 h-3.5" /> {formatDate(exam.createdAt)}</span>
                              <span className="w-1 h-1 bg-slate-300 rounded-full" />
                              <span>{exam.problemCount}문항</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 pt-4 border-t border-slate-100 mt-auto" onPointerDown={(e) => e.stopPropagation()}>
                          <button onClick={() => handleGoToGrade(exam.id)} className="flex-1 py-2 text-xs font-bold text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-1">
                            <ChartBarIcon className="w-3.5 h-3.5" /> 성적
                          </button>
                          <Link href={`/service/maker?id=${exam.id}`} className="flex-1 py-2 text-xs font-bold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1">
                            <PencilSquareIcon className="w-3.5 h-3.5" /> 수정
                          </Link>
                        </div>
                      </div>
                    </DraggableExam>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- Modals --- */}
        
        {/* 1. 폴더 생성 모달 */}
        {isCreateFolderOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold text-slate-900 mb-4">새 폴더 만들기</h3>
              <input 
                autoFocus
                type="text" 
                placeholder="폴더 이름" 
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setIsCreateFolderOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-bold">취소</button>
                <button onClick={handleCreateFolder} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">생성</button>
              </div>
            </div>
          </div>
        )}

        {/* 2. 폴더 이름 변경 모달 */}
        {isRenameModalOpen && renameTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">폴더 이름 변경</h3>
              <input 
                autoFocus
                type="text" 
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder()}
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setIsRenameModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-bold">취소</button>
                <button onClick={handleRenameFolder} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">변경</button>
              </div>
            </div>
          </div>
        )}

        {/* 3. 폴더 이동 모달 (Bulk & Single) */}
        {(isMoveMode || isLegacyMoveMode) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                {isMoveMode ? `${selectedExamIds.size}개 항목 이동` : "이동할 폴더 선택"}
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                <button 
                  onClick={() => {
                    if (isMoveMode) handleBulkMove(null);
                    else {
                      if (isLegacyMoveMode) updateExamLocation(isLegacyMoveMode, null, "Root로 이동됨");
                      setIsLegacyMoveMode(null);
                    }
                  }}
                  className="w-full text-left p-3 rounded-lg hover:bg-slate-100 text-sm font-medium text-slate-600 flex items-center gap-2"
                >
                  <FolderOpenIcon className="w-5 h-5 text-slate-400" /> Root (최상위)
                </button>
                {folders.map(f => (
                  <button 
                    key={f.id}
                    onClick={() => {
                      if (isMoveMode) handleBulkMove(f.id);
                      else {
                        if (isLegacyMoveMode) updateExamLocation(isLegacyMoveMode, f.id, "이동 완료");
                        setIsLegacyMoveMode(null);
                      }
                    }}
                    className="w-full text-left p-3 rounded-lg hover:bg-slate-100 text-sm font-medium text-slate-700 flex items-center gap-2"
                  >
                    <FolderIcon className="w-5 h-5 text-blue-500" /> {f.name}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-slate-100">
                <button onClick={() => { setIsMoveMode(false); setIsLegacyMoveMode(null); }} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-bold">취소</button>
              </div>
            </div>
          </div>
        )}

        {/* 4. 인쇄 모달 */}
        {printTargetExam && (
          <ExamPrintModal 
            exam={printTargetExam} 
            onClose={() => setPrintTargetExam(null)} 
          />
        )}

      </div>
    </DndContext>
  );

  // Helper for single drag logic
  async function updateExamLocation(examId: string, targetFolderId: string | null, successMsg: string) {
    setSavedExams(prev => prev.map(e => e.id === examId ? { ...e, folderId: targetFolderId || undefined } : e));
    toast.success(successMsg);
    try {
      await updateDoc(doc(db, "saved_exams", examId), { folderId: targetFolderId });
    } catch (e) {
      toast.error("저장 실패 (새로고침 필요)");
      fetchData();
    }
  }
}