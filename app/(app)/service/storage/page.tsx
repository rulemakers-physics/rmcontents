"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, query, where, orderBy, getDocs, 
  deleteDoc, doc, Timestamp, addDoc, updateDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { toast } from "react-hot-toast";

// --- Heroicons ---
import { 
  FolderIcon, 
  TrashIcon, 
  DocumentTextIcon, 
  CalendarDaysIcon,
  PencilSquareIcon,
  ChartBarIcon,
  FolderPlusIcon,
  ArrowUturnLeftIcon,
  ChevronRightIcon,
  FolderOpenIcon,
  EllipsisHorizontalIcon,
  ArrowUpTrayIcon
} from "@heroicons/react/24/outline";

// --- DnD Kit ---
import { 
  DndContext, 
  DragEndEvent, 
  useDraggable, 
  useDroppable,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor
} from "@dnd-kit/core";

// --- 타입 정의 ---
interface SavedExam {
  id: string;
  title: string;
  createdAt: Timestamp;
  problemCount: number;
  instructorName: string;
  folderId?: string; 
  problems?: any[];
}

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: Timestamp;
}

// --- [DnD 컴포넌트 1] 드롭 가능한 폴더 ---
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

// --- [DnD 컴포넌트 2] 상위 이동 존 ---
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
          <ArrowUpTrayIcon className="w-5 h-5" />
          {targetName}로 이동
        </div>
      ) : (
        children
      )}
    </div>
  );
}

// --- [DnD 컴포넌트 3] 드래그 가능한 시험지 ---
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

