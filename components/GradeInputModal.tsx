// components/GradeInputModal.tsx

"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, query, where, getDocs, addDoc, serverTimestamp, 
  orderBy, doc, getDoc 
} from "firebase/firestore";
import { 
  XMarkIcon, UserIcon, DocumentTextIcon, CheckCircleIcon, XCircleIcon 
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { ClassData, StudentData } from "@/types/academy";
import { SavedExam } from "@/types/exam";
import { useAuth } from "@/context/AuthContext";
import { WrongProblemInfo } from "@/types/grade";

interface Props {
  classData: ClassData;
  preSelectedExamId?: string;
  onClose: () => void;
}

interface GradingState {
  score: number;
  results: Record<number, boolean>; // { 1: true, 2: false ... }
  isDetailed: boolean; // 상세 채점 모드 여부
}

export default function GradeInputModal({ classData, preSelectedExamId, onClose }: Props) {
  const { user } = useAuth();
  
  const [examTitle, setExamTitle] = useState("");
  const [selectedExamId, setSelectedExamId] = useState(preSelectedExamId || "");
  
  // 전체 시험지 목록 (드롭다운용)
  const [savedExams, setSavedExams] = useState<{id: string, title: string}[]>([]);
  // 선택된 시험지의 상세 데이터 (문항 정보 포함)
  const [targetExam, setTargetExam] = useState<SavedExam | null>(null);
  
  const [students, setStudents] = useState<StudentData[]>([]);
  
  // 학생별 채점 데이터 상태
  const [gradingMap, setGradingMap] = useState<Record<string, GradingState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. 시험지 목록 로드
  useEffect(() => {
    if (!user) return;
    const fetchExams = async () => {
      const q = query(
        collection(db, "saved_exams"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setSavedExams(snap.docs.map(d => ({ id: d.id, title: d.data().title })));
    };
    fetchExams();
  }, [user]);

  // 2. 시험지 선택 시 상세 데이터 로드 & 제목 설정
  useEffect(() => {
    const loadTargetExam = async () => {
      if (!selectedExamId) {
        setTargetExam(null);
        return;
      }
      
      try {
        const docRef = doc(db, "saved_exams", selectedExamId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as SavedExam;
          setTargetExam({ ...data, id: snap.id });
          setExamTitle(data.title);
        }
      } catch (e) {
        console.error("시험지 로드 실패", e);
      }
    };
    loadTargetExam();
  }, [selectedExamId]);

  // 3. 학생 목록 로드 & 초기 상태 설정
  useEffect(() => {
    const fetchStudents = async () => {
      const q = query(
        collection(db, "students"), 
        where("enrolledClassIds", "array-contains", classData.id), 
        orderBy("name")
      );

      const snap = await getDocs(q);
      const studentList = snap.docs.map(d => ({ id: d.id, ...d.data() } as StudentData));
      setStudents(studentList);
      
      // 초기 상태 세팅
      const initialMap: Record<string, GradingState> = {};
      studentList.forEach(s => {
        initialMap[s.id] = { score: 0, results: {}, isDetailed: false };
      });
      setGradingMap(initialMap);
    };
    fetchStudents();
  }, [classData]);

  // O/X 토글 핸들러
  const toggleResult = (studentId: string, qNum: number) => {
    if (!targetExam) return;

    setGradingMap(prev => {
      const current = prev[studentId];
      const newResults = { ...current.results, [qNum]: !current.results[qNum] }; // 토글
      
      // 점수 자동 재계산 (균등 배점 가정: 100점 만점)
      const correctCount = Object.values(newResults).filter(Boolean).length;
      const newScore = Math.round((correctCount / targetExam.problems.length) * 100);

      return {
        ...prev,
        [studentId]: {
          ...current,
          results: newResults,
          score: newScore,
          isDetailed: true
        }
      };
    });
  };

  // [수정] 점수 직접 입력 핸들러 (0~100 범위 제한 적용)
  const handleScoreChange = (studentId: string, val: string) => {
    let numVal = Number(val);

    // 유효성 검사 및 클램핑
    if (isNaN(numVal)) numVal = 0;
    if (numVal < 0) numVal = 0;
    if (numVal > 100) numVal = 100;

    setGradingMap(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], score: numVal, isDetailed: false }
    }));
  };

  const handleSubmit = async () => {
    if (!examTitle) return toast.error("시험명을 입력해주세요.");
    
    setIsSubmitting(true);
    try {
      const scoreList = students.map(s => {
        const data = gradingMap[s.id];
        
        // [수정] WrongProblemInfo[] 타입 사용
        let wrongProblems: WrongProblemInfo[] = [];
        
        if (data.isDetailed && targetExam) {
           targetExam.problems.forEach(p => {
             if (!data.results[p.number]) {
               // [수정] ID와 번호를 함께 저장
               wrongProblems.push({ id: p.id, number: p.number });
             }
           });
        }

        return {
          studentId: s.id,
          studentName: s.name,
          score: data.score,
          results: data.isDetailed ? data.results : null,
          // [수정] 필드명 변경 (wrongProblemIds -> wrongProblems)
          wrongProblems: data.isDetailed ? wrongProblems : [],
          note: ""
        };
      });

      const totalScore = scoreList.reduce((sum, s) => sum + s.score, 0);
      const average = scoreList.length > 0 ? totalScore / scoreList.length : 0;
      const highest = Math.max(...scoreList.map(s => s.score));

      await addDoc(collection(db, "exam_results"), {
        classId: classData.id,
        className: classData.name,
        examId: selectedExamId || null,
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
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* 헤더 */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">성적 입력 ({classData.name})</h2>
          <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-slate-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* 시험지 선택 */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col md:flex-row gap-4 items-center">
            <div className="w-full md:w-1/2">
              <label className="block text-xs font-bold text-blue-600 mb-2 flex items-center gap-1">
                <DocumentTextIcon className="w-4 h-4" /> 저장된 시험지 불러오기 (상세 채점용)
              </label>
              <select 
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full p-2.5 border border-blue-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">(선택 안함 - 점수만 입력)</option>
                {savedExams.map(exam => (
                  <option key={exam.id} value={exam.id}>{exam.title}</option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-1/2">
               <label className="block text-xs font-bold text-slate-500 mb-2">시험명 (성적표 표시용)</label>
               <input 
                 type="text" value={examTitle} onChange={(e) => setExamTitle(e.target.value)}
                 className="w-full p-2.5 border border-slate-300 rounded-lg text-sm font-bold"
               />
            </div>
          </div>

          {/* 학생별 채점 리스트 */}
          <div className="space-y-4">
            {students.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">등록된 학생이 없습니다.</p>
            ) : (
              students.map(student => {
                const data = gradingMap[student.id];
                
                return (
                  <div key={student.id} className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      {/* 학생 정보 & 점수 */}
                      <div className="flex items-center gap-4 w-48 shrink-0">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm">
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block">{student.name}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">점수:</span>
                            <input 
                              type="number" 
                              value={data?.score || 0}
                              onChange={(e) => handleScoreChange(student.id, e.target.value)}
                              className="w-16 p-1 text-center font-bold border border-slate-300 rounded text-sm focus:border-blue-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 상세 채점 (O/X 버튼) */}
                      {targetExam ? (
                        <div className="flex-1 overflow-x-auto pb-2 md:pb-0">
                          <div className="flex gap-1">
                            {targetExam.problems.map((p, idx) => {
                              const isCorrect = data?.results[p.number]; // true, false, or undefined
                              return (
                                <button
                                  key={p.id}
                                  onClick={() => toggleResult(student.id, p.number)}
                                  className={`
                                    w-8 h-8 rounded text-xs font-bold flex items-center justify-center border transition-all
                                    ${isCorrect === true 
                                      ? 'bg-green-500 text-white border-green-600' 
                                      : isCorrect === false 
                                        ? 'bg-red-100 text-red-400 border-red-200'
                                        : 'bg-white text-slate-400 border-slate-300 hover:bg-slate-100'
                                    }
                                  `}
                                  title={`${p.number}번 채점`}
                                >
                                  {isCorrect === true ? <CheckCircleIcon className="w-5 h-5"/> : isCorrect === false ? <XMarkIcon className="w-5 h-5"/> : p.number}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 text-xs text-slate-400 italic">
                          * 상세 채점을 하려면 시험지를 선택하세요.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-2 bg-white rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">취소</button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? "저장 중..." : "성적 저장 완료"}
          </button>
        </div>
      </div>
    </div>
  );
}