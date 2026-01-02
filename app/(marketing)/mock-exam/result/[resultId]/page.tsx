// app/(marketing)/mock-exam/result/[resultId]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { 
  ChartBarIcon, CheckCircleIcon, XCircleIcon, 
  DocumentArrowDownIcon, PlayCircleIcon 
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { toast } from "react-hot-toast"; // 토스트 추가
import { MarketingExam } from "@/types/marketing"; // 타입 임포트

interface ResultData {
  examId: string;
  examTitle: string;
  score: number;
  phone: string;
  answers: Record<string, number>;
  results: Record<string, boolean>;
}

interface ExamStat {
  totalTakers: number;
  questionStats: Record<string, number>;
}

export default function MarketingResultPage() {
  const { resultId } = useParams();
  const [result, setResult] = useState<ResultData | null>(null);
  const [examData, setExamData] = useState<MarketingExam | null>(null); // [신규] 시험지 데이터 상태
  const [stats, setStats] = useState<ExamStat | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. 내 결과 로드
  useEffect(() => {
    const fetchResult = async () => {
      try {
        const docRef = doc(db, "marketing_exam_results", resultId as string);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as ResultData;
          setResult(data);
          
          // [추가] 원본 시험지 데이터 로드 (해설지 URL 확보용)
          const examDocRef = doc(db, "marketing_exams", data.examId);
          const examSnap = await getDoc(examDocRef);
          if (examSnap.exists()) {
            setExamData({ id: examSnap.id, ...examSnap.data() } as MarketingExam);
          }

          // 결과 로드 후 전체 통계 집계 호출
          fetchStats(data.examId);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [resultId]);

  // 2. 전체 통계 집계
  const fetchStats = async (examId: string) => {
    try {
      const q = query(
        collection(db, "marketing_exam_results"), 
        where("examId", "==", examId)
      );
      const snap = await getDocs(q);
      
      const total = snap.size;
      const qCounts: Record<string, number> = {};

      snap.forEach(doc => {
        const r = doc.data().results;
        Object.keys(r).forEach(qNum => {
          if (r[qNum] === true) {
            qCounts[qNum] = (qCounts[qNum] || 0) + 1;
          }
        });
      });

      const rates: Record<string, number> = {};
      Object.keys(qCounts).forEach(qNum => {
        rates[qNum] = Math.round((qCounts[qNum] / total) * 100);
      });

      setStats({ totalTakers: total, questionStats: rates });

    } catch (e) {
      console.error("통계 로드 실패", e);
    }
  };

  // [신규] 해설지 다운로드 핸들러
  const handleDownloadSolution = () => {
    if (examData?.solutionPaperUrl) {
      window.open(examData.solutionPaperUrl, '_blank');
    } else {
      toast.error("해설지가 아직 등록되지 않았습니다.");
    }
  };

  // [신규] 해설 강의 핸들러
  const handleWatchLecture = () => {
    if (examData?.lectureUrl) {
      window.open(examData.lectureUrl, '_blank');
    } else {
      toast("해설 강의는 준비 중입니다.", { icon: "🎥" });
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">결과 분석 중...</div>;
  if (!result) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">결과를 찾을 수 없습니다.</div>;

  const estimatedGrade = result.score >= 90 ? 1 : result.score >= 80 ? 2 : result.score >= 70 ? 3 : 4;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* 상단 배너 */}
        <div className="bg-slate-900 rounded-3xl p-8 text-white text-center shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2">Analysis Report</p>
            <h1 className="text-3xl font-bold mb-6">{result.examTitle}</h1>
            
            <div className="flex justify-center items-end gap-2 mb-2">
              <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                {result.score}
              </span>
              <span className="text-2xl font-medium text-slate-400 pb-2">점</span>
            </div>
            
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
              <StarIcon className="w-5 h-5 text-yellow-400" />
              <span className="font-bold">예상 등급 : {estimatedGrade}등급</span>
            </div>
          </div>
          
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-slate-900/50 pointer-events-none" />
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-600/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-600/20 rounded-full blur-3xl" />
        </div>

        {/* 액션 버튼 (수정됨) */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleDownloadSolution}
            className="flex items-center justify-center gap-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors font-bold text-slate-700"
          >
            <DocumentArrowDownIcon className="w-6 h-6 text-blue-600" /> 해설지 확인
          </button>
          <button 
            onClick={handleWatchLecture}
            className="flex items-center justify-center gap-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors font-bold text-slate-700"
          >
            <PlayCircleIcon className="w-6 h-6 text-red-600" /> 해설 강의 보기
          </button>
        </div>

        {/* 문항별 상세 분석 (기존 유지) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5 text-slate-500" /> 문항별 정답률 분석
            </h3>
            <span className="text-xs text-slate-400">총 응시자 기준</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-center">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="py-3 w-16">번호</th>
                  <th className="py-3">결과</th>
                  <th className="py-3">내가 쓴 답</th>
                  <th className="py-3 text-blue-600">전체 정답률</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* 문항 루프 */}
                {Array.from({ length: examData?.totalQuestions || 20 }, (_, i) => {
                  const qNum = String(i + 1);
                  const isCorrect = result.results[qNum];
                  const myAns = result.answers[qNum];
                  const rate = stats?.questionStats[qNum] || 0;
                  
                  return (
                    <tr key={qNum} className="hover:bg-slate-50">
                      <td className="py-3 font-bold text-slate-700">{qNum}</td>
                      <td className="py-3 flex justify-center">
                        {isCorrect ? (
                          <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <XCircleIcon className="w-5 h-5 text-red-500" />
                        )}
                      </td>
                      <td className="py-3 font-mono font-bold text-slate-600">{myAns || "-"}</td>
                      <td className="py-3">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${rate}%` }}></div>
                          </div>
                          <span className="text-xs font-bold text-blue-600 w-8 text-right">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 하단 마케팅 배너 (기존 유지) */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-8 text-center text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">📊 더 정밀한 분석이 필요하신가요?</h3>
            <p className="text-indigo-200 text-sm mb-6 leading-relaxed">
              데이터가 충분히 누적되면 표준편차, 백분위, 약점 단원 분석이 포함된<br/>
              <strong>[프리미엄 분석 리포트]</strong>를 문자({result.phone})로 보내드립니다.
            </p>
            <div className="inline-block bg-white/10 px-4 py-2 rounded-lg text-xs border border-white/20">
              * 마케팅 정보 수신 동의 회원 대상
            </div>
          </div>
          <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl" />
        </div>

      </div>
    </div>
  );
}