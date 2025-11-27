// app/(app)/admin/active/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { ArrowLeftIcon, FunnelIcon } from "@heroicons/react/24/solid";

interface RequestData {
  id: string;
  title: string;
  instructorName: string;
  academy: string;
  status: "requested" | "in_progress";
  requestedAt: Timestamp;
  contentKind: string;
  unreadCountAdmin?: number;
}

export default function AdminActiveListPage() {
  const { user, loading } = useAuth();
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user?.isAdmin) return;

    // 접수됨(requested) 또는 작업중(in_progress)인 항목만 조회
    const q = query(
      collection(db, "requests"),
      where("status", "in", ["requested", "in_progress"]),
      orderBy("requestedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RequestData));
      setRequests(list);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, loading]);

  if (loading || isLoading) return <div className="p-8 text-center">로딩 중...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors">
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">접수된 작업 전체 보기</h1>
            <p className="text-sm text-slate-500">현재 진행 중이거나 대기 중인 모든 요청을 확인합니다.</p>
          </div>
        </div>

        {/* 리스트 테이블 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">요청 제목</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">강사 (학원)</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">종류</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">요청일</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                        req.status === 'requested' 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {req.status === 'requested' ? '접수됨' : '작업중'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{req.title}</span>
                        {req.unreadCountAdmin && req.unreadCountAdmin > 0 ? (
                           <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600 ring-1 ring-inset ring-red-600/10 animate-pulse">
                             New
                           </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {req.instructorName} <span className="text-slate-400">({req.academy})</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{req.contentKind}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {req.requestedAt.toDate().toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link 
                        href={`/admin/request/${req.id}`}
                        className="text-blue-600 font-medium hover:underline"
                      >
                        관리
                      </Link>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      진행 중인 작업이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}