// app/(app)/admin/business/page.tsx

"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { 
  CurrencyDollarIcon, UserGroupIcon, ArrowTrendingUpIcon, 
  CreditCardIcon, LightBulbIcon, ChartBarIcon, PresentationChartLineIcon
} from "@heroicons/react/24/outline";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area, ComposedChart 
} from "recharts";
import { CardSkeleton } from "@/components/SkeletonLoader";

// --- 타입 정의 ---
interface PaymentData {
  id: string;
  amount: number;
  status: string;
  method: string;
  approvedAt: string; 
  userId: string;
}

interface UserData {
  uid: string;
  plan: string;
  subscriptionStatus?: string;
  createdAt: any; // Timestamp
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function BusinessPage() {
  const { user, loading } = useAuth();
  
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'retention' | 'tools'>('overview');

  useEffect(() => {
    if (loading) return;
    if (!user?.isAdmin) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const payQ = query(collection(db, "payments"), orderBy("approvedAt", "desc"));
        const paySnap = await getDocs(payQ);
        setPayments(paySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentData)));

        const userQ = query(collection(db, "users"));
        const userSnap = await getDocs(userQ);
        setUsers(userSnap.docs.map(doc => ({
          uid: doc.id,
          plan: doc.data().plan || 'FREE',
          subscriptionStatus: doc.data().subscriptionStatus,
          createdAt: doc.data().createdAt
        } as UserData)));
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user, loading]);

  // --- [고급 분석 로직] ---

  // 1. KPI 지표
  const kpi = useMemo(() => {
    const activeUsers = users.filter(u => u.subscriptionStatus === 'ACTIVE' || u.subscriptionStatus === 'TRIAL');
    const totalSubscribers = activeUsers.length;
    
    // 이탈률 (Churn Rate): 전체 유저 중 해지/실패 상태 비율
    const churnedUsers = users.filter(u => ['CANCELED', 'PAYMENT_FAILED'].includes(u.subscriptionStatus || ''));
    const churnRate = users.length > 0 ? (churnedUsers.length / users.length) * 100 : 0;

    // 예상 MRR
    const activeBasic = activeUsers.filter(u => u.plan === 'BASIC').length;
    const activeStudent = activeUsers.filter(u => u.plan?.startsWith('STD')).length;
    const mrr = (activeBasic * 198000) + (activeStudent * 19900);

    return { mrr, totalSubscribers, churnRate, activeBasic, activeStudent };
  }, [users]);

  // 2. LTV (Life Time Value) 분석
  // 유저별 총 결제액 평균
  const ltvData = useMemo(() => {
    const userRevenue: Record<string, number> = {};
    payments.forEach(p => {
      if (p.status === 'DONE') {
        userRevenue[p.userId] = (userRevenue[p.userId] || 0) + p.amount;
      }
    });

    // 플랜별 LTV 평균 계산
    const planStats: Record<string, { total: number, count: number }> = {
      'BASIC': { total: 0, count: 0 },
      'MAKERS': { total: 0, count: 0 },
      'STUDENT': { total: 0, count: 0 }
    };

    users.forEach(u => {
      const rev = userRevenue[u.uid] || 0;
      if (rev > 0) {
        if (u.plan === 'BASIC') { planStats.BASIC.total += rev; planStats.BASIC.count++; }
        else if (u.plan === 'MAKERS') { planStats.MAKERS.total += rev; planStats.MAKERS.count++; }
        else if (u.plan?.startsWith('STD')) { planStats.STUDENT.total += rev; planStats.STUDENT.count++; }
      }
    });

    return [
      { name: 'Basic Plan', ltv: planStats.BASIC.count ? Math.round(planStats.BASIC.total / planStats.BASIC.count) : 0 },
      { name: "Maker's Plan", ltv: planStats.MAKERS.count ? Math.round(planStats.MAKERS.total / planStats.MAKERS.count) : 0 },
      { name: 'Student Plan', ltv: planStats.STUDENT.count ? Math.round(planStats.STUDENT.total / planStats.STUDENT.count) : 0 },
    ];
  }, [users, payments]);

  // 3. 코호트(Cohort) 잔존율 분석 (간이 시뮬레이션)
  // 가입 월별로 그룹화 -> 현재 활성 상태인 비율 계산
  const cohortData = useMemo(() => {
    const cohorts: Record<string, { total: number, active: number }> = {};
    
    users.forEach(u => {
      if (!u.createdAt) return;
      const date = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!cohorts[key]) cohorts[key] = { total: 0, active: 0 };
      cohorts[key].total++;
      if (u.subscriptionStatus === 'ACTIVE' || u.subscriptionStatus === 'TRIAL') {
        cohorts[key].active++;
      }
    });

    return Object.entries(cohorts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, stats]) => ({
        month,
        retention: stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0,
        total: stats.total
      }))
      .slice(-6); // 최근 6개월
  }, [users]);

  // 4. AI Expert Analysis (데이터 기반 텍스트 생성)
  const expertInsight = useMemo(() => {
    const insights = [];
    
    // 매출 분석
    if (kpi.mrr > 5000000) insights.push("✅ MRR이 안정권에 진입했습니다. 마케팅 예산을 증액하여 스케일업을 고려해보세요.");
    else insights.push("⚠️ 초기 매출 확보가 필요합니다. 무료 체험 전환율을 점검해보세요.");

    // 이탈률 분석
    if (kpi.churnRate > 10) insights.push("⚠️ 이탈률이 10%를 넘었습니다. 결제 실패 유저에 대한 리타겟팅이 시급합니다.");
    else insights.push("✅ 낮은 이탈률을 유지하고 있습니다. 현재 서비스 만족도가 높은 편입니다.");

    // LTV 분석
    const maxLtvPlan = ltvData.reduce((prev, current) => (prev.ltv > current.ltv) ? prev : current);
    insights.push(`💎 가장 가치 있는 고객군은 '${maxLtvPlan.name}'입니다. (평균 LTV: ${maxLtvPlan.ltv.toLocaleString()}원)`);

    return insights;
  }, [kpi, ltvData]);


  if (loading || !user?.isAdmin) return <div className="p-10 text-center">권한 확인 중...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <div className="max-w-7xl mx-auto">
        
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <PresentationChartLineIcon className="w-8 h-8 text-amber-500" />
              비즈니스 인사이트
            </h1>
            <p className="text-slate-500 mt-1">데이터 기반의 의사결정을 위한 핵심 지표 및 전문 분석</p>
          </div>
          
          <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
             {['overview', 'retention'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    activeTab === tab 
                      ? 'bg-slate-900 text-white shadow' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {tab === 'overview' && '통합 대시보드'}
                  {tab === 'retention' && '회원 가치 분석 (LTV)'}
                </button>
             ))}
          </div>
        </div>

        {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <CardSkeleton /><CardSkeleton /><CardSkeleton />
            </div>
        ) : (
            <>
                {/* === [공통] Expert Insight Section === 
                  어떤 탭에 있든 가장 중요한 인사이트를 상단에 노출
                */}
                <div className="mb-8 bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <LightBulbIcon className="w-32 h-32 text-yellow-300" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-yellow-400">
                            <SparklesIcon className="w-5 h-5" /> AI Expert Insight
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            {expertInsight.map((text, idx) => (
                                <div key={idx} className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/10 text-sm leading-relaxed">
                                    {text}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* === [탭 1] 통합 대시보드 === */}
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <StatCard title="예상 월 매출 (MRR)" value={`₩ ${(kpi.mrr / 10000).toLocaleString()}만`} color="text-emerald-600" bg="bg-emerald-50" />
                            <StatCard title="총 구독자 수" value={`${kpi.totalSubscribers}명`} color="text-blue-600" bg="bg-blue-50" />
                            <StatCard title="평균 이탈률" value={`${kpi.churnRate.toFixed(1)}%`} color="text-red-600" bg="bg-red-50" />
                            <StatCard title="Basic 회원" value={`${kpi.activeBasic}명`} color="text-indigo-600" bg="bg-indigo-50" />
                        </div>

                        {/* 매출 & 유저 혼합 차트 */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-96">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <ChartBarIcon className="w-5 h-5 text-slate-500" /> 월별 가입자 잔존율 (Cohort Trend)
                            </h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={cohortData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="month" scale="point" padding={{ left: 20, right: 20 }} tick={{fontSize: 12}} />
                                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" label={{ value: '잔존율(%)', angle: -90, position: 'insideLeft' }} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" label={{ value: '가입자(명)', angle: 90, position: 'insideRight' }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px' }} />
                                    <Legend />
                                    <Bar yAxisId="right" dataKey="total" name="신규 가입" barSize={20} fill="#413ea0" radius={[4,4,0,0]} />
                                    <Line yAxisId="left" type="monotone" dataKey="retention" name="잔존율(%)" stroke="#ff7300" strokeWidth={3} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* === [탭 2] 회원 가치 분석 (LTV) === */}
                {activeTab === 'retention' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* LTV 차트 */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-80">
                                <h3 className="font-bold text-slate-800 mb-4">플랜별 고객 생애 가치 (LTV)</h3>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={ltvData} layout="vertical" margin={{ left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" tickFormatter={(val)=>`₩${val/10000}만`} />
                                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fontWeight: 'bold'}} />
                                        <Tooltip formatter={(val: number)=>`${val.toLocaleString()}원`} cursor={{fill: 'transparent'}} />
                                        <Bar dataKey="ltv" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={30}>
                                            {ltvData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* 코호트 테이블 */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-80 overflow-auto custom-scrollbar">
                                <h3 className="font-bold text-slate-800 mb-4">월별 가입자 상세 현황</h3>
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0">
                                        <tr>
                                            <th className="p-3 rounded-l-lg">가입월</th>
                                            <th className="p-3 text-right">총 가입</th>
                                            <th className="p-3 text-right">현재 활성</th>
                                            <th className="p-3 text-right rounded-r-lg">잔존율</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {cohortData.map((row) => (
                                            <tr key={row.month} className="hover:bg-slate-50">
                                                <td className="p-3 font-medium text-slate-900">{row.month}</td>
                                                <td className="p-3 text-right">{row.total}명</td>
                                                <td className="p-3 text-right text-blue-600 font-bold">{Math.round((row.retention/100)*row.total)}명</td>
                                                <td className="p-3 text-right">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                        row.retention >= 80 ? 'bg-green-100 text-green-700' :
                                                        row.retention >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                        {row.retention}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, subValue, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        {Icon && <div className={`p-2 rounded-lg ${bg} ${color}`}><Icon className="w-5 h-5" /></div>}
      </div>
      <div>
        <h3 className={`text-2xl font-black ${color} tracking-tight`}>{value}</h3>
        {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
      </div>
    </div>
  );
}

function SparklesIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM6.97 11.03a.75.75 0 111.06 1.06l-1.06 1.06a.75.75 0 11-1.06-1.06l1.06-1.06z" clipRule="evenodd" />
        </svg>
    )
}