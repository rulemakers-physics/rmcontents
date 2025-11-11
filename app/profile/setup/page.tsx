// app/profile/setup/page.tsx

"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function ProfileSetupPage() {
  const { user, checkFirstLogin } = useAuth(); // 현재 유저 정보
  const router = useRouter();
  
  // 폼 상태
  const [name, setName] = useState("");
  const [academy, setAcademy] = useState("");
  const [school, setSchool] = useState(""); // 담당 학교 (선택)
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 폼 제출 핸들러
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("로그인 정보가 없습니다. 다시 로그인해주세요.");
      return;
    }
    if (!name || !academy) {
      setError("이름과 학원명은 필수입니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Firestore 'users' 컬렉션에 사용자 프로필 저장
      // (1단계에서 Functions가 role, email을 저장했을 수 있으므로 'merge: true' 사용)
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(
        userDocRef,
        {
          uid: user.uid,
          email: user.email, // 이메일도 저장
          name: name,
          academy: academy,
          school: school || "", // 없으면 빈 문자열
          createdAt: new Date(),
          role: user.isAdmin ? 'admin' : 'instructor' // Context의 관리자 여부
        },
        { merge: true } // 기존 role 정보 등과 병합
      );

      // 프로필 저장이 완료되었으므로 '첫 로그인' 상태를 갱신
      await checkFirstLogin(user); // isFirstLogin을 false로 갱신

      // 대시보드로 이동
      router.push("/dashboard");

    } catch (err) {
      console.error("프로필 저장 중 에러:", err);
      setError("프로필 저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        로그인 정보를 불러오는 중...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
          프로필 설정
        </h2>
        <p className="mb-6 text-center text-sm text-gray-600">
          서비스 이용을 위해 추가 정보를 입력해주세요.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              이름 (필수)
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="academy" className="block text-sm font-medium text-gray-700">
              학원명 (필수)
            </label>
            <input
              id="academy"
              type="text"
              value={academy}
              onChange={(e) => setAcademy(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="school" className="block text-sm font-medium text-gray-700">
              담당 학교 (선택)
            </label>
            <input
              id="school"
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-center text-sm text-red-600">{error}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? "저장 중..." : "설정 완료 및 시작하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}