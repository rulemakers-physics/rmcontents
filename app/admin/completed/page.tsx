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
  Timestamp,
  orderBy,
  onSnapshot // [수정] 실시간 업데이트를 위해 추가
} from "firebase/firestore";

// Firestore에서 가져올 요청 데이터의 타입 정의
interface RequestData {
  id: string;
  title: string;
  instructorName: string;
  academy: string;
  status: "requested" | "in_progress" | "completed" | "rejected";
  requestedAt: Timestamp;
  completedAt?: Timestamp;
  rejectReason?: string;
  // [신규] 관리자용 안 읽은 메시지 수
  unreadCountAdmin?: number;
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

    // [수정] 실시간 리스너(onSnapshot)로 변경
    // 완료되거나 반려된 작업 중, 메시지가 오면 즉시 반응
    const q = query(
      collection(db, "requests"),
      where("status", "in", ["completed", "rejected"]),
      orderBy("requestedAt", "desc") 
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const requestList = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        } as RequestData;
      });
      
      setRequests(requestList);
      setIsLoading(false);
    }, (error) => {
      console.error("완료/반려 목록 로딩 에러:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, loading, isAdmin, router]);

  if (loading || isLoading || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        관리자 정보를 확인 중입니다...
      </div>
    );
  }

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
                      <td className="px-6 py-4 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {req.title}
                          {/* [신규] 관리자용 알림 배지 (완료된 작업에서도 표시) */}
                          {req.unreadCountAdmin && req.unreadCountAdmin > 0 ? (
                             <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10 animate-pulse">
                               New
                             </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{req.instructorName} ({req.academy})</td>
                      <td className="px-6 py-4 text-gray-500">
                        {req.status === 'completed' && req.completedAt 
                          ? req.completedAt.toDate().toLocaleDateString('ko-KR') 
                          : req.requestedAt.toDate().toLocaleDateString('ko-KR')}
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