// components/DashboardActionCenter.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { 
  ClipboardDocumentCheckIcon, 
  ExclamationCircleIcon, 
  ClockIcon, 
  ChevronRightIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";
import { ActionItem } from "@/types/report";
import { useAuth } from "@/context/AuthContext";
import WeeklyReportModal from "./WeeklyReportModal";

// [신규] 로컬 시간 기준 '이번 주 월요일(YYYY-MM-DD)' 반환 함수
const getLocalMondayDate = () => {
  const d = new Date();
  const day = d.getDay() || 7; // 일요일(0)을 7로 변환
  if (day !== 1) d.setDate(d.getDate() - day + 1);
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${date}`;
};

export default function DashboardActionCenter() {
  const { user } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 주간 리포트 모달 상태
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedClassForReport, setSelectedClassForReport] = useState<{id: string, name: string} | null>(null);

  // 1. [정의] fetchTasks 함수를 useEffect보다 먼저 선언합니다.
  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const newTasks: ActionItem[] = [];

    try {
      // 1. 내가 담당하는 반 조회
      const classesQ = query(
        collection(db, "classes"), 
        where("instructorId", "==", user.uid)
      );
      const classesSnap = await getDocs(classesQ);
      const myClasses = classesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 2. 이번 주 월요일 날짜 계산
      const thisWeekMonday = getLocalMondayDate();

      // 3. 반별 리포트 미작성 확인
      for (const cls of myClasses) {
        const reportQ = query(
          collection(db, "weekly_reports"),
          where("classId", "==", cls.id),
          where("weekStartDate", "==", thisWeekMonday) // 로컬 날짜 문자열로 비교
        );
        const reportSnap = await getDocs(reportQ);

        // 리포트가 없으면 '작업 필요' 태스크 생성
        if (reportSnap.empty) {
          newTasks.push({
            id: `report-${cls.id}`,
            type: 'WEEKLY_REPORT',
            title: `[${(cls as any).name}] 주간 리포트 작성`,
            description: "이번 주 학습 내용과 학생 피드백을 정리해주세요.",
            priority: 'HIGH',
            relatedId: cls.id,
            isDone: false
          });
        }
      }

      // (추가적인 할 일 분석 로직이 있다면 여기에 추가)

    } catch (e) {
      console.error("할 일 분석 중 오류", e);
    }

    setTasks(newTasks);
    setLoading(false);
  }, [user]);

  // 2. [사용] useEffect에서 fetchTasks 호출
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // 액션 핸들러
  const handleAction = (task: ActionItem) => {
    if (task.type === 'WEEKLY_REPORT') {
      // 반 이름 파싱 (또는 task 데이터 구조 개선 시 직접 전달)
      const className = task.title.match(/\[(.*?)\]/)?.[1] || "반 정보 없음";
      setSelectedClassForReport({ id: task.relatedId!, name: className });
      setIsReportModalOpen(true);
    } else if (task.type === 'GRADE_ENTRY') {
      router.push(`/manage/reports?action=input&classId=${task.relatedId}`);
    }
  };

  // 리포트 작성 완료 시 호출될 핸들러
  const handleReportComplete = () => {
    setIsReportModalOpen(false);
    fetchTasks(); // 목록 새로고침
  };

  if (loading) return <div className="h-32 bg-slate-100 rounded-xl animate-pulse" />;

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <ClipboardDocumentCheckIcon className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800">Action Center</h3>
            <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
              {tasks.length}건의 할 일
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {tasks.length === 0 ? (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center">
              <CheckCircleIcon className="w-12 h-12 text-green-400 mb-2 opacity-50" />
              <p>모든 업무를 완료했습니다! 훌륭합니다. 🎉</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                <div className="flex items-start gap-3">
                  <div className={`mt-1 p-2 rounded-lg ${
                    task.priority === 'HIGH' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'
                  }`}>
                    {task.type === 'WEEKLY_REPORT' && <ClockIcon className="w-5 h-5" />}
                    {task.type === 'GRADE_ENTRY' && <ExclamationCircleIcon className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{task.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleAction(task)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-blue-600 hover:text-white hover:border-transparent transition-all shadow-sm flex items-center gap-1"
                >
                  바로가기 <ChevronRightIcon className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 주간 리포트 작성 모달 */}
      {isReportModalOpen && selectedClassForReport && (
        <WeeklyReportModal 
          classData={selectedClassForReport}
          onClose={() => setIsReportModalOpen(false)} 
          onComplete={handleReportComplete}
        />
      )}
    </>
  );
}