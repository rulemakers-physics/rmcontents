// app/(app)/profile/setup/page.tsx

"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { 
  UserIcon, BuildingOffice2Icon, AcademicCapIcon, 
  SparklesIcon, ArrowRightIcon, CheckCircleIcon,
  BeakerIcon, BookOpenIcon
} from "@heroicons/react/24/outline";
import { UserRole } from "@/types/user";
import { SCIENCE_UNITS } from "@/types/scienceUnits"; // 통합과학 단원 정보

export default function ProfileSetupPage() {
  const { user, checkFirstLogin } = useAuth();
  const router = useRouter();

  // 1. 역할 선택 상태 (null: 선택 전)
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // 2. 공통 및 강사용 State
  const [name, setName] = useState("");
  const [academy, setAcademy] = useState(""); // 강사용
  const [school, setSchool] = useState("");   // 강사: 담당학교, 학생: 재학중인 학교

  // 3. 학생용 추가 State
  const [grade, setGrade] = useState("1"); // 학년 (기본 고1)
  const [targetUnit, setTargetUnit] = useState(""); // 현재 집중 학습 단원
  const [parentPhone, setParentPhone] = useState(""); // 부모님 연락처 (선택)

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 통합과학 대단원 목록 추출 (학생용)
  const integratedScienceUnits = SCIENCE_UNITS.flatMap(s => s.majorTopics.map(m => m.name));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !selectedRole) return;

    // 유효성 검사
    if (!name.trim()) return toast.error("이름을 입력해주세요.");
    if (selectedRole === 'instructor' && !academy.trim()) return toast.error("학원명은 필수입니다.");
    if (selectedRole === 'student' && !school.trim()) return toast.error("학교명은 필수입니다.");

    setIsSubmitting(true);

    try {
      const userDocRef = doc(db, "users", user.uid);
      
      // 저장할 데이터 구성
      const baseData = {
        uid: user.uid,
        email: user.email,
        name: name,
        role: selectedRole,
        createdAt: serverTimestamp(),
        isInvited: false, // 직접 가입
      };

      // 역할별 추가 데이터
      const additionalData = selectedRole === 'student' ? {
        school: school,
        grade: parseInt(grade),
        targetUnit: targetUnit, // 현재 학습 단원
        parentPhone: parentPhone,
        plan: 'STD_STANDARD', // 학생 기본 플랜
        academy: "RuleMakers Online", // 학생은 기본적으로 온라인 소속 (추후 학원 연동 가능)
      } : {
        academy: academy,
        school: school, // 주요 담당 학교
        plan: 'FREE',
        ownerId: user.uid, // 강사는 본인이 owner (기본)
      };

      await setDoc(userDocRef, { ...baseData, ...additionalData }, { merge: true });
      
      // 세션 갱신 및 리다이렉트
      await checkFirstLogin(user);
      
      toast.success(`${name}님 환영합니다!`);
      
      // 역할에 따라 다른 경로로 이동
      if (selectedRole === 'student') {
        router.push("/student/dashboard");
      } else {
        router.push("/dashboard");
      }

    } catch (err) {
      console.error("Setup Error:", err);
      toast.error("설정 저장 중 오류가 발생했습니다.");
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  // --- Step 1: 역할 선택 화면 ---
  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3">어떤 목적으로 오셨나요?</h1>
          <p className="text-slate-500">서비스 이용 유형을 선택해주세요.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
          {/* 강사 선택 카드 */}
          <button 
            onClick={() => setSelectedRole('instructor')}
            className="group relative bg-white p-8 rounded-3xl border-2 border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all text-left flex flex-col h-80 justify-between overflow-hidden"
          >
            <div className="z-10">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition-transform">
                <BuildingOffice2Icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">강사 / 원장님</h3>
              <p className="text-slate-500 mt-2 text-sm">
                수업 자료 제작, 학생 관리, 학원 운영을 위한<br/>전문 솔루션이 필요합니다.
              </p>
            </div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-50 rounded-tl-full opacity-0 group-hover:opacity-100 transition-opacity translate-y-10 group-hover:translate-y-0" />
          </button>

          {/* 학생 선택 카드 (그린 테마) */}
          <button 
            onClick={() => setSelectedRole('student')}
            className="group relative bg-white p-8 rounded-3xl border-2 border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all text-left flex flex-col h-80 justify-between overflow-hidden"
          >
            <div className="z-10">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 group-hover:scale-110 transition-transform">
                <AcademicCapIcon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">학생 (고등학생)</h3>
              <p className="text-slate-500 mt-2 text-sm">
                내신 1등급을 위한 맞춤 문제 풀이와<br/>성적 분석 리포트가 필요합니다.
              </p>
            </div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-50 rounded-tl-full opacity-0 group-hover:opacity-100 transition-opacity translate-y-10 group-hover:translate-y-0" />
          </button>
        </div>
      </div>
    );
  }

  // --- Step 2: 정보 입력 폼 ---
  const isStudent = selectedRole === 'student';
  const themeColor = isStudent ? "emerald" : "blue"; // 테마 색상 변수

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${isStudent ? 'bg-emerald-50/30' : 'bg-slate-50'}`}>
      
      <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl shadow-md mb-4 text-white ${isStudent ? 'bg-emerald-500' : 'bg-blue-600'}`}>
           {isStudent ? <BeakerIcon className="w-6 h-6" /> : <SparklesIcon className="w-6 h-6" />}
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
          {isStudent ? "통합과학 마스터를 위한 첫 걸음" : "RuleMakers에 오신 것을 환영합니다!"}
        </h1>
        <p className="text-slate-500">
          {isStudent ? "나에게 딱 맞는 학습을 위해 정보를 알려주세요." : "원활한 서비스 이용을 위해 기본 정보를 설정해주세요."}
        </p>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-8 delay-100">
        <div className="w-full h-1.5 bg-slate-100">
           <div className={`w-2/3 h-full rounded-r-full ${isStudent ? 'bg-emerald-500' : 'bg-blue-600'}`}></div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* 공통: 이름 */}
          <div className="space-y-1">
            <label className="block text-sm font-bold text-slate-700">이름 <span className="text-red-500">*</span></label>
            <div className="relative">
              <UserIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)} required
                placeholder="실명을 입력해주세요"
                className={`w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all ${
                  isStudent ? 'focus:border-emerald-500 focus:ring-emerald-200' : 'focus:border-blue-500 focus:ring-blue-200'
                } focus:bg-white focus:ring-2`}
              />
            </div>
          </div>

          {/* 분기: 학생용 폼 */}
          {isStudent ? (
            <>
              <div className="space-y-1">
                <label className="block text-sm font-bold text-slate-700">학교 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <BuildingOffice2Icon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text" value={school} onChange={(e) => setSchool(e.target.value)} required
                    placeholder="재학 중인 학교명 (예: 서울고)"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-bold text-slate-700">학년</label>
                  <select 
                    value={grade} onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 cursor-pointer"
                  >
                    <option value="1">고등학교 1학년</option>
                    <option value="2">고등학교 2학년</option>
                    <option value="3">고등학교 3학년</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-bold text-slate-700">현재 학습 단원</label>
                  <select 
                    value={targetUnit} onChange={(e) => setTargetUnit(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 cursor-pointer text-sm"
                  >
                    <option value="">선택해주세요</option>
                    {integratedScienceUnits.slice(0, 6).map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <h4 className="text-xs font-bold text-emerald-700 mb-2 flex items-center gap-1">
                  <BookOpenIcon className="w-4 h-4" /> 맞춤 학습 추천
                </h4>
                <p className="text-xs text-emerald-600 leading-relaxed">
                  선택하신 학교와 단원에 맞춰<br/>
                  <span className="font-bold underline">우리 학교 기출 변형 문제</span>를 매일 추천해드립니다.
                </p>
              </div>
            </>
          ) : (
            /* 분기: 강사용 폼 (기존 유지) */
            <>
              <div className="space-y-1">
                <label className="block text-sm font-bold text-slate-700">학원명 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <BuildingOffice2Icon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text" value={academy} onChange={(e) => setAcademy(e.target.value)} required
                    placeholder="재직 중인 학원명"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-bold text-slate-700">주요 담당 학교</label>
                <div className="relative">
                  <AcademicCapIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text" value={school} onChange={(e) => setSchool(e.target.value)}
                    placeholder="예: 서울고, 경기고"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
            </>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`group w-full flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                isStudent 
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-200' 
                  : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'
              }`}
            >
              {isSubmitting ? "저장 중..." : (
                <>
                  시작하기 <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            <button 
              type="button" 
              onClick={() => setSelectedRole(null)}
              className="w-full mt-3 text-xs text-slate-400 hover:text-slate-600 underline"
            >
              역할 다시 선택하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}