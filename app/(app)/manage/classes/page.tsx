// app/(app)/manage/classes/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, query, where, orderBy, getDocs, 
  addDoc, serverTimestamp, doc, deleteDoc 
} from "firebase/firestore";
import { 
  UserGroupIcon, 
  PlusIcon, 
  AcademicCapIcon, 
  ClockIcon,
  EllipsisHorizontalIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { ClassData } from "@/types/academy";
import ClassDetailModal from "@/components/ClassDetailModal"; // 하단에 구현

export default function ClassManagePage() {
  const { user, loading } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 모달 상태
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  
  // 반 생성 입력값
  const [isCreating, setIsCreating] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassTarget, setNewClassTarget] = useState("");

  const fetchClasses = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const q = query(
        collection(db, "classes"),
        where("instructorId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassData));
      setClasses(list);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user) fetchClasses();
  }, [user]);

  const handleCreateClass = async () => {
    if (!newClassName.trim()) return toast.error("반 이름을 입력해주세요.");
    
    try {
      await addDoc(collection(db, "classes"), {
        instructorId: user!.uid,
        name: newClassName,
        targetSchool: newClassTarget,
        studentCount: 0,
        createdAt: serverTimestamp(),
      });
      toast.success("새로운 반이 개설되었습니다.");
      setNewClassName("");
      setNewClassTarget("");
      setIsCreating(false);
      fetchClasses();
    } catch (e) {
      toast.error("반 개설 실패");
    }
  };

  const handleDeleteClass = async (e: React.MouseEvent, classId: string) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
    if (!confirm("반을 삭제하시겠습니까? 소속된 학생 정보도 함께 관리 대상에서 제외됩니다.")) return;
    
    try {
      await deleteDoc(doc(db, "classes", classId));
      // (선택 사항) 해당 반의 학생들도 삭제하는 로직 추가 가능
      toast.success("삭제되었습니다.");
      fetchClasses();
    } catch (e) {
      toast.error("삭제 실패");
    }
  };

  const openDetail = (cls: ClassData) => {
    setSelectedClass(cls);
    setIsDetailOpen(true);
  };

  if (loading) return null;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <UserGroupIcon className="w-8 h-8 text-blue-600" />
              반 및 학생 관리
            </h1>
            <p className="text-slate-500 mt-1">수업 중인 반을 개설하고 학생 명단을 관리하세요.</p>
          </div>
          
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all active:scale-95"
          >
            <PlusIcon className="w-5 h-5" /> 반 개설하기
          </button>
        </div>

        {/* 반 생성 폼 (토글) */}
        {isCreating && (
          <div className="mb-8 bg-white p-6 rounded-2xl border border-blue-100 shadow-sm animate-in slide-in-from-top-2">
            <h3 className="font-bold text-slate-800 mb-4">새 클래스 정보 입력</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <input 
                type="text" placeholder="반 이름 (예: 고2 정규반)" 
                value={newClassName} onChange={(e) => setNewClassName(e.target.value)}
                className="flex-1 p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 ring-1 ring-transparent focus:ring-blue-500"
              />
              <input 
                type="text" placeholder="타겟 학교 (선택)" 
                value={newClassTarget} onChange={(e) => setNewClassTarget(e.target.value)}
                className="flex-1 p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 ring-1 ring-transparent focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button onClick={() => setIsCreating(false)} className="px-6 py-3 text-slate-500 font-bold bg-slate-100 rounded-xl hover:bg-slate-200">취소</button>
                <button onClick={handleCreateClass} className="px-6 py-3 text-white font-bold bg-blue-600 rounded-xl hover:bg-blue-700">개설완료</button>
              </div>
            </div>
          </div>
        )}

        {/* 반 리스트 (그리드) */}
        {classes.length === 0 && !isLoading ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <UserGroupIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">개설된 반이 없습니다.</p>
            <p className="text-sm text-slate-400 mt-1">새로운 반을 만들어 학생들을 관리해보세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <div 
                key={cls.id} 
                onClick={() => openDetail(cls)}
                className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer relative"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <AcademicCapIcon className="w-6 h-6" />
                  </div>
                  <button 
                    onClick={(e) => handleDeleteClass(e, cls.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 mb-1">{cls.name}</h3>
                <p className="text-sm text-slate-500 mb-6">{cls.targetSchool || "학교 미지정"}</p>
                
                <div className="flex items-center justify-between text-sm pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <UserGroupIcon className="w-4 h-4" />
                    <span className="font-bold">{cls.studentCount}명</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 text-xs">
                    <ClockIcon className="w-3.5 h-3.5" />
                    개설: {cls.createdAt?.toDate().toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 상세 모달 */}
      {isDetailOpen && selectedClass && (
        <ClassDetailModal 
          classData={selectedClass} 
          onClose={() => { setIsDetailOpen(false); fetchClasses(); }} 
        />
      )}
    </div>
  );
}