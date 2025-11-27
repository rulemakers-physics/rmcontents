// app/(app)/admin/active/page.tsx

"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { ArrowLeftIcon, MagnifyingGlassIcon, FunnelIcon } from "@heroicons/react/24/solid";

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

  // --- [신규] 필터 상태 ---
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "requested" | "in_progress">("all");

  useEffect(() => {
    if (loading) return;
    if (!user?.isAdmin) return;

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

  // --- [신규] 필터링 로직 ---
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      // 1. 검색어 필터 (제목, 강사명, 학원명)
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        req.title.toLowerCase().includes(searchLower) ||
        req.instructorName.toLowerCase().includes(searchLower) ||
        req.academy.toLowerCase().includes(searchLower);

      // 2. 상태 필터
      const matchesStatus = statusFilter === "all" || req.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, searchTerm, statusFilter]);

  if (loading || isLoading) return <div className="p-8 text-center">로딩 중...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors">
              <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">접수된 작업 관리</h1>
              <p className="text-sm text-slate-500">
                총 <span className="font-bold text-blue-600">{filteredRequests.length}</span>건의 작업이 조회되었습니다.
              </p>
            </div>
          </div>

          {/* [신규] 검색 및 필터 UI */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* 상태 필터 */}
            <div className="relative">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="appearance-none pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm"
              >
                <option value="all">전체 상태</option>
                <option value="requested">접수됨 (대기)</option>
                <option value="in_progress">작업중</option>
              </select>
              <FunnelIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* 검색창 */}
            <div className="relative">
              <input 
                type="text" 
                placeholder="제목, 강사명, 학원명 검색" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full sm:w-64 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm"
              />
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* 리스트 테이블 (데이터 소스를 filteredRequests로 변경) */}
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
                {filteredRequests.map((req) => (
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
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      조건에 맞는 작업이 없습니다.
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