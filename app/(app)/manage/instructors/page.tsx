"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, query, where, getDocs, setDoc, doc, deleteDoc, serverTimestamp, updateDoc, orderBy 
} from "firebase/firestore";
import { 
  UserPlusIcon, TrashIcon, IdentificationIcon, EnvelopeIcon, 
  AcademicCapIcon, XMarkIcon, CheckCircleIcon 
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { UserData } from "@/types/user";
import { ClassData } from "@/types/academy";

export default function InstructorManagePage() {
  const { user, userData } = useAuth();
  
  const [instructors, setInstructors] = useState<UserData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]); // [신규] 반 목록 상태
  
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // [신규] 반 배정 모달 상태
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [targetInstructor, setTargetInstructor] = useState<UserData | null>(null);

  // 1. 데이터 로드 (강사 + 반)
  const fetchData = async () => {
    if (!user) return;
    
    try {
      // 강사 목록
      const qInst = query(collection(db, "users"), where("ownerId", "==", user.uid));
      const snapInst = await getDocs(qInst);
      setInstructors(snapInst.docs.map(d => d.data() as UserData));

      // 반 목록 (원장 소유 전체)
      const qClass = query(
        collection(db, "classes"), 
        where("ownerId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snapClass = await getDocs(qClass);
      setClasses(snapClass.docs.map(d => ({ id: d.id, ...d.data() } as ClassData)));

    } catch (e) {
      console.error(e);
      toast.error("데이터 로딩 실패");
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // 강사 초대 핸들러
  const handleInvite = async () => {
    if (!newEmail || !newName) return toast.error("이름과 이메일을 입력해주세요.");
    if (!user || !userData) return;

    const directorPlan = userData.plan || "FREE";
    setIsAdding(true);

    try {
      const q = query(collection(db, "users"), where("email", "==", newEmail));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingUserDoc = querySnapshot.docs[0];
        if (confirm("이미 가입된 회원입니다. 우리 학원 강사로 등록하시겠습니까?\n(원장님의 요금제가 적용됩니다)")) {
          await updateDoc(doc(db, "users", existingUserDoc.id), {
            ownerId: user.uid,
            plan: directorPlan,
            academy: userData.academy
          });
          toast.success("기존 회원을 강사로 등록했습니다.");
          setNewEmail("");
          setNewName("");
          fetchData();
        }
      } else {
        const tempUid = `invited_${Date.now()}`; 
        await setDoc(doc(db, "users", tempUid), {
          uid: tempUid,
          email: newEmail,
          name: newName,
          role: "instructor",
          ownerId: user.uid,
          academy: userData.academy,
          plan: directorPlan,
          coins: 0,
          createdAt: serverTimestamp(),
          isInvited: true
        });
        toast.success("강사가 등록되었습니다.");
        setNewEmail("");
        setNewName("");
        fetchData();
      }
    } catch (e) {
      console.error(e);
      toast.error("등록 실패");
    }
    setIsAdding(false);
  };

  const handleDelete = async (targetUid: string) => {
    if (!confirm("해당 강사를 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, "users", targetUid));
      toast.success("삭제되었습니다.");
      fetchData();
    } catch (e) {
      toast.error("삭제 실패");
    }
  };

  // 권한 변경 핸들러
  const handlePermissionChange = async (instId: string, type: 'manage_all' | 'assigned_only') => {
    try {
      await updateDoc(doc(db, "users", instId), {
        "permissions.studentManagement": type
      });
      toast.success("권한이 변경되었습니다.");
      fetchData();
    } catch(e) {
      toast.error("권한 변경 실패");
    }
  };

  // [신규] 반 배정/해제 핸들러
  const toggleClassAssignment = async (classId: string, isAssigning: boolean) => {
    if (!targetInstructor || !user) return;

    try {
      // isAssigning=true : 강사에게 배정 (instructorId = 강사ID)
      // isAssigning=false: 배정 해제 (instructorId = 원장ID로 회수)
      const newInstructorId = isAssigning ? targetInstructor.uid : user.uid;
      
      await updateDoc(doc(db, "classes", classId), {
        instructorId: newInstructorId
      });

      // 로컬 상태 즉시 업데이트 (UI 반응성)
      setClasses(prev => prev.map(c => 
        c.id === classId ? { ...c, instructorId: newInstructorId } : c
      ));

      toast.success(isAssigning ? "반이 배정되었습니다." : "배정이 해제되었습니다.");
    } catch (e) {
      console.error(e);
      toast.error("처리 실패");
    }
  };

  // 모달 열기
  const openClassModal = (inst: UserData) => {
    setTargetInstructor(inst);
    setIsClassModalOpen(true);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <IdentificationIcon className="w-8 h-8 text-blue-600" />
            강사 관리
          </h1>
          <p className="text-slate-500 mt-1">우리 학원의 강사진을 등록하고 담당 반을 배정합니다.</p>
        </div>
      </div>

      {/* 강사 등록 폼 */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
        <h3 className="font-bold text-slate-800 mb-4">신규 강사 등록</h3>
        <div className="flex flex-col md:flex-row gap-4 md:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-bold text-slate-500">강사명</label>
            <input 
              type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl" placeholder="이름 입력"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs font-bold text-slate-500">구글 이메일</label>
            <input 
              type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl" placeholder="example@gmail.com"
            />
          </div>
          <button 
            onClick={handleInvite} disabled={isAdding}
            className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 flex items-center justify-center gap-2"
          >
            <UserPlusIcon className="w-5 h-5" /> 등록하기
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          * 등록된 강사는 <strong>{userData?.plan} Plan</strong> 혜택을 자동으로 공유받습니다.
        </p>
      </div>

      {/* 강사 리스트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {instructors.map((inst) => (
          // [수정] 레이아웃 변경: flex-row -> flex-col 구조로 변경하여 공간 확보
          <div key={inst.uid} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            
            {/* 상단: 기본 정보 & 삭제 버튼 */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                  {inst.name[0]}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-lg">{inst.name} T</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                    <EnvelopeIcon className="w-3 h-3" /> {inst.email}
                  </p>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold">
                    {inst.plan} Plan
                  </span>
                </div>
              </div>
              <button onClick={() => handleDelete(inst.uid)} className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors">
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>

            {/* 하단: 권한 설정 및 반 배정 (넓은 공간 사용) */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              
              {/* [수정] 학생 관리 권한 (아래로 이동됨) */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">학생 관리 권한</label>
                <select 
                  value={inst.permissions?.studentManagement || 'assigned_only'}
                  onChange={(e) => handlePermissionChange(inst.uid, e.target.value as any)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none"
                >
                  <option value="assigned_only">배정된 학생만 관리</option>
                  <option value="manage_all">전체 학생 명부 접근</option>
                </select>
              </div>

              {/* [신규] 반 배정 버튼 */}
              <button 
                onClick={() => openClassModal(inst)}
                className="w-full py-2.5 bg-indigo-50 text-indigo-700 text-sm font-bold rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
              >
                <AcademicCapIcon className="w-4 h-4" /> 
                담당 반 관리 ({classes.filter(c => c.instructorId === inst.uid).length}개)
              </button>
            </div>
          </div>
        ))}
        
        {instructors.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400 border-2 border-dashed border-slate-300 rounded-2xl">
            등록된 강사가 없습니다.
          </div>
        )}
      </div>

      {/* [신규] 반 배정 모달 */}
      {isClassModalOpen && targetInstructor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[80vh] flex flex-col">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
              <div>
                <h3 className="font-bold text-indigo-900">담당 반 배정</h3>
                <p className="text-xs text-indigo-700">{targetInstructor.name} 선생님</p>
              </div>
              <button onClick={() => setIsClassModalOpen(false)} className="p-1 hover:bg-indigo-100 rounded-full text-indigo-400">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-0">
              {classes.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  개설된 반이 없습니다.<br/>'반 관리' 메뉴에서 먼저 반을 만들어주세요.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {classes.map(cls => {
                    const isAssigned = cls.instructorId === targetInstructor.uid;
                    // 다른 강사에게 배정된 경우 (원장 본인도 포함)
                    const isOtherAssigned = !isAssigned && cls.instructorId !== user?.uid; 

                    return (
                      <div key={cls.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{cls.name}</div>
                          <div className="text-xs text-slate-500">
                            {cls.targetSchool || "학교 미지정"} 
                            {isOtherAssigned && <span className="text-red-400 ml-1">(타 강사 배정됨)</span>}
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => toggleClassAssignment(cls.id, !isAssigned)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            isAssigned 
                              ? "bg-green-50 text-green-600 border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 group" 
                              : "bg-white text-slate-400 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                          }`}
                        >
                          {isAssigned ? (
                            <>
                              <CheckCircleIcon className="w-4 h-4 group-hover:hidden" />
                              <span className="group-hover:hidden">배정됨</span>
                              <span className="hidden group-hover:inline">해제</span>
                            </>
                          ) : (
                            "선택"
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
               <button onClick={() => setIsClassModalOpen(false)} className="text-sm font-bold text-slate-500 hover:text-slate-800">
                 닫기
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}