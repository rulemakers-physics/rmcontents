// app/(app)/admin/marketing-exams/page.tsx

"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import { 
  PlusIcon, ChartBarIcon, PresentationChartLineIcon, 
  ArrowDownTrayIcon, PencilSquareIcon, DocumentDuplicateIcon 
} from "@heroicons/react/24/outline";
import AdminMarketingExamModal from "@/components/AdminMarketingExamModal"; 
import { MarketingExam, MarketingExamResult } from "@/types/marketing";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { toast } from "react-hot-toast";

// ExcelJS 임포트
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export default function AdminMarketingExamPage() {
  const { user } = useAuth();
  const [exams, setExams] = useState<MarketingExam[]>([]);
  const [selectedExam, setSelectedExam] = useState<MarketingExam | null>(null); 
  const [examResults, setExamResults] = useState<MarketingExamResult[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<MarketingExam | null>(null);

  // 1. 시험 목록 로드 (클라이언트 정렬로 안정성 확보)
  useEffect(() => {
    if (!user?.isAdmin) return;
    
    // [수정] orderBy 제거 (인덱스 문제 방지)
    const q = query(collection(db, "marketing_exams"));
    
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketingExam));
      
      // 최신순 정렬 (Client-side)
      list.sort((a, b) => {
        const tA = a.createdAt?.seconds || 0;
        const tB = b.createdAt?.seconds || 0;
        return tB - tA;
      });
      
      setExams(list);
      if (list.length > 0 && !selectedExam) setSelectedExam(list[0]);
    });
  }, [user]); // selectedExam 의존성 제거

  // 2. 선택된 시험의 결과 데이터 로드
  useEffect(() => {
    if (!selectedExam) return;
    const q = query(collection(db, "marketing_exam_results"), where("examId", "==", selectedExam.id));
    const unsubscribe = onSnapshot(q, (snap) => {
      const results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketingExamResult));
      setExamResults(results);
    });
    return () => unsubscribe();
  }, [selectedExam]);

  // 통계 계산
  const stats = useMemo(() => {
    if (examResults.length === 0) return null;

    const scores = examResults.map(r => r.score);
    const totalTakers = scores.length;
    const average = scores.reduce((a, b) => a + b, 0) / totalTakers;
    const variance = scores.reduce((a, b) => a + Math.pow(b - average, 2), 0) / totalTakers;
    const stdDev = Math.sqrt(variance);

    const distribution = Array(10).fill(0).map((_, i) => ({ range: `${i*10}점대`, count: 0 }));
    scores.forEach(s => {
      const idx = Math.min(Math.floor(s / 10), 9);
      distribution[idx].count++;
    });

    const questionStats: Record<number, number> = {};
    examResults.forEach(r => {
      Object.keys(r.results).forEach(qNum => {
        if (r.results[qNum]) questionStats[Number(qNum)] = (questionStats[Number(qNum)] || 0) + 1;
      });
    });
    const questionRates = Object.entries(questionStats).map(([qNum, count]) => ({
      number: Number(qNum),
      rate: Math.round((count / totalTakers) * 100)
    })).sort((a, b) => a.number - b.number);

    return { totalTakers, average, stdDev, distribution, questionRates, maxScore: Math.max(...scores) };
  }, [examResults]);

  const handleEdit = (exam: MarketingExam) => {
    setEditingExam(exam);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingExam(null);
    setIsModalOpen(true);
  };

  // [핵심] ExcelJS 다운로드 로직
  const downloadExcel = async () => {
    if (!selectedExam) return;
    const toastId = toast.loading("엑셀 생성 중...");

    try {
      const workbook = new ExcelJS.Workbook();
      
      // Sheet 1: 응시자 목록
      const sheet1 = workbook.addWorksheet("응시 결과");
      sheet1.columns = [
        { header: "응시일시", key: "submittedAt", width: 22 },
        { header: "전화번호", key: "phone", width: 16 },
        { header: "점수", key: "score", width: 10 },
        { header: "마케팅동의", key: "agree", width: 12 },
        { header: "문서ID", key: "id", width: 25 },
      ];
      
      examResults.forEach((r) => {
        sheet1.addRow({
          submittedAt: r.submittedAt?.toDate().toLocaleString(),
          phone: r.phone,
          score: r.score,
          agree: (r as any).marketingAgree ? "O" : "X",
          id: r.id
        });
      });

      // Sheet 2: 문항별 분석
      if (stats) {
        const sheet2 = workbook.addWorksheet("문항 분석");
        sheet2.columns = [
          { header: "문항 번호", key: "no", width: 10 },
          { header: "정답률(%)", key: "rate", width: 15 },
        ];
        stats.questionRates.forEach(q => {
          sheet2.addRow({ no: q.number, rate: q.rate });
        });
      }

      // 파일 내보내기
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, `[모의고사]_${selectedExam.title}_결과.xlsx`);
      
      toast.success("다운로드 완료", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("엑셀 저장 실패", { id: toastId });
    }
  };

  if (!user?.isAdmin) return <div className="p-10 text-center">관리자 권한이 필요합니다.</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <PresentationChartLineIcon className="w-8 h-8 text-teal-600" />
              RM 모의고사 관리
            </h1>
            <p className="text-slate-500 mt-1">전국 모의고사 관리 및 실시간 통계</p>
          </div>
          <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg">
            <PlusIcon className="w-5 h-5" /> 새 시험 생성
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* 좌측: 시험 리스트 */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Exam List</h3>
            {exams.length === 0 && <div className="text-sm text-slate-400 p-4 border rounded">등록된 시험이 없습니다.</div>}
            
            {exams.map(exam => (
              <div 
                key={exam.id}
                onClick={() => setSelectedExam(exam)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedExam?.id === exam.id 
                    ? 'bg-white border-teal-500 ring-2 ring-teal-100 shadow-md' 
                    : 'bg-white border-slate-200 hover:border-teal-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${exam.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {exam.isActive ? '진행중' : '마감'}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(exam); }} className="text-slate-400 hover:text-blue-600">
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">{exam.title}</h4>
                <p className="text-xs text-slate-500 truncate">{exam.id}</p>
                {/* PDF 여부 표시 */}
                <div className="flex gap-2 mt-2">
                  {exam.questionPaperUrl && <DocumentDuplicateIcon className="w-3 h-3 text-blue-500" title="문제지 있음"/>}
                </div>
              </div>
            ))}
          </div>

          {/* 우측: 대시보드 */}
          <div className="lg:col-span-3">
            {selectedExam && stats ? (
              <div className="space-y-6">
                
                {/* 1. 요약 카드 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatBox label="총 응시자" value={`${stats.totalTakers}명`} color="text-slate-900" />
                  <StatBox label="평균 점수" value={`${stats.average.toFixed(1)}점`} color="text-blue-600" />
                  <StatBox label="최고 점수" value={`${stats.maxScore}점`} color="text-emerald-600" />
                  <StatBox label="표준 편차" value={stats.stdDev.toFixed(2)} color="text-purple-600" />
                </div>

                {/* 2. 점수 분포 차트 */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <ChartBarIcon className="w-5 h-5 text-slate-400" /> 점수 분포
                    </h3>
                    <button onClick={downloadExcel} className="text-xs font-bold text-green-600 flex items-center gap-1 hover:underline">
                      <ArrowDownTrayIcon className="w-3 h-3" /> 엑셀 다운로드 (ExcelJS)
                    </button>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.distribution}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="range" tick={{fontSize: 11}} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 3. 문항별 정답률 */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4">문항별 정답률</h3>
                  <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                    {stats.questionRates.map((q) => (
                      <div key={q.number} className="flex flex-col items-center p-2 rounded bg-slate-50 border border-slate-100">
                        <span className="text-xs text-slate-500 mb-1">{q.number}번</span>
                        <span className={`text-sm font-bold ${q.rate < 40 ? 'text-red-500' : q.rate < 70 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {q.rate}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-full flex items-center justify-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
                <p>시험을 선택하거나 데이터가 없습니다.</p>
              </div>
            )}
          </div>
        </div>

        {isModalOpen && (
          <AdminMarketingExamModal 
            exam={editingExam} 
            onClose={() => setIsModalOpen(false)} 
          />
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: any) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
      <p className="text-xs text-slate-500 font-bold uppercase mb-1">{label}</p>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}