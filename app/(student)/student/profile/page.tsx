// app/(student)/student/profile/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { 
  UserCircleIcon, 
  AcademicCapIcon, 
  BookOpenIcon,
  PencilSquareIcon
} from "@heroicons/react/24/outline";
import { SCIENCE_UNITS } from "@/types/scienceUnits";

export default function StudentProfilePage() {
  const { user, userData } = useAuth();
  
  const [grade, setGrade] = useState(1);
  const [school, setSchool] = useState("");
  const [targetUnit, setTargetUnit] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // 통합과학 대단원 목록 (Flatten)
  const allUnits = SCIENCE_UNITS.flatMap(s => s.majorTopics.map(m => m.name));

  useEffect(() => {
    if (userData) {
      setGrade(userData.grade || 1);
      setSchool(userData.school || "");
      setTargetUnit(userData.targetUnit || "");
    }
  }, [userData]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        grade: Number(grade),
        school,
        targetUnit
      });
      toast.success("프로필이 업데이트되었습니다.");
    } catch (e) {
      toast.error("저장 실패");
    }
    setIsSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-8 font-sans">
      <h1 className="text-2xl font-extrabold text-slate-900 mb-8">내 정보 관리</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* 프로필 헤더 (Visual) */}
        <div className="bg-slate-50 p-8 border-b border-slate-100 flex flex-col items-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-md mb-4 text-slate-300">
            <UserCircleIcon className="w-20 h-20" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{userData?.name} 학생</h2>
          <p className="text-slate-500 text-sm">{userData?.email}</p>
          <span className="mt-3 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
            {userData?.plan === 'STD_PREMIUM' ? '프리미엄 멤버십' : '일반 회원'}
          </span>
        </div>

        {/* 폼 영역 */}
        <div className="p-8 space-y-6">
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
              <AcademicCapIcon className="w-4 h-4" /> 학교 정보
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <input 
                  type="text" 
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="학교명 (예: 서울고)"
                />
              </div>
              <div>
                <select 
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value={1}>1학년</option>
                  <option value={2}>2학년</option>
                  <option value={3}>3학년</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
              <BookOpenIcon className="w-4 h-4" /> 집중 학습 단원
            </label>
            <div className="relative">
              <select 
                value={targetUnit}
                onChange={(e) => setTargetUnit(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white appearance-none cursor-pointer"
              >
                <option value="">선택해주세요</option>
                {allUnits.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
              <PencilSquareIcon className="w-5 h-5 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
            </div>
            <p className="text-xs text-slate-400 mt-2 ml-1">
              * 설정한 단원 위주로 '오늘의 미션' 문제가 출제됩니다.
            </p>
          </div>

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-4 mt-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-200 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? "저장 중..." : "변경 내용 저장"}
          </button>

        </div>
      </div>
    </div>
  );
}