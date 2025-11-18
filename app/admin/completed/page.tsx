// app/admin/completed/page.tsx

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
  status: "requested" | "in_progress" | "completed" | "rejected";
  requestedAt: Timestamp;
  completedAt?: Timestamp; // 완료된 작업이므로 추가
  rejectReason?: string; // 반려된 작업이므로 추가
}

export default function AdminCompletedDashboard() {
  const { user, loading } = useAuth();
  const isAdmin = user?.isAdmin;
  const router = useRouter();
  
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user || !isAdmin) {
      alert("접근 권한이 없습니다.");
      router.push("/dashboard");
      return;
    }

    // 관리자일 경우, 완료/반려된 요청 목록 불러오기
    const fetchRequests = async () => {
      setIsLoading(true);
      try {
        // [수정] 'completed' 또는 'rejected' 상태인 요청만 가져옴
        const q = query(
          collection(db, "requests"),
          where("status", "in", ["completed", "rejected"]),
          orderBy("requestedAt", "desc") // 최근 요청 순
        );
        
        const querySnapshot = await getDocs(q);
        const requestList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as RequestData));
        
        setRequests(requestList);
      } catch (error) {
        console.error("완료/반려 목록을 불러오는 중 에러:", error);
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
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              완료 및 반려된 작업
            </h1>
            <Link
              href="/admin"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              &larr; 접수된 작업 보기
            </Link>
          </div>
          
          <div className="overflow-x-auto rounded-lg bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">요청 제목</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">요청 강사 (학원)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">처리일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      완료 또는 반려된 작업이 없습니다.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {req.status === 'completed' && <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">완료됨</span>}
                        {req.status === 'rejected' && <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">반려됨</span>}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{req.title}</td>
                      <td className="px-6 py-4 text-gray-700">{req.instructorName} ({req.academy})</td>
                      <td className="px-6 py-4 text-gray-500">
                        {req.status === 'completed' && req.completedAt 
                          ? req.completedAt.toDate().toLocaleDateString('ko-KR') 
                          : req.requestedAt.toDate().toLocaleDateString('ko-KR')}
                        {/* 참고: 반려된 작업은 별도 'rejectedAt' 타임스탬프를 저장하면 더 좋습니다. */}
                      </td>
                      <td className="px-6 py-4">
                        <Link 
                          href={`/admin/request/${req.id}`}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          내역 확인
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