// components/ClassAttendance.tsx

"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, setDoc, getDocs, query, where } from "firebase/firestore";
import { format } from "date-fns"; // 날짜 포맷팅용 (없으면 문자열 처리 가능)
import { toast } from "react-hot-toast";
import { StudentData, AttendanceRecord, AttendanceStatus } from "@/types/academy";
import { CheckCircleIcon, XCircleIcon, ClockIcon, NoSymbolIcon } from "@heroicons/react/24/outline";

interface Props {
  classId: string;
  students: StudentData[];
}

export default function ClassAttendance({ classId, students }: Props) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(false);

  // 1. 날짜 변경 시 해당 날짜의 출석 데이터 불러오기
  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
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
      }
      setLoading(false);
    };
    
    if (students.length > 0) fetchAttendance();
  }, [classId, selectedDate, students]);

  // 2. 저장 핸들러
  const handleSave = async () => {
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
      toast.success("출석이 저장되었습니다.");
    } catch (e) {
      toast.error("저장 실패");
    }
  };

  const toggleStatus = (studentId: string, status: AttendanceStatus) => {
    setRecords(prev => ({ ...prev, [studentId]: status }));
  };

  return (
    <div className="space-y-6">
      {/* 날짜 선택 헤더 */}
      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
        <input 
          type="date" 
          value={selectedDate} 
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
        />
        <button 
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
        >
          저장하기
        </button>
      </div>

      {/* 출석 체크 리스트 */}
      <div className="space-y-2">
        {students.map(student => (
          <div key={student.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg hover:border-blue-100 transition-colors">
            <span className="font-bold text-slate-700 w-24 truncate">{student.name}</span>
            
            <div className="flex gap-1">
              {[
                { val: 'present', label: '출석', icon: CheckCircleIcon, color: 'text-green-500', bg: 'bg-green-50' },
                { val: 'late', label: '지각', icon: ClockIcon, color: 'text-yellow-500', bg: 'bg-yellow-50' },
                { val: 'absent', label: '결석', icon: XCircleIcon, color: 'text-red-500', bg: 'bg-red-50' },
                { val: 'excused', label: '인정', icon: NoSymbolIcon, color: 'text-gray-500', bg: 'bg-gray-50' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => toggleStatus(student.id, opt.val as AttendanceStatus)}
                  className={`flex flex-col items-center justify-center w-12 h-10 rounded-md border transition-all ${
                    records[student.id] === opt.val 
                      ? `${opt.bg} ${opt.color} border-${opt.color.split('-')[1]}-200 ring-1 ring-${opt.color.split('-')[1]}-200` 
                      : 'bg-white border-slate-100 text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <opt.icon className="w-5 h-5" />
                  <span className="text-[9px] font-bold mt-0.5">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}