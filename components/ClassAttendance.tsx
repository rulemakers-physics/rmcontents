// components/ClassAttendance.tsx

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, getDocs, collection, query, orderBy, where } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { StudentData, AttendanceRecord, AttendanceStatus, DailyAttendance } from "@/types/academy";
import { 
  CheckCircleIcon, XCircleIcon, ClockIcon, NoSymbolIcon, 
  CalendarDaysIcon, ArrowPathIcon, TableCellsIcon, ChartBarIcon,
  ChevronLeftIcon, ChevronRightIcon
} from "@heroicons/react/24/outline";

interface Props {
  classId: string;
  students: StudentData[];
}

// 탭 정의
type TabType = 'daily' | 'history';

export default function ClassAttendance({ classId, students }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('daily');

  // ==========================================
  // [Tab 1] 일별 출석 입력 상태 & 로직
  // ==========================================
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({});
  const [isDailyLoading, setIsDailyLoading] = useState(false);

  // 날짜 변경 시 해당 날짜 데이터 불러오기
  useEffect(() => {
    if (activeTab !== 'daily') return;

    const fetchAttendance = async () => {
      setIsDailyLoading(true);
      try {
        const docRef = doc(db, "classes", classId, "attendance", selectedDate);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const loadedRecords: Record<string, AttendanceStatus> = {};
          data.records.forEach((r: AttendanceRecord) => {
            loadedRecords[r.studentId] = r.status;
          });
          setRecords(loadedRecords);
        } else {
          // 데이터가 없으면 초기화 (기본값: 모두 출석)
          const initial: Record<string, AttendanceStatus> = {};
          students.forEach(s => initial[s.id] = 'present');
          setRecords(initial);
        }
      } catch (e) {
        console.error(e);
        toast.error("데이터 로딩 실패");
      }
      setIsDailyLoading(false);
    };
    
    if (students.length > 0) fetchAttendance();
  }, [classId, selectedDate, students, activeTab]);

  const handleSaveDaily = async () => {
    try {
      const attendanceList: AttendanceRecord[] = students.map(s => ({
        studentId: s.id,
        studentName: s.name,
        status: records[s.id] || 'present'
      }));

      await setDoc(doc(db, "classes", classId, "attendance", selectedDate), {
        date: selectedDate,
        records: attendanceList
      });
      toast.success("저장되었습니다.");
    } catch (e) {
      toast.error("저장 실패");
    }
  };

  const toggleStatus = (studentId: string, status: AttendanceStatus) => {
    setRecords(prev => ({ ...prev, [studentId]: status }));
  };

  // ==========================================
  // [Tab 2] 월별 누적 히스토리 상태 & 로직
  // ==========================================
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [history, setHistory] = useState<DailyAttendance[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const fetchHistoryByMonth = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      // 해당 월의 1일 ~ 말일 범위 쿼리 (문자열 비교로 가능)
      const startStr = `${currentMonth}-01`;
      const endStr = `${currentMonth}-31`;

      const q = query(
        collection(db, "classes", classId, "attendance"),
        where("date", ">=", startStr),
        where("date", "<=", endStr),
        orderBy("date", "asc") // 날짜 오름차순 (1일 -> 31일)
      );
      
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyAttendance));
      setHistory(list);
    } catch (e) {
      console.error("히스토리 로딩 실패", e);
    }
    setIsHistoryLoading(false);
  }, [classId, currentMonth]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistoryByMonth();
    }
  }, [activeTab, fetchHistoryByMonth]);

  // 간단한 통계 계산 (현재 조회된 월 기준)
  const stats = useMemo(() => {
    const result: Record<string, { present: number, late: number, absent: number }> = {};
    students.forEach(s => {
      result[s.id] = { present: 0, late: 0, absent: 0 };
    });

    history.forEach(day => {
      day.records.forEach(r => {
        if (result[r.studentId]) {
          if (r.status === 'present') result[r.studentId].present++;
          else if (r.status === 'late') result[r.studentId].late++;
          else if (r.status === 'absent') result[r.studentId].absent++;
        }
      });
    });
    return result;
  }, [history, students]);

  // ==========================================
  // 공통 헬퍼
  // ==========================================
  const renderStatusIcon = (status?: AttendanceStatus, size = "w-5 h-5") => {
    switch (status) {
      case 'present': return <CheckCircleIcon className={`${size} text-green-500 mx-auto`} title="출석" />;
      case 'late': return <ClockIcon className={`${size} text-yellow-500 mx-auto`} title="지각" />;
      case 'absent': return <XCircleIcon className={`${size} text-red-500 mx-auto`} title="결석" />;
      case 'excused': return <NoSymbolIcon className={`${size} text-slate-400 mx-auto`} title="인정" />;
      default: return <span className="text-slate-300">-</span>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* --- 탭 헤더 --- */}
      <div className="flex border-b border-slate-200 bg-slate-50">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-colors border-b-2 ${
            activeTab === 'daily' 
              ? 'border-blue-600 text-blue-600 bg-white' 
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <CalendarDaysIcon className="w-5 h-5" />
          일별 출석체크
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-colors border-b-2 ${
            activeTab === 'history' 
              ? 'border-blue-600 text-blue-600 bg-white' 
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <TableCellsIcon className="w-5 h-5" />
          월별 출석부
        </button>
      </div>

      {/* --- 컨텐츠 영역 --- */}
      <div className="flex-1 overflow-hidden p-6 relative">
        
        {/* [VIEW 1] 일별 출석 입력 */}
        {activeTab === 'daily' && (
          <div className="h-full flex flex-col max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* 날짜 컨트롤러 */}
            <div className="flex justify-between items-center mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setDate(d.getDate() - 1);
                    setSelectedDate(d.toISOString().split('T')[0]);
                  }}
                  className="p-1 hover:bg-white hover:shadow-sm rounded-full transition-all"
                >
                  <ChevronLeftIcon className="w-5 h-5 text-slate-500" />
                </button>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-lg font-bold text-slate-900 text-center outline-none cursor-pointer"
                />
                <button 
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setDate(d.getDate() + 1);
                    setSelectedDate(d.toISOString().split('T')[0]);
                  }}
                  className="p-1 hover:bg-white hover:shadow-sm rounded-full transition-all"
                >
                  <ChevronRightIcon className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <button 
                onClick={handleSaveDaily}
                disabled={isDailyLoading}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-md active:scale-95 disabled:opacity-50"
              >
                {isDailyLoading ? '로딩중...' : '저장하기'}
              </button>
            </div>

            {/* 학생 리스트 */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
              {students.map(student => (
                <div key={student.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all">
                  <span className="font-bold text-slate-700 text-lg">{student.name}</span>
                  
                  <div className="flex gap-2">
                    {[
                      { val: 'present', label: '출석', icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
                      { val: 'late', label: '지각', icon: ClockIcon, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
                      { val: 'absent', label: '결석', icon: XCircleIcon, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
                      { val: 'excused', label: '인정', icon: NoSymbolIcon, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() => toggleStatus(student.id, opt.val as AttendanceStatus)}
                        className={`group flex flex-col items-center justify-center w-14 h-12 rounded-lg border transition-all duration-200 ${
                          records[student.id] === opt.val 
                            ? `${opt.bg} ${opt.color} ${opt.border} ring-1 ring-offset-1 ring-${opt.color.split('-')[1]}-200 shadow-sm` 
                            : 'bg-white border-slate-100 text-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <opt.icon className={`w-6 h-6 mb-0.5 transition-transform ${records[student.id] === opt.val ? 'scale-110' : 'group-hover:scale-110'}`} />
                        <span className="text-[10px] font-bold">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {students.length === 0 && <p className="text-center text-slate-400 py-10">등록된 학생이 없습니다.</p>}
            </div>
          </div>
        )}

        {/* [VIEW 2] 월별 누적 히스토리 */}
        {activeTab === 'history' && (
          <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* 상단 툴바: 월 선택 & 새로고침 */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <input 
                  type="month"
                  value={currentMonth}
                  onChange={(e) => setCurrentMonth(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-500 ml-2">
                  총 수업일: <span className="font-bold text-blue-600">{history.length}일</span>
                </span>
              </div>
              <button 
                onClick={fetchHistoryByMonth} 
                className="flex items-center gap-1 px-3 py-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
              >
                <ArrowPathIcon className={`w-4 h-4 ${isHistoryLoading ? 'animate-spin' : ''}`} />
                새로고침
              </button>
            </div>

            {/* 테이블 영역 */}
            <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden bg-white relative flex flex-col">
              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-sm text-left border-collapse whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 z-20 shadow-sm">
                    <tr>
                      <th className="p-3 border-b border-r border-slate-200 sticky left-0 bg-slate-50 z-30 min-w-[100px] text-center">이름</th>
                      {/* 통계 헤더 (고정) */}
                      <th className="p-3 border-b border-r border-slate-200 sticky left-[100px] bg-slate-50 z-30 min-w-[60px] text-center text-xs text-blue-600">출석률</th>
                      <th className="p-3 border-b border-r border-slate-200 sticky left-[160px] bg-slate-50 z-30 min-w-[50px] text-center text-xs text-red-500">결/지</th>
                      
                      {/* 날짜 헤더 */}
                      {history.map(day => (
                        <th key={day.id} className="p-2 border-b border-slate-200 text-center min-w-[50px]">
                          <div className="text-xs text-slate-400">{day.date.substring(5, 7)}/</div>
                          <div className="text-sm text-slate-700">{day.date.substring(8)}</div>
                        </th>
                      ))}
                      {history.length === 0 && <th className="p-4 w-full text-center font-normal text-slate-400">데이터 없음</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => {
                      const sStat = stats[student.id];
                      const totalClass = history.length || 1; 
                      // 출석률 계산 (인정결석도 분모에 포함할지 여부는 정책에 따름, 여기선 단순 계산)
                      const rate = Math.round((sStat.present / totalClass) * 100);
                      
                      return (
                        <tr key={student.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 group">
                          {/* 이름 */}
                          <td className="p-3 border-r border-slate-200 font-bold text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50 z-10 text-center">
                            {student.name}
                          </td>
                          {/* 통계: 출석률 */}
                          <td className="p-2 border-r border-slate-200 sticky left-[100px] bg-white group-hover:bg-slate-50 z-10 text-center font-bold text-slate-600">
                             {history.length > 0 ? `${rate}%` : '-'}
                          </td>
                          {/* 통계: 결석+지각 수 */}
                          <td className="p-2 border-r border-slate-200 sticky left-[160px] bg-white group-hover:bg-slate-50 z-10 text-center text-xs text-slate-500">
                            {history.length > 0 ? (sStat.absent + sStat.late) : '-'}
                          </td>

                          {/* 날짜별 상태 */}
                          {history.map(day => {
                            const record = day.records.find(r => r.studentId === student.id);
                            return (
                              <td key={`${day.id}-${student.id}`} className="p-2 text-center border-r border-slate-50 last:border-0">
                                {renderStatusIcon(record?.status, "w-4 h-4")}
                              </td>
                            );
                          })}
                          {history.length === 0 && <td></td>}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* 데이터 없음 안내 */}
              {history.length === 0 && (
                <div className="absolute inset-0 top-10 flex flex-col items-center justify-center text-slate-400 pointer-events-none">
                  <ChartBarIcon className="w-10 h-10 mb-2 opacity-20" />
                  <p className="text-sm">선택한 달의 출석 기록이 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}