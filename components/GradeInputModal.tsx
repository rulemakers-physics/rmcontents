// components/GradeInputModal.tsx

"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, doc, getDoc } from "firebase/firestore";
import { XMarkIcon, UserIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { ClassData, StudentData } from "@/types/academy";
import { useAuth } from "@/context/AuthContext";

interface Props {
  classData: ClassData;
  preSelectedExamId?: string; // [신규] 외부에서 주입된 시험지 ID
  onClose: () => void;
}

interface SavedExamSimple {
  id: string;
  title: string;
  problemCount: number;
  createdAt: any;
}

export default function GradeInputModal({ classData, preSelectedExamId, onClose }: Props) {
  const { user } = useAuth();
  
  const [examTitle, setExamTitle] = useState("");
  const [selectedExamId, setSelectedExamId] = useState(preSelectedExamId || "");
  const [savedExams, setSavedExams] = useState<SavedExamSimple[]>([]);
  
  const [students, setStudents] = useState<StudentData[]>([]);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. 저장된 시험지 목록 불러오기
  useEffect(() => {
    if (!user) return;
    const fetchExams = async () => {
      const q = query(
        collection(db, "saved_exams"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setSavedExams(snap.docs.map(d => ({ id: d.id, ...d.data() } as SavedExamSimple)));
    };
    fetchExams();
  }, [user]);

  // 2. 시험지가 선택되면 제목 자동 입력
  useEffect(() => {
    if (selectedExamId) {
      const exam = savedExams.find(e => e.id === selectedExamId);
      if (exam) setExamTitle(exam.title);
      // 만약 preSelectedExamId로 들어왔는데 아직 리스트 로딩 전이라면?
      // -> 리스트 로딩 후 effect가 다시 돌면서 처리됨.
      // 단, 바로 들어온 경우를 위해 단건 조회 로직도 고려 가능하나, 여기선 리스트 매칭으로 처리.
    } else if (preSelectedExamId) {
       // 리스트에 없더라도(로딩 전) 초기값을 위해 단건 fetch 시도 가능 (생략)
    }
  }, [selectedExamId, savedExams, preSelectedExamId]);

  // 3. 학생 목록 로드
  useEffect(() => {
    const fetchStudents = async () => {
      const q = query(collection(db, "students"), where("classId", "==", classData.id));
      const snap = await getDocs(q);
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() } as StudentData)));
    };
    fetchStudents();
  }, [classData]);

  const handleSubmit = async () => {
    if (!examTitle) return toast.error("시험명을 입력해주세요.");
    
    setIsSubmitting(true);
    try {
      const scoreList = students.map(s => ({
        studentId: s.id,
        studentName: s.name,
        score: Number(scores[s.id] || 0),
        note: notes[s.id] || ""
      }));

      const totalScore = scoreList.reduce((sum, s) => sum + s.score, 0);
      const average = scoreList.length > 0 ? totalScore / scoreList.length : 0;
      const highest = Math.max(...scoreList.map(s => s.score));

      await addDoc(collection(db, "exam_results"), {
        classId: classData.id,
        className: classData.name,
        examId: selectedExamId || null, // [연동] 원본 시험지 ID 저장
        examTitle,
        date: serverTimestamp(),
        scores: scoreList,
        average,
        highest,
        totalStudents: scoreList.length
      });

      toast.success("성적이 저장되었습니다.");
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("저장 실패");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">성적 입력 ({classData.name})</h2>
          <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-slate-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* [신규] 시험지 연동 섹션 */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <label className="block text-xs font-bold text-blue-600 mb-2 flex items-center gap-1">
              <DocumentTextIcon className="w-4 h-4" /> 저장된 시험지 불러오기
            </label>
            <select 
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full p-2.5 border border-blue-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">(선택 안함 - 직접 입력)</option>
              {savedExams.map(exam => (
                <option key={exam.id} value={exam.id}>
                  {exam.title} ({exam.problemCount}문항) - {new Date(exam.createdAt.seconds * 1000).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">시험명</label>
            <input 
              type="text" 
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              placeholder="예: 3월 월례고사, 1학기 중간고사"
              className="w-full p-3 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700">학생별 점수 입력</label>
            {students.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">등록된 학생이 없습니다.</p>
            ) : (
              students.map(student => (
                <div key={student.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 w-32 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 border border-slate-200">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-slate-700 truncate">{student.name}</span>
                  </div>
                  
                  <input 
                    type="number" 
                    placeholder="점수"
                    value={scores[student.id] || ""}
                    onChange={(e) => setScores({...scores, [student.id]: e.target.value})}
                    className="w-20 p-2 text-center font-bold border border-slate-200 rounded-lg focus:border-blue-500 outline-none"
                  />
                  
                  <input 
                    type="text" 
                    placeholder="특이사항 (선택)"
                    value={notes[student.id] || ""}
                    onChange={(e) => setNotes({...notes, [student.id]: e.target.value})}
                    className="flex-1 p-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                  />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">취소</button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md"
          >
            {isSubmitting ? "저장 중..." : "저장 완료"}
          </button>
        </div>
      </div>
    </div>
  );
}