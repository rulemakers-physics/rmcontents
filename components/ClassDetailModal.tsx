// components/ClassDetailModal.tsx

"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, query, where, orderBy, getDocs, 
  addDoc, deleteDoc, doc, serverTimestamp, updateDoc, increment 
} from "firebase/firestore";
import { 
  XMarkIcon, UserPlusIcon, TrashIcon, UserIcon, PhoneIcon,
  PencilSquareIcon // 관리 아이콘 추가
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { ClassData, StudentData } from "@/types/academy";
import StudentDetailModal from "./StudentDetailModal"; // [신규] 임포트

interface Props {
  classData: ClassData;
  onClose: () => void;
}

export default function ClassDetailModal({ classData, onClose }: Props) {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // [신규] 학생 상세 모달 상태
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);

  // 학생 추가 폼 상태
  const [newName, setNewName] = useState("");
  const [newSchool, setNewSchool] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newParentPhone, setNewParentPhone] = useState("");

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const q = query(
        collection(db, "students"),
        where("classId", "==", classData.id),
        orderBy("name")
      );
      const snap = await getDocs(q);
      setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentData)));
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, [classData]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return toast.error("이름을 입력해주세요.");

    try {
      await addDoc(collection(db, "students"), {
        classId: classData.id,
        instructorId: classData.instructorId,
        name: newName,
        school: newSchool,
        phone: newPhone,
        parentPhone: newParentPhone,
        joinedAt: serverTimestamp(),
      });

      const classRef = doc(db, "classes", classData.id);
      await updateDoc(classRef, {
        studentCount: increment(1)
      });

      toast.success("학생이 등록되었습니다.");
      
      setNewName("");
      setNewSchool("");
      setNewPhone("");
      setNewParentPhone(""); 
      
      fetchStudents();
    } catch (e) {
      toast.error("등록 실패");
    }
  };

  const handleDeleteStudent = async (e: React.MouseEvent, studentId: string) => {
    e.stopPropagation(); // 카드 클릭 전파 방지
    if (!confirm("학생을 목록에서 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, "students", studentId));
      
      const classRef = doc(db, "classes", classData.id);
      await updateDoc(classRef, {
        studentCount: increment(-1)
      });

      toast.success("삭제되었습니다.");
      fetchStudents();
    } catch (e) {
      toast.error("삭제 실패");
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
          
          <div className="flex justify-between items-center p-6 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{classData.name}</h2>
              <p className="text-sm text-slate-500 mt-1">학생 명단 및 관리</p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
            
            {/* 학생 추가 폼 */}
            <form onSubmit={handleAddStudent} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
              <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">신규 학생 등록</h4>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                <div className="md:col-span-1 space-y-1">
                  <input type="text" placeholder="이름 (필수)" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none" />
                </div>
                <div className="md:col-span-1 space-y-1">
                  <input type="text" placeholder="학교" value={newSchool} onChange={(e) => setNewSchool(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none" />
                </div>
                <div className="md:col-span-1 space-y-1">
                  <input type="text" placeholder="학생 연락처" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none" />
                </div>
                <div className="md:col-span-1 space-y-1">
                  <input type="text" placeholder="학부모 연락처" value={newParentPhone} onChange={(e) => setNewParentPhone(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none bg-yellow-50/50 focus:bg-white" />
                </div>
                <div className="md:col-span-1">
                  <button type="submit" className="w-full h-[42px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-sm flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all">
                    <UserPlusIcon className="w-4 h-4" /> 등록
                  </button>
                </div>
              </div>
            </form>

            {/* 학생 목록 */}
            {students.length === 0 && !isLoading ? (
              <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                <UserIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>등록된 학생이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {students.map((student) => (
                  <div 
                    key={student.id} 
                    onClick={() => setSelectedStudent(student)} // [신규] 클릭 시 상세 모달 열기
                    className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group gap-3"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{student.name}</p>
                          {student.school && (
                            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-medium">
                              {student.school}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <div className="flex items-center gap-1">
                            <PhoneIcon className="w-3 h-3" /> {student.phone || "-"}
                          </div>
                          {student.parentPhone && (
                            <div className="flex items-center gap-1 text-orange-400">
                              <span className="font-bold bg-orange-50 px-1 rounded text-[10px]">P</span> {student.parentPhone}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-14 sm:pl-0">
                      {/* 상세 관리 버튼 (시각적 힌트) */}
                      <button className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                        상담/성적 관리
                      </button>
                      <button 
                        onClick={(e) => handleDeleteStudent(e, student.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="삭제"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* [신규] 학생 상세 모달 연결 */}
      {selectedStudent && (
        <StudentDetailModal 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
        />
      )}
    </>
  );
}