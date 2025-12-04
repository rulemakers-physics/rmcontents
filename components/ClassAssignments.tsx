// components/ClassAssignments.tsx

"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { StudentData, Assignment, AssignmentStatus } from "@/types/academy";
import { PlusIcon, ChevronDownIcon, CheckIcon } from "@heroicons/react/24/outline";

interface Props {
  classId: string;
  students: StudentData[];
}

export default function ClassAssignments({ classId, students }: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 새 과제 폼
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");

  // 과제 목록 불러오기
  const fetchAssignments = async () => {
    try {
      const q = query(collection(db, "classes", classId, "assignments"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Assignment));
      setAssignments(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [classId]);

  // 과제 생성
  const handleCreate = async () => {
    if (!newTitle || !newDate) return toast.error("제목과 마감일을 입력해주세요.");
    try {
      // 초기 상태는 모두 'incomplete'
      const initialRecords = students.map(s => ({
        studentId: s.id,
        studentName: s.name,
        status: 'incomplete' as AssignmentStatus
      }));

      await addDoc(collection(db, "classes", classId, "assignments"), {
        title: newTitle,
        dueDate: newDate,
        records: initialRecords,
        createdAt: serverTimestamp()
      });
      
      toast.success("과제가 등록되었습니다.");
      setIsCreating(false);
      setNewTitle("");
      setNewDate("");
      fetchAssignments();
    } catch (e) {
      toast.error("등록 실패");
    }
  };

  // 학생별 상태 업데이트 (DB에 바로 반영)
  const toggleStudentStatus = async (assignment: Assignment, studentId: string) => {
    const targetRecord = assignment.records.find(r => r.studentId === studentId);
    if (!targetRecord) return;

    // 상태 토글: incomplete -> completed -> late -> incomplete
    const nextStatus: Record<string, AssignmentStatus> = {
      'incomplete': 'completed',
      'completed': 'late',
      'late': 'incomplete'
    };
    const newStatus = nextStatus[targetRecord.status];

    const updatedRecords = assignment.records.map(r => 
      r.studentId === studentId ? { ...r, status: newStatus } : r
    );

    // 로컬 상태 즉시 반영 (UX)
    setAssignments(prev => prev.map(a => a.id === assignment.id ? { ...a, records: updatedRecords } : a));

    // DB 업데이트
    try {
      await updateDoc(doc(db, "classes", classId, "assignments", assignment.id), {
        records: updatedRecords
      });
    } catch (e) {
      console.error("업데이트 실패");
    }
  };

  return (
    <div className="space-y-6">
      {/* 과제 생성 버튼/폼 */}
      {!isCreating ? (
        <button 
          onClick={() => setIsCreating(true)}
          className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
        >
          <PlusIcon className="w-5 h-5" /> 새 과제 등록
        </button>
      ) : (
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2">
          <h4 className="text-sm font-bold text-blue-800 mb-3">새 과제 정보 입력</h4>
          <div className="flex gap-2 mb-3">
            <input 
              type="text" placeholder="과제명 (ex. 1단원 워크북)" 
              value={newTitle} onChange={e => setNewTitle(e.target.value)}
              className="flex-1 p-2 border border-blue-200 rounded-lg text-sm"
            />
            <input 
              type="date" 
              value={newDate} onChange={e => setNewDate(e.target.value)}
              className="w-32 p-2 border border-blue-200 rounded-lg text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsCreating(false)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-lg">취소</button>
            <button onClick={handleCreate} className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">등록하기</button>
          </div>
        </div>
      )}

      {/* 과제 리스트 */}
      <div className="space-y-3">
        {assignments.map(assignment => {
          const completedCount = assignment.records.filter(r => r.status === 'completed').length;
          const isExpanded = expandedId === assignment.id;

          return (
            <div key={assignment.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all">
              <div 
                onClick={() => setExpandedId(isExpanded ? null : assignment.id)}
                className={`p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 ${isExpanded ? 'bg-slate-50 border-b border-slate-100' : ''}`}
              >
                <div>
                  <h4 className="font-bold text-slate-800">{assignment.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">마감: {assignment.dueDate}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${completedCount === students.length ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    제출 {completedCount}/{students.length}
                  </span>
                  <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* 학생별 수행 체크 (아코디언) */}
              {isExpanded && (
                <div className="p-4 grid grid-cols-2 gap-2 bg-white">
                  {students.map(student => {
                    const record = assignment.records.find(r => r.studentId === student.id);
                    const status = record?.status || 'incomplete';
                    
                    return (
                      <button 
                        key={student.id}
                        onClick={() => toggleStudentStatus(assignment, student.id)}
                        className={`flex items-center justify-between p-2 rounded-lg border text-sm transition-all ${
                          status === 'completed' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                          status === 'late' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                          'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-bold">{student.name}</span>
                        <span className="text-[10px] font-bold uppercase">{status === 'completed' ? '완료' : status === 'late' ? '지각' : '미완'}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}