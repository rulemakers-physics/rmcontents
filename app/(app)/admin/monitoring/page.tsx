"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, query, where, orderBy, onSnapshot, Timestamp 
} from "firebase/firestore";
import { 
  MagnifyingGlassIcon, 
  ArrowPathIcon,
  FunnelIcon,
  ChartBarIcon,
  UserIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import { UserData } from "@/types/user";
import { SavedExam } from "@/types/exam";

interface InstructorActivity extends UserData {
  todayCount: number;
  weekCount: number;
  lastActiveAt: Date | null;
  recentExamTitle: string;
}

export default function AdminMonitoringPage() {
  const { user, loading } = useAuth();
  
  const [instructors, setInstructors] = useState<UserData[]>([]);
  const [recentExams, setRecentExams] = useState<SavedExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<'today' | 'recent' | 'name'>('today');

  // 1. 강사 목록 로드
  useEffect(() => {
    if (!user?.isAdmin) return;

    const qUsers = query(
      collection(db, "users"),
      where("role", "in", ["instructor", "director"])
    );

    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ 
        uid: doc.id, 
        ...doc.data() 
      } as UserData));
      setInstructors(list);
    });

    return () => unsubscribeUsers();
  }, [user]);

  // 2. 시험지 생성 활동 로드 (범위를 30일로 확장)
  useEffect(() => {
    if (!user?.isAdmin) return;

    // [핵심 변경] "마지막 활동"을 더 잘 보여주기 위해 조회 범위를 30일로 넉넉하게 잡음
    const now = new Date();
    const rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    rangeStart.setHours(0, 0, 0, 0);

    const qExams = query(
      collection(db, "saved_exams"),
      where("createdAt", ">=", Timestamp.fromDate(rangeStart)),
      orderBy("createdAt", "desc")
    );

    const unsubscribeExams = onSnapshot(qExams, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as SavedExam));
      setRecentExams(list);
      setIsLoading(false);
    });

    return () => unsubscribeExams();
  }, [user]);

  // 3. 데이터 집계
  const monitoredData = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 최근 7일 기준점 (JS에서 정확히 필터링)
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    // 집계용 Map 초기화
    // [버그 수정] weekCount로 속성명 통일
    const statsMap = new Map<string, { todayCount: number, weekCount: number, lastDate: Date | null, lastTitle: string }>();

    recentExams.forEach(exam => {
      const userId = exam.userId || exam.ownerId; 
      if (!userId) return;

      if (!statsMap.has(userId)) {
        statsMap.set(userId, { todayCount: 0, weekCount: 0, lastDate: null, lastTitle: "" });
      }
      
      const stat = statsMap.get(userId)!;
      const examDate = (exam.createdAt as Timestamp).toDate();

      // [통계 1] 최근 7일 카운트 (30일치 데이터 중 7일 이내만 집계)
      if (examDate >= weekStart) {
        stat.weekCount += 1;
      }

      // [통계 2] 오늘 카운트
      if (examDate >= todayStart) {
        stat.todayCount += 1;
      }

      // [통계 3] 마지막 활동 (정렬되어 있으므로 가장 먼저 만나는 것이 최신)
      if (!stat.lastDate) {
        stat.lastDate = examDate;
        stat.lastTitle = exam.title;
      }
    });

    // 강사 목록에 통계 매핑
    let result: InstructorActivity[] = instructors.map(inst => {
      const stat = statsMap.get(inst.uid) || { todayCount: 0, weekCount: 0, lastDate: null, lastTitle: "-" };
      return {
        ...inst,
        todayCount: stat.todayCount,
        weekCount: stat.weekCount,
        lastActiveAt: stat.lastDate,
        recentExamTitle: stat.lastTitle
      };
    });

    // 필터링
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(r => 
        (r.name?.toLowerCase() || "").includes(lower) ||
        (r.academy?.toLowerCase() || "").includes(lower) ||
        (r.email?.toLowerCase() || "").includes(lower)
      );
    }

    // 정렬
    result.sort((a, b) => {
      if (sortKey === 'today') return b.todayCount - a.todayCount;
      if (sortKey === 'recent') {
        const timeA = a.lastActiveAt?.getTime() || 0;
        const timeB = b.lastActiveAt?.getTime() || 0;
        return timeB - timeA;
      }
      return (a.name || "").localeCompare(b.name || "");
    });

    return result;
  }, [instructors, recentExams, searchTerm, sortKey]);

  const totalTodayCreated = useMemo(() => {
    return monitoredData.reduce((acc, curr) => acc + curr.todayCount, 0);
  }, [monitoredData]);

  if (loading || !user?.isAdmin) return <div className="p-8 text-center">권한 확인 중...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <div className="max-w-7xl mx-auto">
        
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ChartBarIcon className="w-8 h-8 text-indigo-600" />
              강사 생성 활동 모니터링
            </h1>
            <p className="text-slate-500 mt-1">
              최근 30일간의 활동을 기반으로 이상 징후를 파악합니다.
            </p>
          </div>

          <div className="bg-white px-6 py-3 rounded-2xl border border-indigo-100 shadow-sm flex items-center gap-4">
             <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
               <ArrowPathIcon className="w-6 h-6" />
             </div>
             <div>
               <p className="text-xs font-bold text-slate-400 uppercase">Today Created</p>
               <p className="text-2xl font-black text-slate-900">{totalTodayCreated}건</p>
             </div>
          </div>
        </div>

        {/* 툴바 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-80">
            <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="강사명, 학원명, 이메일 검색"
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <FunnelIcon className="w-4 h-4" /> 정렬:
            </span>
            <select 
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="today">오늘 활동순</option>
              <option value="recent">최근 활동순</option>
              <option value="name">이름순</option>
            </select>
          </div>
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">강사 정보</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">소속 (학원)</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50/50">오늘 생성</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">최근 7일</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">마지막 활동</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400">데이터를 불러오는 중입니다...</td>
                  </tr>
                ) : monitoredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400">조건에 맞는 강사가 없습니다.</td>
                  </tr>
                ) : (
                  monitoredData.map((inst) => (
                    <tr key={inst.uid} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold border border-slate-200">
                            {inst.name?.[0] || <UserIcon className="w-5 h-5"/>}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{inst.name}</p>
                            <p className="text-xs text-slate-500">{inst.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-700">{inst.academy || "-"}</span>
                        <span className="block text-xs text-slate-400">{inst.role}</span>
                      </td>
                      <td className={`px-6 py-4 text-center font-black text-lg ${inst.todayCount > 0 ? 'text-indigo-600 bg-indigo-50/30' : 'text-slate-300'}`}>
                        {inst.todayCount}
                        {inst.todayCount >= 30 && (
                          <span className="block text-[10px] text-red-500 font-bold animate-pulse">주의: 과다 생성</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-600">
                        {inst.weekCount}
                      </td>
                      <td className="px-6 py-4">
                        {inst.lastActiveAt ? (
                          <div>
                            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                              <ClockIcon className="w-4 h-4 text-slate-400" />
                              {inst.lastActiveAt.toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px]" title={inst.recentExamTitle}>
                              {inst.recentExamTitle}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}