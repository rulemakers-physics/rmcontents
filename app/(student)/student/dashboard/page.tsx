// app/(student)/student/dashboard/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { 
  collection, query, where, orderBy, limit, getDocs, Timestamp 
} from "firebase/firestore";
import { 
  FireIcon, TrophyIcon, BoltIcon, ClockIcon, 
  ChevronRightIcon, CheckCircleIcon, PlayIcon, BookOpenIcon 
} from "@heroicons/react/24/solid";
import { toast } from "react-hot-toast";

// 타입 정의 (추후 types 폴더로 이동 권장)
interface StudentExamHistory {
  id: string;
  title: string;
  score: number;
  totalQuestions: number;
  createdAt: Timestamp;
}

interface RankingUser {
  name: string;
  score: number; // coins 또는 별도 포인트 필드 사용
}

export default function StudentDashboard() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  // 상태 관리
  const [recentExams, setRecentExams] = useState<StudentExamHistory[]>([]);
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [dailyQuestId, setDailyQuestId] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // D-Day (하드코딩 대신 추후 사용자 설정으로 변경 가능)
  const dDayDate = new Date("2025-04-28");
  const today = new Date();
  const diffDays = Math.ceil((dDayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  useEffect(() => {
    if (!user || !userData) return;

    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        // 1. 최근 학습 기록 가져오기 (student_exams)
        const examsQ = query(
          collection(db, "student_exams"),
          where("userId", "==", user.uid),
          where("status", "==", "completed"),
          orderBy("createdAt", "desc"),
          limit(3)
        );
        const examsSnap = await getDocs(examsQ);
        const exams = examsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as StudentExamHistory));
        setRecentExams(exams);

        // 2. 학교 랭킹 가져오기 (같은 학교, 점수순)
        if (userData.school) {
          const rankQ = query(
            collection(db, "users"),
            where("role", "==", "student"),
            where("school", "==", userData.school),
            orderBy("coins", "desc"), // 코인을 점수 대용으로 사용 (또는 totalScore 필드 추가)
            limit(5)
          );
          const rankSnap = await getDocs(rankQ);
          const rankList = rankSnap.docs.map(doc => ({
            name: doc.data().name,
            score: doc.data().coins || 0
          }));
          setRanking(rankList);
        }

      } catch (e) {
        console.error("대시보드 데이터 로딩 실패", e);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [user, userData]);

  // 오늘의 미션 생성 (간소화: 학습하기 페이지로 연결)
  const handleDailyQuest = () => {
    if (!userData?.targetUnit) {
      toast.error("프로필에서 '집중 학습 단원'을 먼저 설정해주세요!");
      router.push("/student/profile");
      return;
    }
    // 실제로는 여기서 문제를 바로 생성하거나, Study 페이지에 파라미터를 넘깁니다.
    router.push(`/student/study?mode=daily&unit=${encodeURIComponent(userData.targetUnit)}`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* 1. Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h1 className="text-3xl font-extrabold text-slate-900">
              반가워요, <span className="text-emerald-600">{userData?.name}</span> 학생! 👋
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
              <span className="font-bold text-slate-800">{userData?.school}</span> 1등급을 향한 여정, 오늘도 힘내세요!
            </p>
          </div>
          
          <div className="flex gap-3">
             <div className="bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase">My Target</span>
                <span className="font-bold text-emerald-600">{userData?.targetUnit || "미설정"}</span>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* === Left Column (Main) === */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* A. Daily Quest Card */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-xl group">
              {/* Background Effects */}
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/30 rounded-full blur-3xl group-hover:bg-emerald-500/40 transition-colors duration-700" />
              <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-3 backdrop-blur-md">
                      <BoltIcon className="w-3.5 h-3.5" /> 오늘의 미션
                    </div>
                    <h2 className="text-3xl font-bold mb-1">Daily Quest</h2>
                    <p className="text-slate-400">
                      {userData?.targetUnit 
                        ? `${userData.targetUnit} 핵심 유형 3문제가 도착했습니다.` 
                        : "학습 단원을 설정하고 미션을 받아보세요."}
                    </p>
                  </div>
                  {/* Streak Badge */}
                  <div className="text-center bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-md">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Streak</p>
                    <div className="flex items-center justify-center gap-1 text-emerald-400">
                      <FireIcon className="w-5 h-5" />
                      <span className="text-xl font-black">3일</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleDailyQuest}
                  className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold text-lg hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
                >
                  <PlayIcon className="w-5 h-5 text-emerald-600" />
                  미션 시작하기
                </button>
              </div>
            </div>

            {/* B. Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Link href="/student/study" className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                  <BookOpenIcon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700">나 혼자 풀기</h3>
                <p className="text-sm text-slate-500 mt-1">부족한 단원을 선택해 집중 공략하세요.</p>
              </Link>
              
              <Link href="/student/report" className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-200 hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                  <CheckCircleIcon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700">오답 노트</h3>
                <p className="text-sm text-slate-500 mt-1">틀린 문제를 다시 풀고 약점을 보완하세요.</p>
              </Link>
            </div>

            {/* C. Recent History (Real DB) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-slate-400" /> 최근 학습 기록
                </h3>
                <Link href="/student/study" className="text-xs font-bold text-slate-400 hover:text-emerald-600 flex items-center">
                  전체보기 <ChevronRightIcon className="w-3 h-3" />
                </Link>
              </div>
              
              <div className="divide-y divide-slate-100">
                {isLoadingData ? (
                  <div className="p-8 text-center text-slate-400">데이터를 불러오는 중...</div>
                ) : recentExams.length === 0 ? (
                  <div className="p-10 text-center">
                    <p className="text-slate-400 text-sm mb-3">아직 학습 기록이 없습니다.</p>
                    <Link href="/student/study" className="text-emerald-600 font-bold text-sm underline">첫 시험 응시하기</Link>
                  </div>
                ) : (
                  recentExams.map((exam) => (
                    <div key={exam.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{exam.title}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {exam.totalQuestions}문제 • <span className={exam.score >= 80 ? "text-emerald-600 font-bold" : "text-slate-500"}>{exam.score}점</span>
                        </p>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">
                        {exam.createdAt.toDate().toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* === Right Column (Side) === */}
          <div className="space-y-8">
            
            {/* D-Day Widget */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Upcoming Exam</p>
                <h3 className="text-xl font-bold text-slate-900 mb-4">1학기 중간고사</h3>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-5xl font-black text-slate-900 tracking-tight">D-{diffDays}</span>
                </div>
                <p className="text-sm text-slate-500 font-medium">{dDayDate.toLocaleDateString()} 까지</p>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-blue-500"></div>
            </div>

            {/* School Ranking (Real DB) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <TrophyIcon className="w-5 h-5 text-yellow-500" />
                <h3 className="font-bold text-slate-900">우리 학교 랭킹</h3>
              </div>
              
              <div className="space-y-3">
                {isLoadingData ? (
                  <div className="space-y-2">
                    {[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />)}
                  </div>
                ) : ranking.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-4">아직 랭킹 데이터가 부족합니다.</p>
                ) : (
                  ranking.map((student, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                          idx === 0 ? 'bg-yellow-100 text-yellow-700' : 
                          idx === 1 ? 'bg-slate-200 text-slate-700' :
                          idx === 2 ? 'bg-orange-100 text-orange-700' : 'text-slate-400'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-700 text-sm">{student.name}</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-600">{student.score} C</span>
                    </div>
                  ))
                )}
              </div>
              <p className="text-[10px] text-center text-slate-400 mt-4">* 획득한 학습 코인 기준</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}