// app/(app)/admin/page.tsx

"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { 
  ClipboardDocumentCheckIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  UserGroupIcon,
  ArrowRightIcon,
  ListBulletIcon,
  ArchiveBoxIcon
} from "@heroicons/react/24/outline";
import { ChartBarIcon } from "@heroicons/react/24/solid";

interface RequestData {
  id: string;
  title: string;
  instructorName: string;
  academy: string;
  status: "requested" | "in_progress" | "completed" | "rejected";
  requestedAt: Timestamp;
  contentKind: string;
  unreadCountAdmin?: number;
}

export default function AdminDashboardPage() {
  const { user, loading } = useAuth();
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user || !user.isAdmin) return;

    // 전체 데이터 로드 (통계용)
    const q = query(collection(db, "requests"), orderBy("requestedAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RequestData));
      setRequests(list);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, loading]);

  const stats = useMemo(() => {
    const total = requests.length;
    const requested = requests.filter(r => r.status === 'requested').length;
    const inProgress = requests.filter(r => r.status === 'in_progress').length;
    const completed = requests.filter(r => r.status === 'completed').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;

    const instructorMap = new Map<string, { count: number, academy: string }>();
    requests.forEach(r => {
      const current = instructorMap.get(r.instructorName) || { count: 0, academy: r.academy };
      instructorMap.set(r.instructorName, { count: current.count + 1, academy: r.academy });
    });
    
    const instructorStats = Array.from(instructorMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);

    return { total, requested, inProgress, completed, rejected, instructorStats };
  }, [requests]);

  if (loading || isLoading) return <div className="p-8 text-center">데이터 분석 중...</div>;
  if (!user?.isAdmin) return <div className="p-8 text-center">접근 권한이 없습니다.</div>;

  return (
    <div className="p-8 space-y-8 bg-gray-50/50 min-h-full">
      
      {/* 1. 헤더 및 빠른 이동 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ChartBarIcon className="w-8 h-8 text-blue-600" />
            관리자 대시보드
          </h1>
          <p className="text-slate-500 mt-1">전체 작업 현황을 모니터링하고 관리합니다.</p>
        </div>
        <div className="flex gap-3">
           <Link 
             href="/admin/active" 
             className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all active:scale-95"
           >
             <ListBulletIcon className="w-4 h-4" />
             접수된 작업 관리
           </Link>
           <Link 
             href="/admin/completed" 
             className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 hover:text-slate-900 transition-all"
           >
             <ArchiveBoxIcon className="w-4 h-4" />
             완료/반려 내역
           </Link>
        </div>
      </div>

      {/* 2. 핵심 지표 카드 (통계 표시 방식 수정됨: % 위주) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="신규 접수" 
          count={stats.requested} 
          total={stats.total} 
          icon={ClipboardDocumentCheckIcon} 
          color="text-red-600" 
          bg="bg-red-50" 
          subTextLabel="건 대기 중"
        />
        <StatCard 
          title="작업 진행 중" 
          count={stats.inProgress} 
          total={stats.total} 
          icon={ClockIcon} 
          color="text-yellow-600" 
          bg="bg-yellow-50" 
          subTextLabel="건 작업 중"
        />
        <StatCard 
          title="작업 완료" 
          count={stats.completed} 
          total={stats.total} 
          icon={CheckCircleIcon} 
          color="text-green-600" 
          bg="bg-green-50" 
          subTextLabel="건 완료됨"
        />
        <StatCard 
          title="반려됨" 
          count={stats.rejected} 
          total={stats.total} 
          icon={XCircleIcon} 
          color="text-gray-500" 
          bg="bg-gray-100" 
          subTextLabel="건 반려됨"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 3. 최근 접수된 작업 (상위 5개 + 전체보기 링크) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800">🚀 최근 접수된 작업</h3>
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold">Live</span>
            </div>
            <Link href="/admin/active" className="text-xs font-medium text-slate-500 hover:text-blue-600 flex items-center gap-1">
              전체 보기 <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {/* requested 또는 in_progress 상태인 최근 5개 항목만 표시 */}
            {requests.filter(r => r.status === 'requested' || r.status === 'in_progress').slice(0, 5).map((req) => (
              <div key={req.id} className="px-6 py-4 hover:bg-blue-50/30 transition-colors flex items-center justify-between group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                      req.status === 'requested' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-yellow-50 text-yellow-600 border-yellow-100'
                    }`}>
                      {req.status === 'requested' ? '접수됨' : '작업중'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {req.requestedAt.toDate().toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 truncate pr-4">{req.title}</h4>
                  <p className="text-xs text-slate-500 truncate">
                    {req.instructorName} ({req.academy}) · {req.contentKind}
                  </p>
                </div>
                <Link 
                  href={`/admin/request/${req.id}`}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
                >
                  상세보기 <ArrowRightIcon className="w-3 h-3" />
                </Link>
              </div>
            ))}
            {requests.filter(r => r.status === 'requested' || r.status === 'in_progress').length === 0 && (
               <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
                 <ClipboardDocumentCheckIcon className="w-12 h-12 mb-2 opacity-20" />
                 <p className="text-sm">현재 대기 중인 작업이 없습니다.</p>
               </div>
            )}
          </div>
        </div>

        {/* 4. 강사별 요청 통계 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-fit">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
            <UserGroupIcon className="w-5 h-5 text-slate-500" />
            <h3 className="font-bold text-slate-800">강사별 요청 순위</h3>
          </div>
          <div className="p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-3 w-10">#</th>
                  <th className="py-3">강사명</th>
                  <th className="px-6 py-3 text-right">건수</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.instructorStats.slice(0, 10).map((stat, idx) => (
                  <tr key={stat.name} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-slate-400 text-xs">{idx + 1}</td>
                    <td className="py-3">
                      <div className="font-bold text-slate-700">{stat.name}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{stat.academy}</div>
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-blue-600">
                      {stat.count}
                    </td>
                  </tr>
                ))}
                {stats.instructorStats.length === 0 && (
                  <tr><td colSpan={3} className="p-6 text-center text-slate-400 text-xs">데이터가 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

// [수정됨] 통계 카드 컴포넌트 (비율을 크게, 건수를 작게)
function StatCard({ title, count, total, icon: Icon, color, bg, subTextLabel }: any) {
  // 비율 계산 (total이 0일 때 0% 처리)
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
      {/* 배경 아이콘 장식 */}
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110`}>
        <Icon className={`w-16 h-16 ${color}`} />
      </div>
      
      <div>
        <p className="text-sm font-medium text-slate-500 mb-2">{title}</p>
        {/* 비율을 메인으로 표시 */}
        <h3 className={`text-4xl font-extrabold ${color} tracking-tight`}>
          {percentage}%
        </h3>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {/* 건수를 보조 정보로 표시 */}
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${bg} ${color}`}>
           {count}
        </span>
        <span className="text-xs font-medium text-slate-500">{subTextLabel}</span>
      </div>
    </div>
  );
}