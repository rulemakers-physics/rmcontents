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
  UserGroupIcon, PlusIcon, AcademicCapIcon, ClockIcon, TrashIcon
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

  // 2. 클래스 목록 불러오기 (로직 개선됨)
  const fetchClasses = async () => {
    if (!user || !userData) return;
    setIsLoading(true);
    
    try {
      let q;

      // [개선된 로직]
      // 원장(Director): 'ownerId'가 내 ID인 모든 반 조회 (내가 만든 반 + 내 강사들이 만든 반)
      // 강사(Instructor): 'instructorId'가 내 ID인 반만 조회
      
      if (userData.role === 'director') {
        // 원장님은 학원 전체 클래스를 봅니다.
        q = query(
          collection(db, "classes"),
          where("ownerId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
      } else {
        // 강사님은 본인 클래스만 봅니다.
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

  // 3. 반 생성 핸들러 (데이터 소유권 로직 추가)
  const handleCreateClass = async () => {
    if (!newClassName.trim()) return toast.error("반 이름을 입력해주세요.");
    
    // 담당 강사 ID 결정
    // 원장님이 선택했으면 그 사람, 아니면(강사가 생성 시) 본인 ID
    const finalInstructorId = selectedInstructorId || user!.uid;

    // [중요] 데이터 소유주(Owner) ID 결정
    // 내가 강사라면 -> 나의 원장님 ID (userData.ownerId)
    // 내가 원장이라면 -> 나의 ID (user.uid)
    const finalOwnerId = userData?.role === 'instructor' ? userData.ownerId : user!.uid;

    // 예외 처리: 강사인데 원장 정보가 없는 경우 (독립 강사 등) -> 본인을 Owner로
    const safeOwnerId = finalOwnerId || user!.uid;

    try {
      await addDoc(collection(db, "classes"), {
        instructorId: finalInstructorId, 
        ownerId: safeOwnerId, // 여기가 핵심입니다!
        name: newClassName,
        targetSchool: newClassTarget,
        studentCount: 0,
        createdAt: serverTimestamp(),
      });
      toast.success("새로운 반이 개설되었습니다.");
      
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

  // 강사 이름 찾기 헬퍼 (리스트에서 이름 표시용)
  const getInstructorName = (instId: string) => {
    if (instId === user?.uid) return "나"; // 본인
    const found = instructors.find(i => i.uid === instId);
    return found ? `${found.name} T` : "알 수 없음";
  };

  if (loading) return <div className="p-8 text-center">로딩 중...</div>;

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
            <p className="text-slate-500 mt-1">
              {userData?.role === 'director' ? '학원 전체의 반과 학생을 관리합니다.' : '수업 중인 반을 개설하고 학생을 관리하세요.'}
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
            <h3 className="font-bold text-slate-800 mb-4">새 클래스 정보 입력</h3>
            <div className="flex flex-col gap-4">
              
              {/* 원장님일 경우에만 강사 선택 가능 */}
              {userData?.role === 'director' && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500">담당 강사 배정</label>
                  <select
                    value={selectedInstructorId}
                    onChange={(e) => setSelectedInstructorId(e.target.value)}
                    className="p-3 border border-slate-200 rounded-xl outline-none bg-white focus:border-blue-500"
                  >
                    <option value={user?.uid}>본인 (원장 직강)</option>
                    {instructors.map(inst => (
                      <option key={inst.uid} value={inst.uid}>{inst.name} 선생님</option>
                    ))}
                  </select>
                </div>
              )}

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
                    
                    {/* 삭제 버튼: 내가 담당 강사이거나, 내가 원장(Owner)일 때만 보임 */}
                    {(user?.uid === cls.instructorId || user?.uid === cls.ownerId) && (
                      <button 
                        onClick={(e) => handleDeleteClass(e, cls.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{cls.name}</h3>
                  <p className="text-sm text-slate-500 mb-2">{cls.targetSchool || "학교 미지정"}</p>
                  
                  {/* 원장님 뷰에서는 담당 강사 표시 */}
                  {userData?.role === 'director' && (
                    <span className="inline-block px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded mb-4">
                      담당: {getInstructorName(cls.instructorId)}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-sm pt-4 border-t border-slate-50 mt-4">
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