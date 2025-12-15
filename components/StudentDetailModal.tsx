// components/StudentDetailModal.tsx

"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, query, where, orderBy, getDocs, addDoc, serverTimestamp, 
  onSnapshot, deleteDoc, doc, updateDoc // [수정] updateDoc 추가
} from "firebase/firestore";
import { 
  XMarkIcon, UserCircleIcon, PhoneIcon, ChatBubbleLeftRightIcon, 
  ChartBarIcon, TrashIcon, PaperAirplaneIcon,
  PencilSquareIcon, CheckIcon // [수정] 아이콘 추가
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { StudentData, CounselingLog } from "@/types/academy";
import { ExamResultData } from "@/types/grade";
import { useAuth } from "@/context/AuthContext";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";

// [신규] 분석 관련 임포트 (이전 단계에서 추가된 것들 유지)
import WeaknessRadarChart from "./WeaknessRadarChart"; 
import { analyzeCumulativeWeakness, AnalysisResult } from "@/utils/analysisHelper"; 
import { SparklesIcon, ArrowRightIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation"; 

interface Props {
  student: StudentData;
  onClose: () => void;
}

export default function StudentDetailModal({ student, onClose }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'info' | 'counseling' | 'analysis'>('counseling');
  
  // 상담 상태
  const [logs, setLogs] = useState<CounselingLog[]>([]);
  const [newLog, setNewLog] = useState("");
  const [logType, setLogType] = useState<CounselingLog['type']>("상담");
  
  // 성적 상태
  const [examHistory, setExamHistory] = useState<any[]>([]);

  // [신규] 누적 분석 데이터 상태
  const [aiAnalysisData, setAiAnalysisData] = useState<AnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // [신규] 학생 정보 수정 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: student.name,
    school: student.school || "",
    phone: student.phone || "",
    parentPhone: student.parentPhone || ""
  });

  // [신규] 학생 정보 수정 핸들러
  const handleUpdateStudent = async () => {
    if (!editData.name.trim()) return toast.error("이름은 필수입니다.");
    
    try {
      await updateDoc(doc(db, "students", student.id), {
        name: editData.name,
        school: editData.school,
        phone: editData.phone,
        parentPhone: editData.parentPhone
      });
      toast.success("학생 정보가 수정되었습니다.");
      setIsEditing(false);
      // 부모 컴포넌트(ClassDetailModal)에서 목록을 새로고침하려면
      // 1. onClose()로 닫았다가 다시 열거나
      // 2. ClassDetailModal이 onSnapshot으로 실시간 연동되어 있어야 함 (현재는 fetch 방식)
      // 여기서는 일단 DB 업데이트 성공 메시지만 띄웁니다.
    } catch (e) {
      console.error(e);
      toast.error("수정 실패");
    }
  };

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
  const handleAddLog = async () => { /* ... */ };
  const handleDeleteLog = async (logId: string) => { /* ... */ };
  
  const runAnalysis = async () => {
    if (!student.classId) return;
    setIsAnalyzing(true);
    const data = await analyzeCumulativeWeakness(student.id, student.classId);
    setAiAnalysisData(data);
    setIsAnalyzing(false);
    if (data.length === 0) toast("분석할 충분한 누적 데이터가 없습니다.");
  };

  useEffect(() => {
    if (activeTab === 'analysis' && aiAnalysisData.length === 0) runAnalysis();
  }, [activeTab]);

  const handleCreateClinic = (topic: string) => {
    if (!topic) return;
    const query = new URLSearchParams({
      mode: 'clinic',
      student: student.name,
      topic: topic
    }).toString();
    router.push(`/service/maker?${query}`);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row h-[80vh] overflow-hidden">
        
        {/* 좌측: 학생 프로필 요약 (사이드바) - [수정됨] */}
        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-6 flex-shrink-0 flex flex-col">
          
          <div className="flex justify-end mb-2">
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                title="정보 수정"
              >
                <PencilSquareIcon className="w-5 h-5" />
              </button>
            ) : (
              <div className="flex gap-1">
                <button 
                  onClick={handleUpdateStudent}
                  className="text-green-500 hover:text-green-700 bg-green-50 rounded p-1"
                  title="저장"
                >
                  <CheckIcon className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="text-slate-400 hover:text-slate-600 bg-slate-100 rounded p-1"
                  title="취소"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-300 border border-slate-200 shadow-sm mb-3 relative overflow-hidden">
              <UserCircleIcon className="w-12 h-12" />
            </div>
            
            {isEditing ? (
              <div className="space-y-2 w-full">
                <input 
                  type="text" 
                  value={editData.name} 
                  onChange={(e) => setEditData({...editData, name: e.target.value})}
                  className="w-full text-center text-sm font-bold border border-blue-300 rounded p-1 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="이름"
                />
                <input 
                  type="text" 
                  value={editData.school} 
                  onChange={(e) => setEditData({...editData, school: e.target.value})}
                  className="w-full text-center text-xs text-slate-500 border border-blue-300 rounded p-1 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="학교"
                />
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-slate-900">{editData.name}</h2>
                <p className="text-sm text-slate-500">{editData.school || "학교 미기재"}</p>
              </>
            )}
          </div>

          <div className="space-y-4 text-sm">
            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <PhoneIcon className="w-4 h-4" /> <span className="text-xs font-bold">학생 연락처</span>
              </div>
              {isEditing ? (
                <input 
                  type="text" 
                  value={editData.phone} 
                  onChange={(e) => setEditData({...editData, phone: e.target.value})}
                  className="w-full text-sm font-medium text-slate-700 border border-blue-300 rounded p-1 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="010-0000-0000"
                />
              ) : (
                <div className="font-medium text-slate-700">{editData.phone || "-"}</div>
              )}
            </div>
            
            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <UserCircleIcon className="w-4 h-4" /> <span className="text-xs font-bold">부모님 연락처</span>
              </div>
              {isEditing ? (
                <input 
                  type="text" 
                  value={editData.parentPhone} 
                  onChange={(e) => setEditData({...editData, parentPhone: e.target.value})}
                  className="w-full text-sm font-medium text-slate-700 border border-blue-300 rounded p-1 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="010-0000-0000"
                />
              ) : (
                <div className="font-medium text-slate-700">{editData.parentPhone || "-"}</div>
              )}
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
                    누적 학습 분석
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
                        <h4 className="font-bold text-slate-800 text-sm">단원별 숙련도</h4>
                        <span className="text-[12px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-bold">
                          RuleMakers AI Powered
                        </span>
                      </div>
                      
                      {/* 차트 컴포넌트 */}
                      <WeaknessRadarChart data={aiAnalysisData} />
                      
                      {/* [개선] 분석 인사이트 & 신뢰도 정보 */}
                      <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 leading-relaxed space-y-2">
                        <p>
                          💡 <strong>분석 인사이트:</strong><br/>
                          {(() => {
                            // 점수가 낮은 순으로 정렬하되, 푼 문제 수가 3개 이상인 단원만 고려 (노이즈 필터링)
                            const validData = aiAnalysisData.filter(d => d.problemCount >= 3);
                            
                            if (validData.length === 0) return "아직 충분한 데이터가 모이지 않았습니다. 문제를 더 풀어보세요!";
                            
                            const lowest = [...validData].sort((a, b) => a.score - b.score)[0];
                            return (
                              <>
                                {student.name} 학생은 현재 풀이 데이터 기반{" "}
                                <span className="font-bold text-indigo-600 bg-indigo-50 px-1 rounded">
                                  '{lowest.topic}'
                                </span>{" "}
                                단원이 가장 취약합니다. (숙련도 {lowest.score}점)
                              </>
                            );
                          })()}
                        </p>
                        
                        {/* (옵션) 분석에 사용된 단원 목록 표시 */}
                        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-slate-200">
                          <span className="text-[10px] text-slate-400 mr-1">분석된 단원:</span>
                          {aiAnalysisData.map(d => (
                            <span key={d.topic} className={`text-[10px] px-1.5 py-0.5 rounded ${d.problemCount < 3 ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-700'}`}>
                              {d.topic}({d.problemCount}문항)
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
                      분석할 데이터가 부족합니다. (최소 5문제 이상 풀이 필요)
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