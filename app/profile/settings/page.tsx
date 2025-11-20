// app/profile/settings/page.tsx

"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function ProfileSettingsPage() {
  const { user, loading } = useAuth();
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
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setName(data.name || "");
        setAcademy(data.academy || "");
        setSchool(data.school || "");
      }
      setIsLoadingData(false);
    };
    fetchProfile();
  }, [user, loading, router]);

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
      alert("프로필이 수정되었습니다.");
      router.push("/dashboard");
    } catch (error) {
      console.error("수정 실패", error);
      alert("저장에 실패했습니다.");
    }
    setIsSubmitting(false);
  };

  if (loading || isLoadingData) return <div className="flex min-h-screen items-center justify-center">로딩 중...</div>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">프로필 설정</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">이름</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">학원명</label>
            <input type="text" value={academy} onChange={(e) => setAcademy(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">담당 학교 (선택)</label>
            <input type="text" value={school} onChange={(e) => setSchool(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {isSubmitting ? "저장 중..." : "수정 완료"}
          </button>
        </form>
      </div>
    </div>
  );
}