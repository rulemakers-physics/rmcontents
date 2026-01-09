// components/WeeklyReportModal.tsx

"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { XMarkIcon, UserIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { AttendanceRecord, Assignment } from "@/types/academy";
import { ExamResultData } from "@/types/grade";

interface Props {
  classData: { id: string, name: string };
  onClose: () => void;
  onComplete?: () => void;
}

interface StudentFeedbackInput {
  studentId: string;
  studentName: string;
  comment: string;
  attendanceState: string;
  homeworkState: string;
  testScore: string;
}
// [신규] 날짜 계산 헬퍼 (DashboardActionCenter와 로직 통일)
const getLocalMondayDate = () => {
  const d = new Date();
  const day = d.getDay() || 7;
  if (day !== 1) d.setDate(d.getDate() - day + 1);
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${date}`;
};

export default function WeeklyReportModal({ classData, onClose, onComplete }: Props) {
  const { user } = useAuth();
  
  // 입력 상태
  const [summary, setSummary] = useState("");
  const [nextWeekPlan, setNextWeekPlan] = useState("");
  const [notice, setNotice] = useState("");
  const [students, setStudents] = useState<StudentFeedbackInput[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // 통계 상태
  const [classStats, setClassStats] = useState({
    attendanceRate: 0,
    homeworkRate: 0,
    testAverage: 0
  });

  // [수정] 기준일 계산 (로컬 시간 기준)
  const thisWeekMondayStr = getLocalMondayDate();
  
  // 데이터 조회를 위한 Date 객체 생성 (문자열 기준)
  const thisWeekMondayDate = new Date(thisWeekMondayStr);
  thisWeekMondayDate.setHours(0, 0, 0, 0);

  // 일요일 계산
  const thisWeekSundayDate = new Date(thisWeekMondayDate);
  thisWeekSundayDate.setDate(thisWeekMondayDate.getDate() + 6);
  thisWeekSundayDate.setHours(23, 59, 59, 999);
  const thisWeekSundayStr = thisWeekSundayDate.toISOString().split('T')[0]; // 범위 검색용이므로 ISO 유지해도 무방하나, 일관성을 위해 로컬 변환 권장

  // [핵심] 데이터 자동 수집 및 분석 로직
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        // 1. 학생 목록 조회
        // [수정 후] enrolledClassIds 배열에 포함 여부로 조회
        const studQ = query(
          collection(db, "students"), 
          where("enrolledClassIds", "array-contains", classData.id), 
          orderBy("name")
        );

        const studSnap = await getDocs(studQ);
        const studentList = studSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name }));

        if (studentList.length === 0) {
          setIsLoadingData(false);
          return;
        }

        // 2. 이번 주 출석 데이터 조회 (문서 ID가 날짜 형식이므로 문자열 비교 가능)
        const attQ = query(
            collection(db, "classes", classData.id, "attendance"),
            where("date", ">=", thisWeekMondayStr),
            where("date", "<=", thisWeekSundayStr)
        );
        const attSnap = await getDocs(attQ);
        
        // 학생별 출석 집계
        const attendanceMap: Record<string, { present: number, late: number, absent: number, total: number }> = {};
        let totalAttendanceCount = 0; // 반 전체 출석해야 할 횟수 (지각 포함)
        let actualAttendanceCount = 0; // 반 전체 실제 출석 횟수

        attSnap.docs.forEach(doc => {
            const data = doc.data();
            data.records.forEach((r: AttendanceRecord) => {
                if(!attendanceMap[r.studentId]) attendanceMap[r.studentId] = { present: 0, late: 0, absent: 0, total: 0 };
                
                attendanceMap[r.studentId].total++;
                if(r.status === 'present') {
                  attendanceMap[r.studentId].present++;
                  actualAttendanceCount++;
                } else if(r.status === 'late') {
                  attendanceMap[r.studentId].late++;
                  actualAttendanceCount++; // 지각도 출석으로 간주 (통계상)
                } else if(r.status === 'absent') {
                  attendanceMap[r.studentId].absent++;
                }
                
                if (r.status !== 'excused') totalAttendanceCount++; // 인정 결석 제외하고 모수 계산
            });
        });

        // 3. 이번 주 과제 데이터 조회 (마감일 기준)
        const assignQ = query(
          collection(db, "classes", classData.id, "assignments"),
          where("dueDate", ">=", thisWeekMondayStr),
          where("dueDate", "<=", thisWeekSundayStr)
        );
        const assignSnap = await getDocs(assignQ);
        
        const homeworkMap: Record<string, { completed: number, total: number }> = {};
        let totalHomeworkCount = 0;
        let completedHomeworkCount = 0;

        assignSnap.docs.forEach(doc => {
          const data = doc.data() as Assignment;
          data.records.forEach(r => {
            if (!homeworkMap[r.studentId]) homeworkMap[r.studentId] = { completed: 0, total: 0 };
            homeworkMap[r.studentId].total++;
            totalHomeworkCount++;
            
            if (r.status === 'completed') {
              homeworkMap[r.studentId].completed++;
              completedHomeworkCount++;
            }
          });
        });

        // 4. 이번 주 테스트 성적 조회 (Timestamp 비교)
        const testQ = query(
            collection(db, "exam_results"),
            where("classId", "==", classData.id),
            where("date", ">=", Timestamp.fromDate(thisWeekMondayDate)),
            where("date", "<=", Timestamp.fromDate(thisWeekSundayDate))
        );
        const testSnap = await getDocs(testQ);
        
        const scoreMap: Record<string, number[]> = {};
        let totalScoreSum = 0;
        let totalScoreCount = 0;

        testSnap.docs.forEach(doc => {
            const data = doc.data() as ExamResultData;
            data.scores.forEach(s => {
                if(!scoreMap[s.studentId]) scoreMap[s.studentId] = [];
                scoreMap[s.studentId].push(s.score);
                totalScoreSum += s.score;
                totalScoreCount++;
            });
        });

        // 5. 데이터 병합하여 학생별 피드백 상태 초기화
        const initialFeedbacks = studentList.map(s => {
            // 출석 상태 텍스트
            const att = attendanceMap[s.id];
            let attText = "기록 없음";
            if (att && att.total > 0) {
              const details = [];
              if (att.present > 0) details.push(`출석 ${att.present}`);
              if (att.late > 0) details.push(`지각 ${att.late}`);
              if (att.absent > 0) details.push(`결석 ${att.absent}`);
              attText = details.join(', ');
            }

            // 과제 상태 텍스트
            const hw = homeworkMap[s.id];
            let hwText = "과제 없음";
            if (hw && hw.total > 0) {
              const rate = Math.round((hw.completed / hw.total) * 100);
              hwText = `수행률 ${rate}% (${hw.completed}/${hw.total})`;
            }

            // 성적 상태 텍스트
            const scores = scoreMap[s.id] || [];
            let scoreText = "시험 없음";
            if (scores.length > 0) {
              const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
              scoreText = `평균 ${avg}점`;
            }
            
            return {
                studentId: s.id,
                studentName: s.name,
                comment: "", // 강사 직접 입력
                attendanceState: attText,
                homeworkState: hwText,
                testScore: scoreText
            };
        });

        setStudents(initialFeedbacks);

        // 6. 반 전체 통계 계산
        const classAttendanceRate = totalAttendanceCount > 0 
          ? Math.round((actualAttendanceCount / totalAttendanceCount) * 100) 
          : 0;
        
        const classHomeworkRate = totalHomeworkCount > 0 
          ? Math.round((completedHomeworkCount / totalHomeworkCount) * 100) 
          : 0;

        const classTestAverage = totalScoreCount > 0 
          ? Math.round(totalScoreSum / totalScoreCount) 
          : 0;

        setClassStats({
            attendanceRate: classAttendanceRate,
            homeworkRate: classHomeworkRate,
            testAverage: classTestAverage
        });

      } catch (e) {
        console.error("데이터 분석 실패", e);
        toast.error("데이터를 불러오는 중 오류가 발생했습니다.");
      }
      setIsLoadingData(false);
    };

    fetchData();
  }, [classData.id, thisWeekMondayStr, thisWeekSundayStr]);

  const handleStudentCommentChange = (id: string, text: string) => {
    setStudents(prev => prev.map(s => s.studentId === id ? { ...s, comment: text } : s));
  };

  const handleSubmit = async () => {
    if (!summary.trim()) return toast.error("수업 총평을 입력해주세요.");
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "weekly_reports"), {
        classId: classData.id,
        className: classData.name,
        instructorId: user?.uid,
        weekStartDate: thisWeekMondayStr,
        status: 'published',
        
        // 입력 데이터
        summary,
        nextWeekPlan,
        notice,
        
        // 자동 계산된 통계
        classStats,
        
        // 학생별 피드백
        studentFeedbacks: students,
        
        createdAt: serverTimestamp()
      });
      
      toast.success("리포트가 발행되었습니다!");
      if (onComplete) onComplete();
      else onClose();

    } catch (e) {
      console.error(e);
      toast.error("발행 실패");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-blue-500" />
              스마트 주간 리포트 작성
            </h2>
            <p className="text-sm text-slate-500 mt-1">{classData.name} | 기준일: {thisWeekMondayStr} ~ {thisWeekSundayStr}</p>
          </div>
          <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-slate-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50">
          
          {isLoadingData ? (
            <div className="flex flex-col items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 text-sm">출석, 과제, 성적 데이터를 분석 중입니다...</p>
            </div>
          ) : (
            <>
              {/* 1. 자동 집계된 반 통계 확인 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
                  <span className="text-xs text-slate-500 font-bold uppercase mb-1">출석률</span>
                  <span className="text-2xl font-black text-blue-600">{classStats.attendanceRate}%</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
                  <span className="text-xs text-slate-500 font-bold uppercase mb-1">과제 수행률</span>
                  <span className="text-2xl font-black text-green-600">{classStats.homeworkRate}%</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
                  <span className="text-xs text-slate-500 font-bold uppercase mb-1">평균 성적</span>
                  <span className="text-2xl font-black text-orange-600">{classStats.testAverage > 0 ? classStats.testAverage + '점' : '-'}</span>
                </div>
              </div>

              {/* 2. 공통 작성 영역 */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">수업 내용 및 공지</h3>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">금주 수업 내용 (Summary) <span className="text-red-500">*</span></label>
                  <textarea 
                    value={summary} onChange={(e) => setSummary(e.target.value)}
                    className="w-full h-24 p-3 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none resize-none"
                    placeholder="이번 주 진도 내용과 전반적인 학습 분위기를 요약해주세요."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">차주 수업 계획</label>
                    <textarea 
                      value={nextWeekPlan} onChange={(e) => setNextWeekPlan(e.target.value)}
                      className="w-full h-24 p-3 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none resize-none"
                      placeholder="다음 주 진도 및 과제 예정"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">알림장 (가정통신문)</label>
                    <textarea 
                      value={notice} onChange={(e) => setNotice(e.target.value)}
                      className="w-full h-24 p-3 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none resize-none"
                      placeholder="학부모님께 전달할 공지사항"
                    />
                  </div>
                </div>
              </div>

              {/* 3. 학생별 피드백 (자동 데이터 표시) */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 px-1">학생별 개별 피드백 ({students.length}명)</h3>
                
                {students.map((student) => (
                  <div key={student.studentId} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-xs">
                                {student.studentName[0]}
                            </div>
                            <span className="font-bold text-slate-900">{student.studentName}</span>
                        </div>
                        
                        {/* 자동 수집된 데이터 배지 */}
                        <div className="flex flex-wrap gap-2 text-[11px] font-medium">
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-100 whitespace-nowrap">
                              📅 {student.attendanceState}
                            </span>
                            <span className="px-2 py-1 bg-green-50 text-green-700 rounded border border-green-100 whitespace-nowrap">
                              📝 {student.homeworkState}
                            </span>
                            <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded border border-orange-100 whitespace-nowrap">
                              📊 {student.testScore}
                            </span>
                        </div>
                    </div>
                    
                    <input 
                      type="text" 
                      value={student.comment}
                      onChange={(e) => handleStudentCommentChange(student.studentId, e.target.value)}
                      placeholder={`${student.studentName} 학생에 대한 개별 코멘트 (학습 태도, 특이사항 등)`}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none transition-colors focus:bg-white"
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-white rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">취소</button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || isLoadingData}
            className="px-8 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {isSubmitting ? "발행 중..." : (
              <>
                <SparklesIcon className="w-4 h-4 text-yellow-400" /> 리포트 발행하기
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}