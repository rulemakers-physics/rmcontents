// app/(app)/profile/setup/page.tsx

"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { 
  UserIcon, BuildingOffice2Icon, AcademicCapIcon, 
  ArrowRightIcon, UserGroupIcon, StarIcon // StarIcon 추가 (프리랜서 강조용)
} from "@heroicons/react/24/outline";
import { UserRole } from "@/types/user";
import { SCIENCE_UNITS } from "@/types/scienceUnits";

export default function ProfileSetupPage() {
  const { user, checkFirstLogin } = useAuth();
  const router = useRouter();

  // 역할 선택 상태
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // 입력 폼 상태
  const [name, setName] = useState("");
  const [academy, setAcademy] = useState("");
  const [school, setSchool] = useState("");   
  const [grade, setGrade] = useState("1");
  const [targetUnit, setTargetUnit] = useState("");
  const [parentPhone, setParentPhone] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const integratedScienceUnits = SCIENCE_UNITS.flatMap(s => s.majorTopics.map(m => m.name));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !selectedRole) return;

    if (!name.trim()) return toast.error("이름을 입력해주세요.");
    if ((selectedRole === 'director' || selectedRole === 'instructor') && !academy.trim()) return toast.error("소속(학원/팀)명은 필수입니다.");
    if (selectedRole === 'student' && !school.trim()) return toast.error("학교명은 필수입니다.");

    setIsSubmitting(true);

    try {
      const userDocRef = doc(db, "users", user.uid);
      
      const baseData = {
        uid: user.uid,
        email: user.email,
        name: name,
        role: selectedRole,
        createdAt: serverTimestamp(),
        isInvited: false,
      };

      let additionalData = {};

      if (selectedRole === 'student') {
        additionalData = {
          school: school,
          grade: parseInt(grade),
          targetUnit: targetUnit,
          parentPhone: parentPhone,
          plan: 'FREE',
          academy: "RuleMakers Online",
        };
      } else if (selectedRole === 'director') {
        // [핵심] 원장/대표강사: 본인이 소유주(Owner)이며 결제 권한을 가짐
        additionalData = {
          academy: academy, // 학원명 또는 팀명
          plan: 'FREE', 
          ownerId: user.uid,
          coins: 0
        };
      } else {
        // [핵심] 소속 강사/조교: 시스템상 instructor 권한 (결제 권한 없음)
        additionalData = {
          academy: academy,
          school: school,
          plan: 'FREE',
          ownerId: user.uid, // 일단 본인으로 두지만, 추후 초대 로직이나 관리자 페이지에서 변경됨
          coins: 0
        };
      }

      await setDoc(userDocRef, { ...baseData, ...additionalData }, { merge: true });
      
      await new Promise(resolve => setTimeout(resolve, 2000)); 
      await user.getIdToken(true);
      await checkFirstLogin(user);
      
      toast.success(`${name}님 환영합니다!`);
      
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

  // --- Step 1: 역할 선택 화면 (안내 문구 개선) ---
  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3">RuleMakers 이용 목적을 선택해주세요</h1>
          <p className="text-slate-500">선택하신 유형에 따라 제공되는 기능이 달라집니다.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl w-full">
          
          {/* 1. 운영자 (원장/대표강사) -> DB: director */}
          <button 
            onClick={() => setSelectedRole('director')}
            className="group relative bg-white p-8 rounded-3xl border-2 border-slate-200 hover:border-purple-500 hover:shadow-xl transition-all text-left flex flex-col h-80 justify-between overflow-hidden"
          >
            <div className="z-10">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 text-purple-600 group-hover:scale-110 transition-transform">
                <StarIcon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                  원장님 / 대표 강사
                </h3>
                <span className="inline-block mt-1 text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                  관리자 권한 (결제/운영)
                </span>
              </div>
              <p className="text-slate-500 mt-3 text-sm break-keep leading-relaxed">
                "제가 직접 결제하고 운영합니다."<br/>
                학원 전체를 관리하거나, 조교/팀원을 등록하여 나만의 컨텐츠 팀을 운영하실 분
              </p>
            </div>
            {/* 장식용 배경 */}
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-50 rounded-tl-full opacity-0 group-hover:opacity-100 transition-opacity translate-y-10 group-hover:translate-y-0" />
          </button>

          {/* 2. 소속 강사 (직원) -> DB: instructor */}
          <button 
            onClick={() => setSelectedRole('instructor')}
            className="group relative bg-white p-8 rounded-3xl border-2 border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all text-left flex flex-col h-80 justify-between overflow-hidden"
          >
            <div className="z-10">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition-transform">
                <UserGroupIcon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  소속 강사 / 조교
                </h3>
                <span className="inline-block mt-1 text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                  팀원 권한 (초대 기반)
                </span>
              </div>
              <p className="text-slate-500 mt-3 text-sm break-keep leading-relaxed">
                "이미 서비스를 이용중인 곳에 합류합니다."<br/>
                원장님이나 대표 강사님께 초대받아 수업 자료를 이용하고 학생을 관리하실 분
              </p>
            </div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-50 rounded-tl-full opacity-0 group-hover:opacity-100 transition-opacity translate-y-10 group-hover:translate-y-0" />
          </button>

          {/* 3. 학생 (Student) -> DB: student */}
          {/* [런칭 제외] 학생 선택 버튼 주석 처리 
            나중에 학생 기능을 오픈할 때 이 주석을 해제하세요.
          */}
          {/*
          <button 
            onClick={() => setSelectedRole('student')}
            className="group relative bg-white p-8 rounded-3xl border-2 border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all text-left flex flex-col h-80 justify-between overflow-hidden"
          >
            <div className="z-10">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 group-hover:scale-110 transition-transform">
                <AcademicCapIcon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  학생 (수험생)
                </h3>
                <span className="inline-block mt-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                  학습자 권한
                </span>
              </div>
              <p className="text-slate-500 mt-3 text-sm break-keep leading-relaxed">
                "성적 향상을 목표로 공부합니다."<br/>
                맞춤형 문제 풀이, 오답 노트, AI 취약점 분석 리포트를 이용할 학생
              </p>
            </div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-50 rounded-tl-full opacity-0 group-hover:opacity-100 transition-opacity translate-y-10 group-hover:translate-y-0" />
          </button>
          */}
        </div>
      </div>
    );
  }

  // --- Step 2: 정보 입력 폼 ---
  const isStudent = selectedRole === 'student';
  const isDirector = selectedRole === 'director';

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${isStudent ? 'bg-emerald-50/30' : 'bg-slate-50'}`}>
      <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4">
        <div className="flex justify-center mb-6">
          <Image src="/images/logo.png" alt="RuleMakers" width={180} height={50} className="h-12 w-auto object-contain" priority />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">기본 정보 설정</h1>
        <p className="text-slate-500">
          {isDirector ? "학원(팀) 운영을 위한 정보를 입력해주세요." : "원활한 서비스 이용을 위해 정보를 입력해주세요."}
        </p>
      </div>

      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          <div className="space-y-1">
            <label className="block text-sm font-bold text-slate-700">이름 <span className="text-red-500">*</span></label>
            <div className="relative">
              <UserIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="실명을 입력해주세요"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-200" />
            </div>
          </div>

          {!isStudent && (
            <div className="space-y-1">
              <label className="block text-sm font-bold text-slate-700">
                {isDirector ? "운영 중인 학원/팀 명" : "소속 학원/팀 명"} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <BuildingOffice2Icon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={academy} 
                  onChange={(e) => setAcademy(e.target.value)} 
                  required 
                  placeholder={isDirector ? "예: 샤인학원, 김철수 화학팀" : "재직 중인 곳의 이름을 입력하세요"}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-200" 
                />
              </div>
              {isDirector && (
                <p className="text-xs text-slate-400 mt-1 pl-1">* 추후 사업자 증빙 시 사용할 이름과 동일하게 입력해주세요.</p>
              )}
            </div>
          )}

          {isStudent && (
            // 학생용 폼은 그대로 유지
            <>
              <div className="space-y-1">
                <label className="block text-sm font-bold text-slate-700">학교 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <BuildingOffice2Icon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text" value={school} onChange={(e) => setSchool(e.target.value)} required placeholder="재학 중인 학교명"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-bold text-slate-700">학년</label>
                  <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                    <option value="1">고1</option><option value="2">고2</option><option value="3">고3</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-bold text-slate-700">학습 단원</label>
                  <select value={targetUnit} onChange={(e) => setTargetUnit(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                    <option value="">선택</option>
                    {integratedScienceUnits.slice(0,6).map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="pt-2">
            <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 rounded-xl px-6 py-4 bg-slate-900 text-white font-bold shadow-lg hover:bg-slate-800 transition-all">
              {isSubmitting ? "저장 중..." : "시작하기"} <ArrowRightIcon className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => setSelectedRole(null)} className="w-full mt-3 text-xs text-slate-400 hover:text-slate-600 underline">
              유형 다시 선택하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}