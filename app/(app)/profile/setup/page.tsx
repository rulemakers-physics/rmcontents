// app/(app)/profile/setup/page.tsx

"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
// [수정] query, where, getDocs, deleteDoc 추가
import { doc, setDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { 
  UserIcon, BuildingOffice2Icon, AcademicCapIcon, SparklesIcon, ArrowRightIcon
} from "@heroicons/react/24/outline";

export default function ProfileSetupPage() {
  const { user, checkFirstLogin } = useAuth();
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [academy, setAcademy] = useState("");
  const [school, setSchool] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("로그인 정보가 없습니다. 다시 로그인해주세요.");
      return;
    }
    if (!name || !academy) {
      toast.error("이름과 학원명은 필수입니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. [신규] 나에게 온 초대장이 있는지 확인 (이메일 & isInvited)
      let finalRole = user.isAdmin ? 'admin' : 'instructor';
      let finalOwnerId = null;
      let finalAcademy = academy;

      const q = query(
        collection(db, "users"), 
        where("email", "==", user.email),
        where("isInvited", "==", true)
      );
      const inviteSnap = await getDocs(q);

      // 초대장이 있다면 정보를 합치고, 초대장은 삭제
      if (!inviteSnap.empty) {
        const inviteDoc = inviteSnap.docs[0];
        const inviteData = inviteDoc.data();
        
        // 원장이 지정해둔 정보 우선 사용
        finalOwnerId = inviteData.ownerId; 
        finalAcademy = inviteData.academy || academy;
        // role은 관리자가 지정했어도, 실제 가입자가 Admin 권한이 있으면 Admin 유지
        if (finalRole !== 'admin') {
           finalRole = inviteData.role || 'instructor';
        }

        // 임시 초대 문서 삭제 (중복 방지)
        await deleteDoc(inviteDoc.ref);
        console.log("초대 정보 연동 및 임시 문서 삭제 완료");
      }

      // 2. 실제 유저 문서 생성
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(
        userDocRef,
        {
          uid: user.uid,
          email: user.email,
          name: name,
          academy: finalAcademy,
          school: school || "",
          createdAt: new Date(),
          role: finalRole,
          ownerId: finalOwnerId || null, // [신규] 원장 ID 연동
          plan: 'FREE' // 초기 가입은 FREE
        },
        { merge: true }
      );

      await checkFirstLogin(user);
      
      toast.success(`환영합니다, ${name} 선생님!`);
      router.push("/dashboard");

    } catch (err) {
      console.error("프로필 저장 중 에러:", err);
      toast.error("설정 저장에 실패했습니다.");
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      {/* ... (UI 코드는 기존과 동일하므로 생략하지 않고 전체 유지) ... */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-md mb-4 text-blue-600">
           <SparklesIcon className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">RuleMakers에 오신 것을 환영합니다!</h1>
        <p className="text-slate-500">원활한 서비스 이용을 위해 기본 정보를 설정해주세요.</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="w-full h-1.5 bg-slate-100">
           <div className="w-2/3 h-full bg-blue-600 rounded-r-full"></div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-1">
                이름 (필수)
              </label>
              <div className="relative">
                <UserIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="선생님 성함"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="academy" className="block text-sm font-bold text-slate-700 mb-1">
                학원명 (필수)
              </label>
              <div className="relative">
                <BuildingOffice2Icon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="academy"
                  type="text"
                  value={academy}
                  onChange={(e) => setAcademy(e.target.value)}
                  required
                  placeholder="재직 중인 학원명"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="school" className="block text-sm font-bold text-slate-700 mb-1">
                주요 담당 학교 <span className="text-slate-400 font-normal">(선택)</span>
              </label>
              <div className="relative">
                <AcademicCapIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="school"
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="예: 서울고, 경기고"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1 ml-1">
                * 입력하신 학교의 맞춤 자료를 추천해 드립니다.
              </p>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="group w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-4 text-base font-bold text-white shadow-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                "저장 중..."
              ) : (
                <>
                  시작하기 <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <p className="mt-8 text-xs text-slate-400">
        © 2025 RuleMakers. All rights reserved.
      </p>
    </div>
  );
}