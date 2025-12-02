// components/ProblemHistoryModal.tsx

"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { XMarkIcon, ClockIcon } from "@heroicons/react/24/outline";

interface LogData {
  id: string;
  editorName: string; // 연구원 이름
  reason?: string;    // 수정 사유
  action: 'update' | 'delete' | 'create';
  changes?: Record<string, { from: any; to: any }>;
  timestamp: Timestamp;
}

interface ProblemHistoryModalProps {
  problemId: string;
  problemFilename: string;
  onClose: () => void;
}

export default function ProblemHistoryModal({ problemId, problemFilename, onClose }: ProblemHistoryModalProps) {
  const [logs, setLogs] = useState<LogData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const q = query(
          collection(db, "problem_logs"),
          where("problemId", "==", problemId),
          orderBy("timestamp", "desc")
        );
        const snapshot = await getDocs(q);
        const fetchedLogs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as LogData));
        setLogs(fetchedLogs);
      } catch (error) {
        console.error("이력 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [problemId]);

  // 필드명 한글 매핑
  const fieldMap: Record<string, string> = {
    majorTopic: "대단원",
    minorTopic: "소단원",
    difficulty: "난이도",
    answer: "정답",
    content: "지문",
    imgUrl: "이미지"
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
        
        {/* 헤더 */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">수정 이력</h3>
            <p className="text-xs text-slate-500 mt-1">문항 코드: {problemFilename}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-slate-400 hover:text-slate-600 transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* 바디 (스크롤) */}
        <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
          {loading ? (
            <div className="text-center py-10 text-slate-400">이력을 불러오는 중...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 text-slate-400">기록된 수정 이력이 없습니다.</div>
          ) : (
            <div className="space-y-6">
              {logs.map((log) => (
                <div key={log.id} className="relative pl-6 border-l-2 border-slate-200 last:border-0 pb-6 last:pb-0">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{log.editorName}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          log.action === 'create' ? 'bg-green-100 text-green-700' :
                          log.action === 'delete' ? 'bg-red-100 text-red-700' : 
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {log.action === 'create' ? '생성' : log.action === 'delete' ? '삭제' : '수정'}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-slate-400">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        {log.timestamp?.toDate().toLocaleString('ko-KR')}
                      </div>
                    </div>

                    {log.reason && (
                      <div className="mb-3 text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="font-bold text-slate-500 mr-1">사유:</span>
                        {log.reason}
                      </div>
                    )}

                    {/* 변경 내역 상세 */}
                    {log.changes && (
                      <ul className="text-xs space-y-1 text-slate-500">
                        {Object.entries(log.changes).map(([key, val]) => (
                          <li key={key} className="flex gap-1">
                            <span className="font-semibold text-slate-700 w-16 shrink-0">
                              {fieldMap[key] || key}
                            </span>
                            <span className="line-through decoration-red-300 decoration-2 text-slate-400">
                              {String(val.from)}
                            </span>
                            <span className="text-slate-300">→</span>
                            <span className="text-blue-600 font-medium">
                              {String(val.to)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}