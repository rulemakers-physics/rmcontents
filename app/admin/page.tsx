// app/admin/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
} from "firebase/firestore";

// Firestore에서 가져올 요청 데이터의 타입 정의
interface RequestData {
  id: string;
  title: string;
  instructorName: string;
  academy: string;
  status: "requested" | "in_progress" | "completed";
  requestedAt: Timestamp;
}

export default function AdminDashboard() {
  // --- [수정된 부분 1] ---
  // isAdmin을 user 객체 안에서 가져오도록 수정
  const { user, loading } = useAuth();
  const isAdmin = user?.isAdmin; // user가 있을 때만 isAdmin 값을 가져옴
  // --- [수정 끝] ---
  const router = useRouter();
  
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. 로딩이 끝났는지 확인
    if (loading) return;

    // 2. 관리자가 아니면 강사 대시보드로 리디렉션
    if (!user || !isAdmin) {
      alert("접근 권한이 없습니다.");
      router.push("/dashboard");
      return;
    }

    // 3. 관리자일 경우, 요청 목록 불러오기
    const fetchRequests = async () => {
      setIsLoading(true);
      try {
        // 'completed' 상태가 아닌 모든 요청을 'requestedAt' 기준으로 내림차순 정렬
        const q = query(
          collection(db, "requests"),
          where("status", "!=", "completed"),
          orderBy("status"), // 'in_progress'가 'requested'보다 위로 (알파벳순)
          orderBy("requestedAt", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        const requestList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as RequestData));
        
        setRequests(requestList);
      } catch (error) {
        console.error("요청 목록을 불러오는 중 에러:", error);
      }
      setIsLoading(false);
    };

    fetchRequests();
  }, [user, loading, isAdmin, router]);

  // 로딩 중 또는 권한 확인 중일 때
  if (loading || isLoading || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        관리자 정보를 확인 중입니다...
      </div>
    );
  }

  // --- 관리자 전용 UI ---
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-grow bg-gray-50 py-12">
        <div className="container mx-auto max-w-5xl px-6">
          <h1 className="mb-8 text-3xl font-bold text-gray-900">
            관리자 대시보드 (접수된 요청)
          </h1>
          
          <div className="overflow-x-auto rounded-lg bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">요청 제목</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">요청 강사 (학원)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">요청일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      새로운 요청이 없습니다.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {req.status === 'requested' && <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">요청됨</span>}
                        {req.status === 'in_progress' && <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700">작업중</span>}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{req.title}</td>
                      <td className="px-6 py-4 text-gray-700">{req.instructorName} ({req.academy})</td>
                      <td className="px-6 py-4 text-gray-500">{req.requestedAt.toDate().toLocaleDateString('ko-KR')}</td>
                      <td className="px-6 py-4">
                        <Link 
                          href={`/admin/request/${req.id}`}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          처리하기
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}