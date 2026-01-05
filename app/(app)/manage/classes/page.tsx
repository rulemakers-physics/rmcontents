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
  UserGroupIcon, PlusIcon, TrashIcon
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { ClassData } from "@/types/academy";
import ClassDetailModal from "@/components/ClassDetailModal"; 
import { UserData } from "@/types/user";

export default function ClassManagePage() {
  const { user, userData, loading } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 모달 및 입력 상태
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassTarget, setNewClassTarget] = useState("");

  const [instructors, setInstructors] = useState<UserData[]>([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState("");

  // [핵심] 권한 체크 변수명 통일 (isManager)
  // 원장(director), 관리자(admin), 또는 전체 관리 권한 강사(manage_all)
  const isManager = userData?.role === 'director' || 
                    userData?.role === 'admin' || 
                    userData?.permissions?.studentManagement === 'manage_all';

  // 1. 강사 목록 로드 (관리자급일 때만)
  useEffect(() => {
    const fetchInstructors = async () => {
      if (user && isManager) {
        try {
          // 조회 대상 ownerId 결정
          const targetOwnerId = (userData?.role === 'director' || userData?.role === 'admin')
            ? user.uid 
            : userData?.ownerId;

          if (targetOwnerId) {
            const q = query(collection(db, "users"), where("ownerId", "==", targetOwnerId));
            const snap = await getDocs(q);
            setInstructors(snap.docs.map(d => d.data() as UserData));
          }
        } catch (e) {
          console.error("강사 목록 로딩 실패", e);
        }
      }
    };
    fetchInstructors();
  }, [user, userData, isManager]);

  // 2. 클래스 목록 불러오기
  const fetchClasses = async () => {
    if (!user || !userData) return;
    setIsLoading(true);
    
    try {
      let q;

      // 관리자급은 'ownerId' 기준으로 모든 반 조회
      if (isManager) {
        const targetOwnerId = (userData.role === 'director' || userData.role === 'admin') 
          ? user.uid 
          : userData.ownerId;

        q = query(
          collection(db, "classes"),
          where("ownerId", "==", targetOwnerId),
          orderBy("createdAt", "desc")
        );
      } 
      // 일반 강사(assigned_only)는 'instructorId' 기준으로 본인 반만 조회
      else {
        q = query(
          collection(db, "classes"),
          where("instructorId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
      }
      
      const snapshot = await getDocs(q);
      setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassData)));
    } catch (e: any) {
      console.error(e);
      if (e.code === 'failed-precondition') {
         toast.error("데이터 색인(Index)이 필요합니다. 콘솔의 링크를 클릭하세요.");
      } else {
         toast.error("반 목록을 불러오지 못했습니다.");
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchClasses();
  }, [user, userData, isManager]);

  // 3. 반 생성 핸들러
  const handleCreateClass = async () => {
    if (!newClassName.trim()) return toast.error("반 이름을 입력해주세요.");
    
    const finalInstructorId = (isManager && selectedInstructorId) ? selectedInstructorId : user!.uid;
    const finalOwnerId = (userData?.role === 'director' || userData?.role === 'admin') ? user!.uid : userData!.ownerId;

    try {
      await addDoc(collection(db, "classes"), {
        instructorId: finalInstructorId, 
        ownerId: finalOwnerId, 
        name: newClassName,
        targetSchool: newClassTarget,
        studentCount: 0,
        createdAt: serverTimestamp(),
        createdBy: user!.uid, 
        createdByName: userData?.name || "Unknown"
      });
      
      toast.success("반이 개설되었습니다.");
      setNewClassName("");
      setNewClassTarget("");
      setSelectedInstructorId("");
      setIsCreating(false);
      fetchClasses();
    } catch (e) {
      console.error(e);
      toast.error("반 개설 실패");
    }
  };

  if (loading) return <div className="p-8 text-center">로딩 중...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <div className="max-w-6xl mx-auto">
        
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <UserGroupIcon className="w-8 h-8 text-blue-600" />
              반 및 학생 관리
            </h1>
            <p className="text-slate-500 mt-1">
              {isManager 
                ? '학원 전체의 반 현황을 파악하고 관리합니다.' 
                : '배정된 반의 수업/과제/성적을 관리합니다.'}
            </p>
          </div>
          
          {/* [수정됨] isManager 변수 사용 */}
          {isManager && (
            <button 
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all active:scale-95"
            >
              <PlusIcon className="w-5 h-5" /> 반 개설하기
            </button>
          )}
        </div>

        {/* 반 생성 폼 */}
        {isCreating && (
          <div className="mb-8 bg-white p-6 rounded-2xl border border-blue-100 shadow-sm animate-in slide-in-from-top-2">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <PlusIcon className="w-4 h-4 text-blue-600" /> 새 클래스 정보 입력
            </h3>
            
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">반 이름</label>
                  <input 
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="예: 고1 통합과학 심화반"
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">대상 학교/학년</label>
                  <input 
                    type="text"
                    value={newClassTarget}
                    onChange={(e) => setNewClassTarget(e.target.value)}
                    placeholder="예: 00고 1학년"
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 강사 배정 (관리자급만 노출) */}
              {isManager && instructors.length > 0 && (
                <div>
                   <label className="block text-sm font-medium text-slate-600 mb-1">담당 강사 지정</label>
                   <select 
                     value={selectedInstructorId}
                     onChange={(e) => setSelectedInstructorId(e.target.value)}
                     className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                   >
                     <option value="">(선택) 담당 강사를 지정하세요</option>
                     {instructors.map(inst => (
                       <option key={inst.uid} value={inst.uid}>
                         {inst.name} ({inst.email})
                       </option>
                     ))}
                   </select>
                   <p className="text-xs text-slate-400 mt-1">* 지정하지 않으면 본인으로 설정됩니다.</p>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-2">
                <button 
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button 
                  onClick={handleCreateClass}
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-colors"
                >
                  개설 완료
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 리스트 */}
        {classes.length === 0 && !isLoading ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <UserGroupIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">
              개설된 반이 없습니다.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <div 
                key={cls.id} 
                onClick={() => { setSelectedClass(cls); setIsDetailOpen(true); }}
                className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md font-medium">
                      {cls.targetSchool || '대상 미지정'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {instructors.find(i => i.uid === cls.instructorId)?.name || '담당 강사'} T
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">
                    {cls.name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    학생 {cls.studentCount}명
                  </p>
                </div>

                {/* [수정됨] 삭제 버튼 권한 체크도 isManager 사용 */}
                {(isManager || cls.createdBy === user?.uid) && (
                  <button 
                    onClick={(e) => {
                       e.stopPropagation();
                       if(confirm('정말 삭제하시겠습니까?')) deleteDoc(doc(db, 'classes', cls.id)).then(fetchClasses);
                    }}
                    className="absolute bottom-6 right-6 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors z-10"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isDetailOpen && selectedClass && (
        <ClassDetailModal 
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          classData={selectedClass}
        />
      )}
    </div>
  );
}