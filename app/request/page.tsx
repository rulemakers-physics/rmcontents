// app/request/page.tsx

"use client";

import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid"; // 파일명 중복 방지를 위해 uuid 사용

export default function RequestPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // 폼 상태
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // --- [수정된 부분 START] ---
  // 2. 로그인 안 한 사용자 보호 로직을 useEffect로 이동
  useEffect(() => {
    if (loading) {
      return; // AuthContext가 로딩 중일 때는 대기
    }
    if (!user) {
      // 로딩이 끝났는데 유저 정보가 없으면 로그인 페이지로 리디렉션
      alert("로그인이 필요한 서비스입니다.");
      router.push("/login");
    }
  }, [user, loading, router]); // user나 loading 상태가 변경될 때마다 이 효과를 재실행
  // --- [수정된 부분 END] ---
  
  // 파일 선택 핸들러
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("로그인이 필요합니다.");
      return;
    }
    if (!title || !details) {
      setError("요청 제목과 상세 내용은 필수입니다.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      let fileUrl = "";
      let storagePath = "";

      // 1. (선택) 파일이 있으면 Storage에 업로드
      if (file) {
        // 파일명 중복을 피하기 위해 uuid 사용
        const uniqueFileName = `${uuidv4()}-${file.name}`;
        storagePath = `uploads/requests/${user.uid}/${uniqueFileName}`;
        const fileRef = ref(storage, storagePath);
        
        await uploadBytes(fileRef, file);
        fileUrl = await getDownloadURL(fileRef); // 다운로드 URL 확보
      }

      // 2. 강사 프로필 정보 (이름, 학원명) 가져오기
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      // 3. Firestore 'requests' 컬렉션에 요청서 저장
      await addDoc(collection(db, "requests"), {
        instructorId: user.uid,
        instructorName: userData?.name || "이름없음", // 프로필 정보
        academy: userData?.academy || "학원없음", // 프로필 정보
        title: title,
        details: details,
        status: "requested", // 초기 상태: '요청됨'
        requestedAt: serverTimestamp(), // 서버 시간 기준
        referenceFileUrl: fileUrl, // (선택) 참고 파일 URL
        referenceStoragePath: storagePath, // (선택) 참고 파일 경로
        // completedFileUrl 등은 나중에 관리자가 업데이트
      });

      // 4. 완료 후 대시보드로 이동
      alert("작업 요청이 성공적으로 제출되었습니다.");
      router.push("/dashboard");

    } catch (err) {
      console.error("요청 제출 중 에러:", err);
      setError("제출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setIsSubmitting(false);
    }
  };
  
  // 로그인 안 한 사용자 보호
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">로딩 중...</div>
  }
  if (!user) {
    // (개선) 실제로는 AuthContext에서 리디렉션하지만, 2차 방어
    router.push("/login");
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-grow bg-gray-50 py-16">
        <div className="container mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-md">
          <h1 className="mb-8 text-center text-3xl font-bold text-gray-900">
            새 작업 요청하기
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                요청 제목 (필수)
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="예: OO고 2학년 1학기 중간고사 대비"
              />
            </div>

            <div>
              <label htmlFor="details" className="block text-sm font-medium text-gray-700">
                상세 요청 내용 (필수)
              </label>
              <textarea
                id="details"
                rows={6}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="필요한 문항 수, 난이도, 특정 유형, 마감일 등 상세 내용을 적어주세요."
              />
            </div>

            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                참고 파일 (선택)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                학교 기출 문제, 참고 자료 등 PDF 파일을 업로드할 수 있습니다.
              </p>
              <input
                id="file"
                type="file"
                accept=".pdf" // PDF 파일만 허용 (필요시 수정)
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:rounded-md file:border-0
                  file:bg-blue-50 file:px-4 file:py-2
                  file:text-sm file:font-medium file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>

            {error && (
              <p className="text-center text-sm text-red-600">{error}</p>
            )}

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md border border-transparent bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isSubmitting ? "제출 중..." : "작업 요청하기"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}