// --- 메인 페이지 컴포넌트 ---
export default function StoragePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // 데이터 상태
  const [savedExams, setSavedExams] = useState<SavedExam[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 폴더 네비게이션 상태
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<Folder[]>([]);

  // 모달 상태
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isMoveMode, setIsMoveMode] = useState<string | null>(null); 

  // DnD 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  // 1. 데이터 불러오기
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

  // 2. Breadcrumbs 계산
  useEffect(() => {
    if (!currentFolderId) {
      setFolderPath([]);
      return;
    }
    const path: Folder[] = [];
    let currentId: string | null = currentFolderId;
    while (currentId) {
      const folder = folders.find(f => f.id === currentId);
      if (folder) {
        path.unshift(folder);
        currentId = folder.parentId;
      } else break;
    }
    setFolderPath(path);
  }, [currentFolderId, folders]);

  // --- 뷰 필터링 ---
  const currentFolders = folders.filter(f => f.parentId === currentFolderId);
  const currentExams = savedExams.filter(e => (e.folderId || null) === currentFolderId);
  const currentFolderObj = folders.find(f => f.id === currentFolderId);
  const parentFolderId = currentFolderObj?.parentId || null;
  const parentFolderName = parentFolderId ? folders.find(f => f.id === parentFolderId)?.name : "Root(최상위)";

  // --- 핸들러: 폴더 생성 ---
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

  // --- 핸들러: Drag & Drop ---
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;
    const examId = active.data.current?.id;
    
    // 폴더로 이동
    if (activeType === "exam" && overType === "folder") {
      const targetFolderId = over.data.current?.id;
      if (examId && targetFolderId) updateExamLocation(examId, targetFolderId, "이동되었습니다.");
    }

    // 상위로 이동
    if (activeType === "exam" && overType === "back-zone") {
      if (!currentFolderId) return; 
      updateExamLocation(examId, parentFolderId, `${parentFolderName}로 이동했습니다.`);
    }
  };

  const updateExamLocation = async (examId: string, targetFolderId: string | null, successMsg: string) => {
    // 낙관적 업데이트
    setSavedExams(prev => prev.map(e => e.id === examId ? { ...e, folderId: targetFolderId || undefined } : e));
    toast.success(successMsg);
    
    // DB 업데이트
    try {
      await updateDoc(doc(db, "saved_exams", examId), { folderId: targetFolderId });
    } catch (e) {
      toast.error("저장 실패 (새로고침 필요)");
      fetchData();
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, "saved_exams", id));
      setSavedExams(prev => prev.filter(e => e.id !== id));
      toast.success("삭제됨");
    } catch (e) { toast.error("오류 발생"); }
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

  const handleCreateNew = () => {
    localStorage.removeItem("exam_draft");
    router.push("/service/maker");
  };

  const handleGoToGrade = (examId: string) => {
    router.push(`/manage/reports?action=input&examId=${examId}`);
  };

  if (loading) return <div className="p-10 text-center">로딩 중...</div>;

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="p-8 max-w-7xl mx-auto min-h-screen bg-slate-50">
        
        {/* 상단 헤더 영역 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FolderIcon className="w-8 h-8 text-blue-600" />
              내 시험지 보관함
            </h1>
            
            <nav className="flex items-center gap-2 text-sm text-slate-500 min-h-[40px]">
              {currentFolderId ? (
                <DroppableBackZone 
                  targetName={parentFolderName || "Root"} 
                  onClick={() => setCurrentFolderId(parentFolderId)}
                >
                  <div className="flex items-center gap-2">
                    <button className="hover:text-blue-600 flex items-center gap-1 font-bold text-slate-800">
                      <ArrowUturnLeftIcon className="w-4 h-4" /> 
                      {parentFolderName}
                    </button>
                    <ChevronRightIcon className="w-4 h-4 text-slate-300" />
                    <span className="font-bold text-blue-600">{currentFolderObj?.name}</span>
                  </div>
                </DroppableBackZone>
              ) : (
                <div className="flex items-center gap-1 px-2 py-1">
                   <FolderOpenIcon className="w-4 h-4" /> Root (최상위)
                </div>
              )}
            </nav>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setIsCreateFolderOpen(true)}
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
            >
              <FolderPlusIcon className="w-4 h-4" /> 폴더 생성
            </button>
            <button 
              onClick={handleCreateNew}
              className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg flex items-center gap-2"
            >
              <PencilSquareIcon className="w-4 h-4" /> 새 시험지
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* 폴더 리스트 */}
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

            {/* 시험지 리스트 */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
                Files ({currentExams.length})
              </h3>
              
              {currentExams.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                  <DocumentTextIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">이 폴더에는 시험지가 없습니다.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentExams.map((exam) => (
                    <DraggableExam key={exam.id} exam={exam}>
                      <div className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all relative flex flex-col justify-between h-full">
                        
                        <div className="flex justify-between items-start mb-3">
                          <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl group-hover:bg-slate-800 group-hover:text-white transition-colors">
                            <DocumentTextIcon className="w-6 h-6" />
                          </div>
                          <button 
                             onPointerDown={(e) => e.stopPropagation()}
                             onClick={() => setIsMoveMode(exam.id)}
                             className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg md:hidden"
                          >
                            <EllipsisHorizontalIcon className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {exam.title}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                            <span className="flex items-center gap-1">
                              <CalendarDaysIcon className="w-3.5 h-3.5" />
                              {exam.createdAt?.toDate().toLocaleDateString()}
                            </span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                            <span>{exam.problemCount}문항</span>
                          </div>
                        </div>

                        <div 
                          className="flex items-center gap-2 pt-4 border-t border-slate-100 mt-auto"
                          onPointerDown={(e) => e.stopPropagation()} 
                        >
                          <button 
                            onClick={() => handleGoToGrade(exam.id)}
                            className="flex-1 py-2 text-xs font-bold text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-1"
                          >
                            <ChartBarIcon className="w-3.5 h-3.5" /> 성적 입력
                          </button>
                          <Link 
                            href={`/service/maker?id=${exam.id}`}
                            className="flex-1 py-2 text-xs font-bold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                          >
                            <PencilSquareIcon className="w-3.5 h-3.5" /> 불러오기/수정
                          </Link>
                          <button 
                            onClick={() => handleDeleteExam(exam.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </DraggableExam>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 모달 1: 폴더 생성 */}
        {isCreateFolderOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
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

        {/* 모달 2: 이동 (모바일/레거시 지원) */}
        {isMoveMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">이동할 폴더 선택</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                <button 
                  onClick={() => updateExamLocation(isMoveMode!, null, "Root로 이동됨") || setIsMoveMode(null)}
                  className="w-full text-left p-3 rounded-lg hover:bg-slate-100 text-sm font-medium text-slate-600 flex items-center gap-2"
                >
                  <FolderOpenIcon className="w-5 h-5 text-slate-400" /> Root (최상위)
                </button>
                {folders.map(f => (
                  <button 
                    key={f.id}
                    onClick={() => updateExamLocation(isMoveMode!, f.id, "이동 완료") || setIsMoveMode(null)}
                    className="w-full text-left p-3 rounded-lg hover:bg-slate-100 text-sm font-medium text-slate-700 flex items-center gap-2"
                  >
                    <FolderIcon className="w-5 h-5 text-blue-500" /> {f.name}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-slate-100">
                <button onClick={() => setIsMoveMode(null)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-bold">취소</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DndContext>
  );
}