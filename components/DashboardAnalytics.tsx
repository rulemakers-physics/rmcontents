"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Line, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { 
  ArrowTrendingUpIcon, ClockIcon, PlusIcon, ChartBarIcon, 
  ChartPieIcon, FunnelIcon, CalendarDaysIcon 
} from "@heroicons/react/24/outline";
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { ExamResultData } from "@/types/grade";
import { subMonths, isAfter, startOfDay } from "date-fns"; // 날짜 계산 라이브러리

// 차트 색상 팔레트 (Professional Tone)
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const RADAR_COLORS = { stroke: '#8884d8', fill: '#8884d8' };

export default function DashboardAnalytics() {
  const { user } = useAuth();
  
  // --- 상태 관리 ---
  const [period, setPeriod] = useState<1 | 3 | 6>(6); // 기본값: 6개월
  const [loading, setLoading] = useState(true);

  // 차트 데이터 상태
  const [rawRequests, setRawRequests] = useState<any[]>([]); // 필터링 전 원본 요청 데이터
  const [scoreData, setScoreData] = useState<any[]>([]);
  const [topicData, setTopicData] = useState<any[]>([]); 
  const [difficultyData, setDifficultyData] = useState<any[]>([]); 

  // 1. 데이터 로드 (최초 1회 실행)
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // A. [활동 내역] Requests 가져오기 (최근 1년치 넉넉하게 로드 후 클라이언트 필터링)
        const requestQ = query(
          collection(db, "requests"),
          where("instructorId", "==", user.uid),
          orderBy("requestedAt", "desc"), // 최신순
          limit(100) // 적절한 제한
        );
        const reqSnap = await getDocs(requestQ);
        const requests = reqSnap.docs.map(doc => doc.data());
        setRawRequests(requests);

        // B. [성적 추이] Exam Results 가져오기
        // (강사가 담당하는 반의 성적)
        const classQ = query(collection(db, "classes"), where("instructorId", "==", user.uid));
        const classSnap = await getDocs(classQ);
        const classIds = classSnap.docs.map(d => d.id);

        if (classIds.length > 0) {
          // Firestore 'in' 쿼리는 최대 10개 제한이 있으므로, 반이 많으면 로직 분리 필요 (여기선 단순화)
          // 전체 성적 중 내 반인 것만 필터링하는 방식 (데이터 양이 적을 때 유효)
          const resultQuery = query(collection(db, "exam_results"), orderBy("date", "asc"));
          const resultSnap = await getDocs(resultQuery);
          
          const myResults = resultSnap.docs
            .map(d => d.data() as ExamResultData)
            .filter(r => classIds.includes(r.classId))
            .slice(-10); // 최근 10개 시험

          setScoreData(myResults.map(r => ({
            name: r.examTitle,
            avg: parseFloat(r.average.toFixed(1)),
            high: r.highest
          })));
        }

        // C. [단원/난이도 분석] Saved Exams (내가 만든 시험지) 분석
        const examQ = query(
          collection(db, "saved_exams"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(20) // 최근 20개 시험지 분석
        );
        const examSnap = await getDocs(examQ);
        
        const topicCounts: Record<string, number> = {};
        const diffCounts: Record<string, number> = {};

        examSnap.forEach(doc => {
          const exam = doc.data();
          if (exam.problems && Array.isArray(exam.problems)) {
            exam.problems.forEach((p: any) => {
              // 단원 집계
              if (p.majorTopic) {
                const topic = p.majorTopic.split('.').pop()?.trim() || p.majorTopic; // "1. 역학" -> "역학"
                topicCounts[topic] = (topicCounts[topic] || 0) + 1;
              }
              // 난이도 집계
              if (p.difficulty) {
                diffCounts[p.difficulty] = (diffCounts[p.difficulty] || 0) + 1;
              }
            });
          }
        });

        // 차트용 데이터 변환 (단원)
        // 값이 큰 순서로 정렬 후 상위 6개만 표시 (Radar 차트 가독성 위해)
        const sortedTopics = Object.entries(topicCounts)
          .map(([subject, count]) => ({ subject, count, fullMark: Math.max(...Object.values(topicCounts)) }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);
        setTopicData(sortedTopics);

        // 차트용 데이터 변환 (난이도)
        const diffOrder = ['최상', '상', '중', '하', '최하']; // 정렬 순서
        const sortedDiffs = Object.entries(diffCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => diffOrder.indexOf(a.name) - diffOrder.indexOf(b.name));
        setDifficultyData(sortedDiffs);

      } catch (e) {
        console.error("대시보드 데이터 로딩 실패", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // 2. 기간 필터링 로직 (Memoization)
  const activityData = useMemo(() => {
    if (rawRequests.length === 0) return [];

    const now = new Date();
    const startDate = startOfDay(subMonths(now, period)); // n개월 전 날짜

    // 기간 내 데이터 필터링
    const filtered = rawRequests.filter(req => {
      const reqDate = (req.requestedAt as Timestamp).toDate();
      return isAfter(reqDate, startDate);
    });

    // 월별로 그룹핑
    const monthlyStats = new Map<string, { name: string, requests: number, completed: number }>();
    
    // 빈 달도 0으로 채우기 위해 루프
    for (let i = period - 1; i >= 0; i--) {
      const d = subMonths(now, i);
      const key = `${d.getMonth() + 1}월`;
      monthlyStats.set(key, { name: key, requests: 0, completed: 0 });
    }

    filtered.forEach(req => {
      const date = (req.requestedAt as Timestamp).toDate();
      const key = `${date.getMonth() + 1}월`;
      
      if (monthlyStats.has(key)) {
        const stat = monthlyStats.get(key)!;
        stat.requests += 1;
        if (req.status === 'completed') stat.completed += 1;
      }
    });

    return Array.from(monthlyStats.values());
  }, [rawRequests, period]);


  if (loading) return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="h-80 bg-slate-100 rounded-2xl animate-pulse" />
      <div className="h-80 bg-slate-100 rounded-2xl animate-pulse" />
    </div>
  );

  return (
    <div className="space-y-6 mb-8">
      
      {/* 1열: 활동 & 성적 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* A. 활동 분석 차트 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-96">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-blue-600" />
                월별 컨텐츠 제작 현황
              </h3>
              <p className="text-xs text-slate-500 mt-1">최근 요청 및 완료된 작업 건수</p>
            </div>
            {/* 기간 필터 버튼 */}
            <div className="flex bg-slate-100 rounded-lg p-1">
              {[1, 3, 6].map((m) => (
                <button
                  key={m}
                  onClick={() => setPeriod(m as 1 | 3 | 6)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    period === m 
                      ? "bg-white text-blue-600 shadow-sm" 
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {m}개월
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-0">
            {activityData.some(d => d.requests > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                  <Bar dataKey="requests" name="요청" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="completed" name="완료" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="해당 기간의 활동 내역이 없습니다." href="/request" btnText="작업 요청하기" />
            )}
          </div>
        </div>

        {/* B. 성적 추이 차트 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-96">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ArrowTrendingUpIcon className="w-5 h-5 text-emerald-600" />
                반 평균 성적 추이
              </h3>
              <p className="text-xs text-slate-500 mt-1">최근 시험(10회) 성적 변화 그래프</p>
            </div>
          </div>

          <div className="flex-1 w-full min-h-0">
            {scoreData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={10} interval="preserveStartEnd" />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="avg" name="평균" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAvg)" />
                  <Line type="monotone" dataKey="high" name="최고점" stroke="#cbd5e1" strokeDasharray="5 5" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="등록된 성적 데이터가 없습니다." href="/manage/reports" btnText="성적 입력하기" />
            )}
          </div>
        </div>
      </div>

      {/* 2열: 단원 분석 & 난이도 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* C. 단원별 출제 분포 (Radar) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-80">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5 text-indigo-600" />
                단원별 출제 빈도
              </h3>
              <p className="text-xs text-slate-500 mt-1">내가 생성한 시험지에서 가장 많이 출제된 단원</p>
            </div>
          </div>
          
          <div className="flex-1 w-full flex items-center justify-center">
            {topicData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={topicData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                  <Radar name="출제 수" dataKey="count" stroke={RADAR_COLORS.stroke} strokeWidth={3} fill={RADAR_COLORS.fill} fillOpacity={0.4} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="생성된 시험지가 없습니다." href="/service/maker" btnText="시험지 만들기" />
            )}
          </div>
        </div>

        {/* D. 난이도 분포 (Pie) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-80">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ChartPieIcon className="w-5 h-5 text-orange-500" />
                문항 난이도 비율
              </h3>
              <p className="text-xs text-slate-500 mt-1">최근 생성된 문항들의 난이도 구성</p>
            </div>
          </div>

          <div className="flex-1 w-full relative">
            {difficultyData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={difficultyData}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {difficultyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
                {/* 중앙 텍스트 */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] text-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-800">
                    {difficultyData.reduce((acc, cur) => acc + cur.value, 0)}
                  </span>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Total</p>
                </div>
              </>
            ) : (
              <EmptyState message="데이터 없음" href="/service/maker" btnText="생성" />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// 재사용 UI 컴포넌트: Empty State
function EmptyState({ message, href, btnText }: { message: string, href: string, btnText: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-4">
      <FunnelIcon className="w-8 h-8 text-slate-300 mb-2" />
      <p className="text-sm text-slate-500 font-medium mb-4">{message}</p>
      <Link 
        href={href}
        className="inline-flex items-center gap-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm"
      >
        <PlusIcon className="w-3 h-3" /> {btnText}
      </Link>
    </div>
  );
}