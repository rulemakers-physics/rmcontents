// components/StudentDetailModal.tsx

"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, query, where, orderBy, getDocs, addDoc, serverTimestamp, 
  onSnapshot, deleteDoc, doc 
} from "firebase/firestore";
import { 
  XMarkIcon, UserCircleIcon, PhoneIcon, ChatBubbleLeftRightIcon, 
  ChartBarIcon, TrashIcon, PaperAirplaneIcon 
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { StudentData, CounselingLog } from "@/types/academy";
import { ExamResultData } from "@/types/grade";
import { useAuth } from "@/context/AuthContext";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import WeaknessRadarChart from "./WeaknessRadarChart"; // [신규 컴포넌트]
import { analyzeCumulativeWeakness, AnalysisResult } from "@/utils/analysisHelper"; // [신규 로직]
import { SparklesIcon } from "@heroicons/react/24/solid"; // 아이콘

interface Props {
  student: StudentData;
  onClose: () => void;
}

export default function StudentDetailModal({ student, onClose }: Props) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'info' | 'counseling' | 'analysis'>('counseling');
  
  // 상담 상태
  const [logs, setLogs] = useState<CounselingLog[]>([]);
  const [newLog, setNewLog] = useState("");
  const [logType, setLogType] = useState<CounselingLog['type']>("상담");
  
  // 성적 상태
  const [examHistory, setExamHistory] = useState<any[]>([]);

  // 1. 상담 일지 불러오기 (실시간)
  useEffect(() => {
    if (!student.id) return;
    
    // 하위 컬렉션 'counseling_logs' 사용
    const q = query(
      collection(db, "students", student.id, "counseling_logs"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CounselingLog));
      setLogs(list);
    });

    return () => unsubscribe();
  }, [student.id]);

  // 2. 성적 기록 불러오기 (해당 반의 모든 시험 결과 중 이 학생의 점수만 필터링)
  useEffect(() => {
    const fetchExams = async () => {
      if (!student.classId) return;
      try {
        const q = query(
          collection(db, "exam_results"),
          where("classId", "==", student.classId),
          orderBy("date", "asc")
        );
        const snapshot = await getDocs(q);
        
        const history = snapshot.docs.map(doc => {
          const data = doc.data() as ExamResultData;
          const myScoreData = data.scores.find(s => s.studentId === student.id);
          
          if (!myScoreData) return null;

          return {
            date: data.date.toDate().toLocaleDateString(),
            examTitle: data.examTitle,
            myScore: myScoreData.score,
            average: data.average,
            highest: data.highest
          };
        }).filter(item => item !== null); // 응시하지 않은 시험 제외

        setExamHistory(history);
      } catch (e) {
        console.error(e);
      }
    };
    
    if (activeTab === 'analysis') {
      fetchExams();
    }
  }, [student.id, student.classId, activeTab]);

  // 상담 등록 핸들러
  const handleAddLog = async () => {
    if (!newLog.trim()) return;
    try {
      await addDoc(collection(db, "students", student.id, "counseling_logs"), {
        studentId: student.id,
        type: logType,
        content: newLog,
        authorName: user?.displayName || "선생님",
        createdAt: serverTimestamp(),
      });
      setNewLog("");
      toast.success("기록되었습니다.");
    } catch (e) {
      toast.error("저장 실패");
    }
  };

  // 상담 삭제 핸들러
  const handleDeleteLog = async (logId: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await deleteDoc(doc(db, "students", student.id, "counseling_logs", logId));
  };

  // [신규] 누적 분석 데이터 상태
  const [aiAnalysisData, setAiAnalysisData] = useState<AnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // [신규] 분석 실행 함수
  const runAnalysis = async () => {
    if (!student.classId) return;
    setIsAnalyzing(true);
    const data = await analyzeCumulativeWeakness(student.id, student.classId);
    setAiAnalysisData(data);
    setIsAnalyzing(false);
    if (data.length === 0) {
      toast("분석할 충분한 누적 데이터가 없습니다.");
    }
  };

  // 탭이 'analysis'로 바뀔 때 자동으로 분석 실행 (선택 사항)
  useEffect(() => {
    if (activeTab === 'analysis' && aiAnalysisData.length === 0) {
      runAnalysis();
    }
  }, [activeTab]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row h-[80vh] overflow-hidden">
        
        {/* 좌측: 학생 프로필 요약 (사이드바) */}
        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-6 flex-shrink-0 flex flex-col">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-300 border border-slate-200 shadow-sm mb-3">
              <UserCircleIcon className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{student.name}</h2>
            <p className="text-sm text-slate-500">{student.school || "학교 미기재"}</p>
          </div>

          <div className="space-y-4 text-sm">
            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <PhoneIcon className="w-4 h-4" /> <span className="text-xs font-bold">학생 연락처</span>
              </div>
              <div className="font-medium text-slate-700">{student.phone || "-"}</div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <UserCircleIcon className="w-4 h-4" /> <span className="text-xs font-bold">부모님 연락처</span>
              </div>
              <div className="font-medium text-slate-700">{student.parentPhone || "-"}</div>
            </div>
          </div>

          <div className="mt-auto pt-6">
            <button onClick={onClose} className="w-full py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-lg">
              닫기
            </button>
          </div>
        </div>

        {/* 우측: 메인 컨텐츠 (탭) */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 탭 헤더 */}
          <div className="flex border-b border-slate-200">
            <button 
              onClick={() => setActiveTab('counseling')}
              className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'counseling' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5" /> 상담/관리 기록
            </button>
            <button 
              onClick={() => setActiveTab('analysis')}
              className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'analysis' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              <ChartBarIcon className="w-5 h-5" /> 성적 분석 리포트
            </button>
          </div>

          {/* 탭 컨텐츠 */}
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            
            {/* 1. 상담 탭 */}
            {activeTab === 'counseling' && (
              <div className="flex flex-col h-full">
                {/* 입력창 */}
                <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex gap-2 mb-2">
                    {['상담', '전화', '특이사항', '과제'].map(t => (
                      <button 
                        key={t}
                        onClick={() => setLogType(t as any)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${logType === t ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <textarea 
                      value={newLog}
                      onChange={(e) => setNewLog(e.target.value)}
                      placeholder="상담 내용이나 특이사항을 기록하세요..."
                      className="w-full p-3 pr-12 rounded-lg border border-slate-200 focus:border-blue-500 outline-none resize-none h-24 text-sm"
                    />
                    <button 
                      onClick={handleAddLog}
                      className="absolute right-2 bottom-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
                    >
                      <PaperAirplaneIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 기록 목록 */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {logs.length === 0 ? (
                    <p className="text-center text-slate-400 text-sm py-10">기록된 상담 내역이 없습니다.</p>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="group relative pl-6 border-l-2 border-slate-100 pb-2">
                        <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${
                          log.type === '상담' ? 'bg-blue-400' : 
                          log.type === '전화' ? 'bg-green-400' : 
                          log.type === '과제' ? 'bg-orange-400' : 'bg-slate-400'
                        }`} />
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold text-slate-500">
                            {log.createdAt?.toDate().toLocaleString()}
                            <span className="ml-2 px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">{log.type}</span>
                          </span>
                          <button onClick={() => handleDeleteLog(log.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-slate-800 whitespace-pre-wrap">{log.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 2. 분석 탭 */}
            {activeTab === 'analysis' && (
              <div className="h-full flex flex-col overflow-y-auto pr-2 custom-scrollbar">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-indigo-500" />
                    AI 누적 학습 분석
                  </h3>
                  <p className="text-sm text-slate-500">
                    지금까지 응시한 모든 시험 데이터를 종합하여 단원별 숙련도를 분석합니다.
                  </p>
                </div>

                {/* --- [신규] AI 분석 차트 영역 --- */}
                <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm mb-8">
                  {isAnalyzing ? (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
                      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                      <span className="text-xs">데이터를 분석 중입니다...</span>
                    </div>
                  ) : aiAnalysisData.length > 0 ? (
                    <>
                      <div className="flex justify-between items-center mb-4 px-2">
                        <h4 className="font-bold text-slate-800 text-sm">단원별 실력 (가중치 분석)</h4>
                        <span className="text-[12px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-bold">
                          RuleMakers AI Powered
                        </span>
                      </div>
                      {/* 위에서 만든 레이더 차트 컴포넌트 사용 */}
                      <WeaknessRadarChart data={aiAnalysisData} />
                      <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 leading-relaxed">
                        💡 <strong>분석 인사이트:</strong><br/>
                        {/* 간단한 자동 코멘트 생성 로직 */}
                        {(() => {
                          const lowest = [...aiAnalysisData].sort((a, b) => a.score - b.score)[0];
                          return `${student.name} 학생은 현재 '${lowest.topic}' 단원이 가장 취약합니다. 해당 단원 위주의 클리닉 문제 풀이가 필요합니다.`;
                        })()}
                      </div>
                    </>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
                      분석할 데이터가 부족합니다.
                    </div>
                  )}
                </div>
                
                {/* 요약 테이블 */}
                <div className="mt-6 border-t border-slate-100 pt-4">
                  <h4 className="text-sm font-bold text-slate-800 mb-3">최근 시험 이력</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="p-2 rounded-l-lg">시험명</th>
                          <th className="p-2">날짜</th>
                          <th className="p-2 font-bold text-blue-600">점수</th>
                          <th className="p-2">평균</th>
                          <th className="p-2 rounded-r-lg">최고점</th>
                        </tr>
                      </thead>
                      <tbody>
                        {examHistory.map((exam, idx) => (
                          <tr key={idx} className="border-b border-slate-50 last:border-0">
                            <td className="p-2 font-medium text-slate-700">{exam.examTitle}</td>
                            <td className="p-2 text-slate-400 text-xs">{exam.date}</td>
                            <td className="p-2 font-bold text-blue-600">{exam.myScore}점</td>
                            <td className="p-2 text-slate-500">{exam.average.toFixed(1)}</td>
                            <td className="p-2 text-slate-500">{exam.highest}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}