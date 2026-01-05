// components/ClassDetailModal.tsx

"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, query, where, orderBy, getDocs, 
  doc, updateDoc, increment, arrayRemove 
} from "firebase/firestore";
import { 
  XMarkIcon, TrashIcon, UserIcon, PhoneIcon,
  CalendarDaysIcon, ClipboardDocumentListIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { ClassData, StudentData } from "@/types/academy";
import StudentDetailModal from "./StudentDetailModal";
import ClassAttendance from "./ClassAttendance"; 
import ClassAssignments from "./ClassAssignments"; 

interface Props {
  classData: ClassData;
  onClose: () => void;
}

export default function ClassDetailModal({ classData, onClose }: Props) {
  // 상태 관리
  const [students, setStudents] = useState<StudentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [activeTab, setActiveTab] = useState<'students' | 'attendance' | 'assignments'>('students');

  // 반에 배정된 학생 목록 불러오기
  const fetchEnrolledStudents = async () => {
    setIsLoading(true);
    try {
      // enrolledClassIds 배열에 현재 classId가 포함된 학생만 조회
      const q = query(
        collection(db, "students"),
        where("enrolledClassIds", "array-contains", classData.id),
        orderBy("name")
      );
      const snap = await getDocs(q);
      setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentData)));
    } catch (e) {
      console.error(e);
      toast.error("학생 목록을 불러오지 못했습니다.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEnrolledStudents();
  }, [classData]);

  // 반에서 제외 (Unassign) - 데이터 삭제가 아님
  const handleRemoveStudent = async (e: React.MouseEvent, studentId: string) => {
    e.stopPropagation(); 
    if (!confirm("이 반에서 학생을 제외하시겠습니까? (원생 명부에는 유지됩니다)")) return;
    
    try {
      // 1. Student 문서 업데이트 (반 ID 제거)
      await updateDoc(doc(db, "students", studentId), {
        enrolledClassIds: arrayRemove(classData.id)
      });
      
      // 2. Class 문서 업데이트 (학생 수 감소)
      await updateDoc(doc(db, "classes", classData.id), {
        studentCount: increment(-1)
      });

      toast.success("반에서 제외되었습니다.");
      fetchEnrolledStudents(); // 목록 갱신
    } catch (e) {
      toast.error("제외 실패");
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col h-[85vh]">
          
          {/* 헤더 */}
          <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{classData.name}</h2>
              <p className="text-sm text-slate-500 mt-1">통합 관리 시스템</p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* 탭 메뉴 */}
          <div className="flex border-b border-slate-200 bg-white">
            <button 
              onClick={() => setActiveTab('students')}
              className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'students' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <UserIcon className="w-4 h-4" /> 수강생 목록
            </button>
            <button 
              onClick={() => setActiveTab('attendance')}
              className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'attendance' ? 'border-green-600 text-green-600 bg-green-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <CalendarDaysIcon className="w-4 h-4" /> 출석부
            </button>
            <button 
              onClick={() => setActiveTab('assignments')}
              className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'assignments' ? 'border-purple-600 text-purple-600 bg-purple-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <ClipboardDocumentListIcon className="w-4 h-4" /> 과제 관리
            </button>
          </div>

          {/* 탭 컨텐츠 영역 */}
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            
            {/* 1. 수강생 목록 탭 (검색/추가 기능 제거됨) */}
            {activeTab === 'students' && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <UserGroupIcon className="w-5 h-5 text-slate-500" />
                    수강생 목록 ({students.length}명)
                  </h4>
                  {/* 안내 문구 추가 */}
                  <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
                    * 학생 추가/배정은 '원생 관리' 메뉴에서 가능합니다.
                    <br/>
                    * 학생을 클릭하시면 상담 기록 및 성적 분석 리포트 확인이 가능합니다.
                  </span>
                </div>

                {students.length === 0 && !isLoading ? (
                  <div className="text-center py-20 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <UserIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>이 반에 배정된 학생이 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {students.map((student) => (
                      <div 
                        key={student.id} 
                        onClick={() => setSelectedStudent(student)} 
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
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pl-14 sm:pl-0">
                          <button 
                            onClick={(e) => handleRemoveStudent(e, student.id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="반에서 제외"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* 2. 출석부 탭 */}
            {activeTab === 'attendance' && (
              <ClassAttendance classId={classData.id} students={students} />
            )}

            {/* 3. 과제 관리 탭 */}
            {activeTab === 'assignments' && (
              <ClassAssignments classId={classData.id} students={students} />
            )}

          </div>
        </div>
      </div>

      {/* 학생 상세 모달 연결 */}
      {selectedStudent && (
        <StudentDetailModal 
          student={selectedStudent} 
          classId={classData.id}
          onClose={() => setSelectedStudent(null)}
          onUpdate={fetchEnrolledStudents}
        />
      )}
    </>
  );
}