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
  UserGroupIcon, PlusIcon, AcademicCapIcon, ClockIcon, TrashIcon,
  ExclamationCircleIcon // [추가] 경고 아이콘
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

  // 강사 목록 및 선택
  const [instructors, setInstructors] = useState<UserData[]>([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState("");

  // 1. 강사 목록 불러오기 (원장님인 경우에만)
  useEffect(() => {
    const fetchInstructors = async () => {
      // [수정] Role 체크 강화
      if (user && userData?.role === 'director') {
        try {
          const q = query(collection(db, "users"), where("ownerId", "==", user.uid));
          const snap = await getDocs(q);
          setInstructors(snap.docs.map(d => d.data() as UserData));
        } catch (e) {
          console.error("강사 목록 로딩 실패", e);
        }
      }
    };
    fetchInstructors();
  }, [user, userData]);

  // 2. 클래스 목록 불러오기 (쿼리 로직 개선)
  const fetchClasses = async () => {
    if (!user || !userData) return;
    setIsLoading(true);
    
    try {
      let q;

      // [B2B 핵심 로직]
      // 원장(Director): 내가 소유주(Owner)인 모든 반 조회 (내가 만든 것 + 내 강사가 만든 것)
      if (userData.role === 'director') {
        q = query(
          collection(db, "classes"),
          where("ownerId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
      } 
      // 강사(Instructor): 
      // 1. 내가 담당 강사(instructorId)로 지정된 반 (원장이 만들어준 것 포함)
      // 2. OR 내가 직접 만든 반 (ownerId 로직은 생성 시 처리)
      else {
        // Firestore OR 쿼리 제약으로 인해, instructorId 기준으로 조회하는 것이 가장 깔끔함
        q = query(
          collection(db, "classes"),
          where("instructorId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
      }
      
      const snapshot = await getDocs(q);
      setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassData)));
    } catch (e) {
      console.error(e);
      toast.error("반 목록을 불러오지 못했습니다.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchClasses();
  }, [user, userData]);

  // 3. 반 생성 핸들러 (데이터 무결성 강화)
  const handleCreateClass = async () => {
    if (!newClassName.trim()) return toast.error("반 이름을 입력해주세요.");
    
    // [A] 담당 강사 ID 결정
    // 원장이 생성 시: 선택한 강사 ID (선택 안했으면 본인)
    // 강사가 생성 시: 본인 ID
    const finalInstructorId = (userData?.role === 'director' && selectedInstructorId) 
      ? selectedInstructorId 
      : user!.uid;

    // [B] 소유주(Owner) ID 결정 (B2B 핵심)
    // 강사가 생성 시: 나의 고용주(userData.ownerId)가 있다면 그 사람이 Owner. (학원 자산으로 귀속)
    // 원장이 생성 시: 본인이 Owner.
    let finalOwnerId = user!.uid; // 기본값은 나

    if (userData?.role === 'instructor') {
      if (userData.ownerId) {
        finalOwnerId = userData.ownerId; // 학원 소유로 설정
      } else {
        // 프리랜서 강사 or 아직 연동 안 된 강사
        finalOwnerId = user!.uid; 
      }
    }

    try {
      await addDoc(collection(db, "classes"), {
        instructorId: finalInstructorId, 
        ownerId: finalOwnerId, // [중요] 계산된 소유주 ID 저장
        name: newClassName,
        targetSchool: newClassTarget,
        studentCount: 0,
        createdAt: serverTimestamp(),
        // [신규] 생성자 정보도 남기면 추적 용이
        createdBy: user!.uid, 
        createdByName: userData?.name || "Unknown"
      });
      
      const msg = userData?.role === 'director' && selectedInstructorId !== user!.uid
        ? "강사님에게 배정된 반이 개설되었습니다."
        : "새로운 반이 개설되었습니다.";
        
      toast.success(msg);
      
      // 초기화
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

  const handleDeleteClass = async (e: React.MouseEvent, classId: string) => {
    e.stopPropagation();
    if (!confirm("반을 삭제하시겠습니까? 학생 데이터도 관리 대상에서 제외됩니다.")) return;
    
    try {
      await deleteDoc(doc(db, "classes", classId));
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

  const getInstructorName = (instId: string) => {
    if (instId === user?.uid) return "나 (본인)";
    const found = instructors.find(i => i.uid === instId);
    return found ? `${found.name} T` : "알 수 없음";
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
              {userData?.role === 'director' 
                ? '학원 전체의 반 현황을 파악하고 관리합니다.' 
                : '수업 중인 반을 개설하고 학생을 관리하세요.'}
            </p>
          </div>
          
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all active:scale-95"
          >
            <PlusIcon className="w-5 h-5" /> 반 개설하기
          </button>
        </div>

        {/* 반 생성 폼 */}
        {isCreating && (
          <div className="mb-8 bg-white p-6 rounded-2xl border border-blue-100 shadow-sm animate-in slide-in-from-top-2">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <PlusIcon className="w-4 h-4 text-blue-600" /> 새 클래스 정보 입력
            </h3>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* 이름 입력 */}
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">반 이름</label>
                  <input 
                    type="text" placeholder="예: 고2 정규반 A" 
                    value={newClassName} onChange={(e) => setNewClassName(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 ring-1 ring-transparent focus:ring-blue-500"
                  />
                </div>
                
                {/* 학교 입력 */}
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">타겟 학교 (선택)</label>
                  <input 
                    type="text" placeholder="예: 서울고, 경기고" 
                    value={newClassTarget} onChange={(e) => setNewClassTarget(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 ring-1 ring-transparent focus:ring-blue-500"
                  />
                </div>

                {/* [B2B 개선] 원장님일 경우 담당 강사 지정 */}
                {userData?.role === 'director' && (
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1">담당 강사 배정</label>
                    <select
                      value={selectedInstructorId}
                      onChange={(e) => setSelectedInstructorId(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded-xl outline-none bg-white focus:border-blue-500 cursor-pointer"
                    >
                      <option value={user?.uid}>본인 (원장 직강)</option>
                      {instructors.map(inst => (
                        <option key={inst.uid} value={inst.uid}>{inst.name} 선생님</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* 하단 안내 및 버튼 */}
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  {userData?.role === 'instructor' && userData.ownerId ? (
                    <>
                      <ExclamationCircleIcon className="w-4 h-4 text-blue-500" /> 
                      <span className="text-blue-600 font-medium">이 반은 소속 학원(원장님)의 자산으로 등록됩니다.</span>
                    </>
                  ) : (
                    <span>* 개설 후에도 반 정보 수정이 가능합니다.</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setIsCreating(false)} className="px-5 py-2.5 text-slate-500 font-bold bg-slate-100 rounded-xl hover:bg-slate-200">취소</button>
                  <button onClick={handleCreateClass} className="px-6 py-2.5 text-white font-bold bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md">개설완료</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 반 리스트 */}
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
                className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <AcademicCapIcon className="w-6 h-6" />
                    </div>
                    
                    {/* 삭제 버튼: 소유주(Owner)이거나 담당 강사일 때 */}
                    {(user?.uid === cls.ownerId || user?.uid === cls.instructorId) && (
                      <button 
                        onClick={(e) => handleDeleteClass(e, cls.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{cls.name}</h3>
                  <p className="text-sm text-slate-500 mb-3">{cls.targetSchool || "학교 미지정"}</p>
                  
                  {/* [B2B] 원장님 뷰에서는 담당 강사 표시 */}
                  {userData?.role === 'director' && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                      담당: {getInstructorName(cls.instructorId)}
                    </div>
                  )}
                  {/* [B2B] 강사 뷰에서 원장 소유임을 표시 */}
                  {userData?.role === 'instructor' && cls.ownerId !== user?.uid && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-purple-50 text-purple-700 rounded-lg mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                      학원 소유
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-sm pt-4 border-t border-slate-50 mt-2">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <UserGroupIcon className="w-4 h-4" />
                    <span className="font-bold">{cls.studentCount}명</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 text-xs">
                    <ClockIcon className="w-3.5 h-3.5" />
                    {cls.createdAt?.toDate().toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isDetailOpen && selectedClass && (
        <ClassDetailModal 
          classData={selectedClass} 
          onClose={() => { setIsDetailOpen(false); fetchClasses(); }} 
        />
      )}
    </div>
  );
}