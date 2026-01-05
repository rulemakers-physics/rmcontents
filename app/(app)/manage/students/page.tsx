// app/(app)/manage/students/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, query, where, orderBy, getDocs, 
  addDoc, serverTimestamp, deleteDoc, doc, updateDoc, 
  arrayUnion, arrayRemove, increment 
} from "firebase/firestore";
import { 
  UserGroupIcon, PlusIcon, MagnifyingGlassIcon, 
  TrashIcon, PhoneIcon, AcademicCapIcon, XMarkIcon, 
  PencilSquareIcon, CheckIcon, FolderIcon, ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { StudentData, ClassData } from "@/types/academy";

export default function StudentManagementPage() {
  const { user, userData, loading } = useAuth();
  
  // 데이터 상태
  const [students, setStudents] = useState<StudentData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]); // [신규] 반 목록
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // 모달 상태 (생성/수정)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentData | null>(null);
  
  // 모달 상태 (반 배정)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [targetStudent, setTargetStudent] = useState<StudentData | null>(null);

  // 폼 데이터
  const [formData, setFormData] = useState({
    name: "",
    school: "",
    phone: "",
    parentPhone: ""
  });

  // 전화번호 포맷팅
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'phone' | 'parentPhone') => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, [field]: formatted }));
  };

  // 1. 초기 데이터 로드 (학생 + 반)
  const fetchData = async () => {
    if (!user || !userData) return;
    setIsLoading(true);

    try {
      const targetOwnerId = userData.role === 'director' ? user.uid : userData.ownerId;
      if (!targetOwnerId) return;

      // (1) 학생 목록
      const qStudents = query(
        collection(db, "students"),
        where("ownerId", "==", targetOwnerId),
        orderBy("joinedAt", "desc")
      );
      const snapStudents = await getDocs(qStudents);
      setStudents(snapStudents.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentData)));

      // (2) 반 목록 (배정용)
      const qClasses = query(
        collection(db, "classes"),
        where("ownerId", "==", targetOwnerId),
        orderBy("createdAt", "desc")
      );
      const snapClasses = await getDocs(qClasses);
      setClasses(snapClasses.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassData)));

    } catch (e) {
      console.error(e);
      toast.error("데이터 로딩 실패");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user, userData]);

  // 2. 학생 생성/수정 핸들러
  const handleSaveStudent = async () => {
    if (!formData.name.trim()) return toast.error("이름은 필수입니다.");
    const targetOwnerId = userData?.role === 'director' ? user?.uid : userData?.ownerId;
    if (!targetOwnerId) return;

    try {
      if (editingStudent) {
        await updateDoc(doc(db, "students", editingStudent.id), {
          name: formData.name,
          school: formData.school,
          phone: formData.phone,
          parentPhone: formData.parentPhone
        });
        toast.success("수정되었습니다.");
      } else {
        await addDoc(collection(db, "students"), {
          ownerId: targetOwnerId,
          name: formData.name,
          school: formData.school,
          phone: formData.phone,
          parentPhone: formData.parentPhone,
          enrolledClassIds: [], 
          joinedAt: serverTimestamp(),
        });
        toast.success("등록되었습니다.");
      }
      closeFormModal();
      fetchData();
    } catch (e) {
      toast.error("저장 실패");
    }
  };

  // 3. 학생 삭제
  const handleDeleteStudent = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까? (모든 반에서 탈퇴 처리됩니다)")) return;
    try {
      await deleteDoc(doc(db, "students", id));
      toast.success("삭제되었습니다.");
      fetchData();
    } catch (e) {
      toast.error("삭제 실패");
    }
  };

  // 4. [핵심] 반 배정/해제 핸들러
  const toggleClassAssignment = async (classId: string, isEnrolled: boolean) => {
    if (!targetStudent) return;

    try {
      // (1) Student 문서 업데이트
      await updateDoc(doc(db, "students", targetStudent.id), {
        enrolledClassIds: isEnrolled ? arrayRemove(classId) : arrayUnion(classId)
      });

      // (2) Class 문서 업데이트 (인원수)
      await updateDoc(doc(db, "classes", classId), {
        studentCount: increment(isEnrolled ? -1 : 1)
      });

      // (3) 로컬 상태 업데이트 (UX)
      setTargetStudent(prev => {
        if (!prev) return null;
        const currentIds = prev.enrolledClassIds || [];
        return {
          ...prev,
          enrolledClassIds: isEnrolled 
            ? currentIds.filter(id => id !== classId)
            : [...currentIds, classId]
        };
      });

      // 전체 리스트도 갱신
      setStudents(prev => prev.map(s => {
        if (s.id === targetStudent.id) {
          const currentIds = s.enrolledClassIds || [];
          return {
            ...s,
            enrolledClassIds: isEnrolled 
              ? currentIds.filter(id => id !== classId)
              : [...currentIds, classId]
          };
        }
        return s;
      }));

      toast.success(isEnrolled ? "배정 해제되었습니다." : "배정되었습니다.");

    } catch (e) {
      console.error(e);
      toast.error("처리 실패");
    }
  };


  // --- 모달 제어 ---
  const openCreateModal = () => {
    setEditingStudent(null);
    setFormData({ name: "", school: "", phone: "", parentPhone: "" });
    setIsFormModalOpen(true);
  };
  const openEditModal = (student: StudentData) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      school: student.school || "",
      phone: student.phone || "",
      parentPhone: student.parentPhone || ""
    });
    setIsFormModalOpen(true);
  };
  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingStudent(null);
  };
  const openAssignModal = (student: StudentData) => {
    setTargetStudent(student);
    setIsAssignModalOpen(true);
  };
  const closeAssignModal = () => {
    setIsAssignModalOpen(false);
    setTargetStudent(null);
  };

  const filteredStudents = students.filter(s => 
    s.name.includes(searchTerm) || (s.school && s.school.includes(searchTerm))
  );

  if (loading) return <div className="p-8 text-center">로딩 중...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <div className="max-w-6xl mx-auto">
        
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <UserGroupIcon className="w-8 h-8 text-blue-600" />
              원생 관리
            </h1>
            <p className="text-slate-500 mt-1">학원 전체 원생 명부를 관리하고 반을 배정합니다.</p>
          </div>
          <div className="flex gap-3">
             <div className="relative">
                <input 
                  type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="이름, 학교 검색" 
                  className="pl-9 pr-4 py-2.5 w-64 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                />
                <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
             </div>
             <button onClick={openCreateModal} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-lg active:scale-95">
               <PlusIcon className="w-5 h-5" /> 신규 원생 등록
             </button>
          </div>
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">이름 / 학교</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">연락처</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">수강중인 반</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr><td colSpan={4} className="py-20 text-center text-slate-400">등록된 원생이 없습니다.</td></tr>
              ) : filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{student.name}</span>
                      <span className="text-xs text-slate-500 block">{student.school || "학교 미기재"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600">{student.phone || "-"}</div>
                    <div className="text-xs text-slate-400">P: {student.parentPhone || "-"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {student.enrolledClassIds && student.enrolledClassIds.length > 0 ? (
                        student.enrolledClassIds.map(classId => {
                          const cls = classes.find(c => c.id === classId);
                          return cls ? (
                            <span key={classId} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded border border-blue-100">
                              {cls.name}
                            </span>
                          ) : null;
                        })
                      ) : (
                        <span className="text-xs text-slate-400">미배정</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openAssignModal(student)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">
                        <ArrowRightOnRectangleIcon className="w-3.5 h-3.5" /> 반 배정
                      </button>
                      <button onClick={() => openEditModal(student)} className="p-1.5 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-lg">
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteStudent(student.id)} className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-50 rounded-lg">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* --- 모달 1: 학생 정보 등록/수정 --- */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800">{editingStudent ? "원생 정보 수정" : "신규 원생 등록"}</h3>
                <button onClick={closeFormModal}><XMarkIcon className="w-6 h-6 text-slate-400" /></button>
              </div>
              <div className="p-6 space-y-4">
                 <div>
                   <label className="text-xs font-bold text-slate-500 mb-1 block">이름 <span className="text-red-500">*</span></label>
                   <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none" />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-slate-500 mb-1 block">학교</label>
                   <input type="text" value={formData.school} onChange={e => setFormData({...formData, school: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-1 block">학생 연락처</label>
                      <input type="text" value={formData.phone} onChange={e => handlePhoneChange(e, 'phone')} maxLength={13} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none" placeholder="010-0000-0000" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-1 block">부모님 연락처</label>
                      <input type="text" value={formData.parentPhone} onChange={e => handlePhoneChange(e, 'parentPhone')} maxLength={13} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none" placeholder="010-0000-0000" />
                    </div>
                 </div>
              </div>
              <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                 <button onClick={closeFormModal} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-lg">취소</button>
                 <button onClick={handleSaveStudent} className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">저장</button>
              </div>
           </div>
        </div>
      )}

      {/* --- 모달 2: 반 배정 관리 --- */}
      {isAssignModalOpen && targetStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
                <div>
                  <h3 className="font-bold text-indigo-900">반 배정 관리</h3>
                  <p className="text-xs text-indigo-700">{targetStudent.name} 학생</p>
                </div>
                <button onClick={closeAssignModal}><XMarkIcon className="w-6 h-6 text-indigo-400" /></button>
              </div>
              
              <div className="p-0 max-h-[60vh] overflow-y-auto">
                 {classes.length === 0 ? (
                   <p className="p-8 text-center text-slate-400 text-sm">개설된 반이 없습니다.</p>
                 ) : (
                   <div className="divide-y divide-slate-100">
                     {classes.map(cls => {
                       const isEnrolled = targetStudent.enrolledClassIds?.includes(cls.id);
                       return (
                         <div key={cls.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                           <div>
                             <div className="font-bold text-slate-800 text-sm">{cls.name}</div>
                             <div className="text-xs text-slate-500">{cls.schedule || "시간 미정"}</div>
                           </div>
                           <button 
                             onClick={() => toggleClassAssignment(cls.id, !!isEnrolled)}
                             className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                               isEnrolled 
                                 ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100" 
                                 : "bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
                             }`}
                           >
                             {isEnrolled ? "배정 해제" : "배정하기"}
                           </button>
                         </div>
                       );
                     })}
                   </div>
                 )}
              </div>
              
              <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
                 <button onClick={closeAssignModal} className="text-sm font-bold text-slate-500 hover:text-slate-800">닫기</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}