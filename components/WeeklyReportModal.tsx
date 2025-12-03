// components/WeeklyReportModal.tsx

"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { XMarkIcon, UserIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

interface Props {
  classData: { id: string, name: string };
  onClose: () => void;
}

interface StudentFeedback {
  studentId: string;
  studentName: string;
  comment: string;
}

export default function WeeklyReportModal({ classData, onClose }: Props) {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentFeedback[]>([]);
  const [summary, setSummary] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 날짜 계산 (이번 주 월요일)
  const today = new Date();
  const day = today.getDay() || 7;
  if(day !== 1) today.setHours(-24 * (day - 1));
  const thisWeekMonday = today.toISOString().split('T')[0];

  useEffect(() => {
    const fetchStudents = async () => {
      const q = query(collection(db, "students"), where("classId", "==", classData.id));
      const snap = await getDocs(q);
      setStudents(snap.docs.map(doc => ({
        studentId: doc.id,
        studentName: doc.data().name,
        comment: "" // 초기값
      })));
    };
    fetchStudents();
  }, [classData.id]);

  const handleStudentCommentChange = (id: string, text: string) => {
    setStudents(prev => prev.map(s => s.studentId === id ? { ...s, comment: text } : s));
  };

  const handleSubmit = async () => {
    if (!summary.trim()) return toast.error("금주 총평을 입력해주세요.");
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "weekly_reports"), {
        classId: classData.id,
        className: classData.name,
        instructorId: user?.uid,
        weekStartDate: thisWeekMonday,
        status: 'published',
        summary,
        studentFeedbacks: students,
        createdAt: serverTimestamp()
      });
      toast.success("주간 리포트가 발행되었습니다.");
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("발행 실패");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">주간 리포트 작성 ({classData.name})</h2>
            <p className="text-sm text-slate-500 mt-1">기준일: {thisWeekMonday} (이번 주)</p>
          </div>
          <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-slate-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 총평 */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">금주 수업 총평</label>
            <textarea 
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full h-24 p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="이번 주 진도 내용, 전반적인 학습 태도, 과제 수행률 등을 요약해주세요."
            />
          </div>

          {/* 학생별 코멘트 */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">학생별 개별 피드백 ({students.length}명)</label>
            <div className="space-y-3">
              {students.map((student) => (
                <div key={student.studentId} className="flex gap-3 items-start bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 w-24 shrink-0 mt-1">
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-slate-400 border border-slate-200">
                      <UserIcon className="w-3 h-3" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 truncate">{student.studentName}</span>
                  </div>
                  <input 
                    type="text" 
                    value={student.comment}
                    onChange={(e) => handleStudentCommentChange(student.studentId, e.target.value)}
                    placeholder="특이사항이나 칭찬할 점을 적어주세요."
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-200 rounded-xl">취소</button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? "발행 중..." : "리포트 발행하기"}
          </button>
        </div>
      </div>
    </div>
  );
}