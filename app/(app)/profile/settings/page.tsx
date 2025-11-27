// app/profile/settings/page.tsx

"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { 
  UserCircleIcon, 
  BuildingOfficeIcon, 
  AcademicCapIcon, 
  EnvelopeIcon,
  CheckBadgeIcon,
  CreditCardIcon
} from "@heroicons/react/24/outline";

export default function ProfileSettingsPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [academy, setAcademy] = useState("");
  const [school, setSchool] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchProfile = async () => {
      // AuthContext의 userData가 이미 있으면 그것을 우선 사용 (속도 향상)
      if (userData) {
        setName(userData.name || "");
        setAcademy(userData.academy || "");
        setSchool(userData.school || "");
        setIsLoadingData(false);
        return;
      }

      // 없으면 직접 fetch
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || "");
          setAcademy(data.academy || "");
          setSchool(data.school || "");
        }
      } catch (e) {
        console.error(e);
        toast.error("정보를 불러오지 못했습니다.");
      }
      setIsLoadingData(false);
    };
    fetchProfile();
  }, [user, userData, loading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, {
        name,
        academy,
        school
      });
      toast.success("프로필이 성공적으로 수정되었습니다.");
      router.refresh(); // 데이터 갱신
    } catch (error) {
      console.error("수정 실패", error);
      toast.error("저장에 실패했습니다.");
    }
    setIsSubmitting(false);
  };

  if (loading || isLoadingData) return (
    <div className="flex h-full items-center justify-center p-12">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      
      {/* 1. 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">프로필 설정</h1>
        <p className="text-slate-500 mt-1">계정 정보와 프로필을 관리하세요.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. 좌측: 프로필 요약 카드 (Visual) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col items-center text-center">
            {/* 아바타 (플레이스홀더) */}
            <div className="relative w-24 h-24 mb-4">
              <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-4xl font-bold ring-4 ring-white shadow-lg">
                {name ? name[0] : <UserCircleIcon className="w-16 h-16" />}
              </div>
              <button className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md" title="사진 변경 (준비중)">
                 <UserCircleIcon className="w-4 h-4" />
              </button>
            </div>
            
            <h2 className="text-xl font-bold text-slate-900">{name} 선생님</h2>
            <p className="text-sm text-slate-500 mb-4">{user?.email}</p>
            
            {/* 플랜 배지 */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
              userData?.plan === 'MAKERS' 
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              {userData?.plan === 'MAKERS' ? (
                <>
                  <CheckBadgeIcon className="w-4 h-4" /> Maker's Plan
                </>
              ) : (
                <>
                  <CreditCardIcon className="w-4 h-4" /> Basic Plan
                </>
              )}
            </div>
          </div>
          
          {/* 계정 정보 (Read-only) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">계정 정보</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400">이메일 (변경 불가)</label>
                <div className="flex items-center gap-2 text-sm text-slate-700 mt-1 bg-slate-50 p-2 rounded-lg">
                  <EnvelopeIcon className="w-4 h-4 text-slate-400" />
                  {user?.email}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400">권한</label>
                <div className="text-sm text-slate-700 mt-1 font-medium bg-slate-50 p-2 rounded-lg">
                  {userData?.role === 'admin' ? '관리자 (Admin)' : '강사 (Instructor)'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. 우측: 정보 수정 폼 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800">기본 정보 수정</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <UserCircleIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      required 
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder:text-slate-300"
                      placeholder="실명을 입력하세요"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                    학원명 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <BuildingOfficeIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      value={academy} 
                      onChange={(e) => setAcademy(e.target.value)} 
                      required 
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder:text-slate-300"
                      placeholder="재직 중인 학원명"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                    담당 학교 (선택)
                  </label>
                  <div className="relative">
                    <AcademicCapIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      value={school} 
                      onChange={(e) => setSchool(e.target.value)} 
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder:text-slate-300"
                      placeholder="주로 담당하는 학교명 (예: 서울고, 경기고)"
                    />
                  </div>
                  <p className="text-xs text-slate-500 pl-1">
                    * 담당 학교를 입력하시면 해당 학교의 기출 분석 자료를 우선적으로 추천해 드립니다.
                  </p>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => router.back()}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? "저장 중..." : "변경 내용 저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}