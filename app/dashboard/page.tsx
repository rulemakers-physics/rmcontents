// app/dashboard/page.tsx

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

// 강사 대시보드에서 사용할 요청 데이터 타입
interface MyRequestData {
  id: string;
  title: string;
  status: "requested" | "in_progress" | "completed";
  requestedAt: Timestamp;
  completedAt?: Timestamp; // 완료된 작업에만 존재
  completedFileUrl?: string; // 완료된 작업에만 존재
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [requests, setRequests] = useState<MyRequestData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. 로그인한 사용자의 요청 목록만 불러오기
  useEffect(() => {
    // AuthContext가 유저 정보를 로드할 때까지 대기
    if (loading) return;
    
    // 로그아웃 상태면 로그인 페이지로
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchMyRequests = async () => {
      setIsLoading(true);
      try {
        // 'requests' 컬렉션에서 'instructorId'가 현재 유저의 uid와 같은 것만 쿼리
        const q = query(
          collection(db, "requests"),
          where("instructorId", "==", user.uid),
          orderBy("requestedAt", "desc") // 최신순으로 정렬
        );
        
        const querySnapshot = await getDocs(q);
        const requestList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as MyRequestData));
        
        setRequests(requestList);
      } catch (error) {
        console.error("내 요청 목록을 불러오는 중 에러:", error);
      }
      setIsLoading(false);
    };

    fetchMyRequests();
  }, [user, loading, router]);

  // 로딩 화면
  if (loading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        요청 목록을 불러오는 중...
      </div>
    );
  }
  
  // 로그인 안 된 상태 (위 useEffect에서 리디렉션되지만, 방어 코드)
  if (!user) {
    return null; 
  }

  // --- 강사 대시보드 UI ---
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-grow bg-gray-50 py-12">
        <div className="container mx-auto max-w-5xl px-6">
          
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              요청한 작업 목록
            </h1>
            <Link 
              href="/request"
              className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              + 새 작업 요청하기
            </Link>
          </div>
          
          <div className="mt-8 overflow-x-auto rounded-lg bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">요청 제목</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">요청일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">완료/다운로드</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      아직 요청한 작업이 없습니다.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      {/* 상태 */}
                      <td className="px-6 py-4">
                        {req.status === 'requested' && <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">요청됨</span>}
                        {req.status === 'in_progress' && <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700">작업중</span>}
                        {req.status === 'completed' && <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">완료됨</span>}
                      </td>
                      {/* 제목 */}
                      <td className="px-6 py-4 font-medium text-gray-900">{req.title}</td>
                      {/* 요청일 */}
                      <td className="px-6 py-4 text-gray-500">{req.requestedAt.toDate().toLocaleDateString('ko-KR')}</td>
                      {/* 완료/다운로드 */}
                      <td className="px-6 py-4">
                        {req.status === 'completed' && req.completedFileUrl ? (
                          <a
                            href={req.completedFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-md bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200"
                          >
                            다운로드
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">
                            {req.status === 'in_progress' ? '작업 진행 중' : '대기 중'}
                          </span>
                        )}
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