"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Line 
} from "recharts";
import { 
  ArrowTrendingUpIcon, ClockIcon, PlusIcon, ChartBarIcon 
} from "@heroicons/react/24/outline";
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { ClassData } from "@/types/academy";
import { ExamResultData } from "@/types/grade";

export default function DashboardAnalytics() {
  const { user } = useAuth();
  
  // 데이터 상태
  const [activityData, setActivityData] = useState<any[]>([]);
  const [scoreData, setScoreData] = useState<any[]>([]);
  
  // 로딩 상태
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [loadingScore, setLoadingScore] = useState(true);

  useEffect(() => {
    if (!user) return;

    // 1. 제작 활동 데이터 가져오기 (Requests)
    const fetchActivity = async () => {
      setLoadingActivity(true);
      try {
        const q = query(
          collection(db, "requests"),
          where("instructorId", "==", user.uid),
          orderBy("requestedAt", "asc") // 날짜순 정렬
        );
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          setActivityData([]);
        } else {
          // 월별 데이터 집계 로직
          const monthlyStats = new Map<string, { name: string, requests: number, completed: number }>();
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            const date = (data.requestedAt as Timestamp).toDate();
            const monthKey = `${date.getMonth() + 1}월`; // 예: "5월"

            if (!monthlyStats.has(monthKey)) {
              monthlyStats.set(monthKey, { name: monthKey, requests: 0, completed: 0 });
            }
            
            const stat = monthlyStats.get(monthKey)!;
            stat.requests += 1;
            if (data.status === 'completed') {
              stat.completed += 1;
            }
          });

          // 최근 6개월 데이터만 자르거나 전체 표시
          setActivityData(Array.from(monthlyStats.values()).slice(-6));
        }
      } catch (e) {
        console.error("활동 데이터 로딩 실패", e);
      } finally {
        setLoadingActivity(false);
      }
    };

    // 2. 성적 추이 데이터 가져오기 (Exam Results)
    const fetchScores = async () => {
      setLoadingScore(true);
      try {
        // A. 강사가 담당하는 반(Class) 목록 조회
        const classQuery = query(
          collection(db, "classes"),
          where("instructorId", "==", user.uid)
        );
        const classSnap = await getDocs(classQuery);
        
        if (classSnap.empty) {
          setScoreData([]);
          setLoadingScore(false);
          return;
        }

        const classIds = classSnap.docs.map(d => d.id);

        // B. 해당 반들의 성적 리포트 조회 (최근 10개)
        // Firestore 'in' 쿼리는 최대 10개까지만 가능하므로, 반이 많을 경우 로직 분리 필요
        // 여기서는 상위 10개 반에 대해서만 조회하거나, 전체 조회 후 필터링하는 방식을 사용
        // (안전하게 전체 조회 후 필터링 방식 사용 - 데이터량이 적을 때 유리)
        const resultQuery = query(
          collection(db, "exam_results"),
          orderBy("date", "asc")
        );
        
        const resultSnap = await getDocs(resultQuery);
        
        const myResults = resultSnap.docs
          .map(d => d.data() as ExamResultData)
          .filter(r => classIds.includes(r.classId)) // 내 반의 성적만 필터링
          .slice(-10) // 최근 10개 시험만
          .map(r => ({
            name: r.examTitle, // X축: 시험명
            avg: parseFloat(r.average.toFixed(1)), // Y축 1: 평균
            high: r.highest // Y축 2: 최고점
          }));

        setScoreData(myResults);

      } catch (e) {
        console.error("성적 데이터 로딩 실패", e);
      } finally {
        setLoadingScore(false);
      }
    };

    fetchActivity();
    fetchScores();
  }, [user]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      
      {/* 1. 작업 활동 분석 차트 */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-80">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-blue-600" />
              월별 컨텐츠 제작 현황
            </h3>
            <p className="text-xs text-slate-500 mt-1">최근 요청 및 완료된 작업 건수입니다.</p>
          </div>
        </div>
        
        <div className="flex-1 w-full min-h-0">
          {loadingActivity ? (
            <div className="h-full w-full bg-slate-50 animate-pulse rounded-xl" />
          ) : activityData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="requests" name="요청" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="completed" name="완료" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState 
              message="아직 작업 요청 내역이 없습니다."
              buttonText="첫 작업 요청하기"
              href="/request"
            />
          )}
        </div>
      </div>

      {/* 2. 성적 변화 추이 차트 */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-80">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ArrowTrendingUpIcon className="w-5 h-5 text-emerald-600" />
              성적 변화 추이 (평균)
            </h3>
            <p className="text-xs text-slate-500 mt-1">우리 반 학생들의 최근 시험 성적 변화입니다.</p>
          </div>
        </div>

        <div className="flex-1 w-full min-h-0">
          {loadingScore ? (
            <div className="h-full w-full bg-slate-50 animate-pulse rounded-xl" />
          ) : scoreData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scoreData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="avg" name="평균 점수" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAvg)" />
                <Line type="monotone" dataKey="high" name="최고점" stroke="#cbd5e1" strokeDasharray="5 5" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState 
              message="등록된 성적 데이터가 없습니다."
              buttonText="성적 리포트 입력하기"
              href="/manage/reports"
            />
          )}
        </div>
      </div>

    </div>
  );
}

// 빈 상태 UI 컴포넌트 (내부용)
function EmptyState({ message, buttonText, href }: { message: string, buttonText: string, href: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4">
      <ChartBarIcon className="w-8 h-8 text-slate-300 mb-2" />
      <p className="text-sm text-slate-500 font-medium mb-4">{message}</p>
      <Link 
        href={href}
        className="inline-flex items-center gap-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm"
      >
        <PlusIcon className="w-3 h-3" />
        {buttonText}
      </Link>
    </div>
  );
}