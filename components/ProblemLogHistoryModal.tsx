// components/ProblemLogHistoryModal.tsx

"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  startAfter, 
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData
} from "firebase/firestore";
import { XMarkIcon, ClockIcon, DocumentTextIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

interface LogData {
  id: string;
  problemId: string;
  problemFilename: string;
  editorName: string;
  reason?: string;
  action: 'update' | 'delete' | 'create';
  changes?: Record<string, { from: any; to: any }>;
  timestamp: Timestamp;
}

interface ProblemLogHistoryModalProps {
  onClose: () => void;
}

const ITEMS_PER_PAGE = 50; // 한 번에 불러올 개수

export default function ProblemLogHistoryModal({ onClose }: ProblemLogHistoryModalProps) {
  const [logs, setLogs] = useState<LogData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // 데이터 로드 함수
  const fetchLogs = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      let q = query(
        collection(db, "problem_logs"),
        orderBy("timestamp", "desc"),
        limit(ITEMS_PER_PAGE)
      );

      // 더 보기일 경우 마지막 문서 다음부터 조회
      if (!isInitial && lastDoc) {
        q = query(
          collection(db, "problem_logs"),
          orderBy("timestamp", "desc"),
          startAfter(lastDoc),
          limit(ITEMS_PER_PAGE)
        );
      }

      const snapshot = await getDocs(q);
      
      const fetchedLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as LogData));

      // 데이터가 요청한 개수보다 적으면 더 이상 데이터가 없는 것
      if (snapshot.docs.length < ITEMS_PER_PAGE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }

      if (isInitial) {
        setLogs(fetchedLogs);
      } else {
        setLogs(prev => [...prev, ...fetchedLogs]);
      }

    } catch (error) {
      console.error("이력 로딩 실패:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    fetchLogs(true);
  }, []);

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
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* 헤더 */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">전체 문항 수정/삭제 이력</h3>
            <p className="text-xs text-slate-500 mt-1">모든 변경 사항을 최신순으로 조회합니다.</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-slate-400 hover:text-slate-600 transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* 바디 */}
        <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
          {loading ? (
            <div className="text-center py-10 text-slate-400">이력을 불러오는 중...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 text-slate-400">기록된 이력이 없습니다.</div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:border-blue-200 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          log.action === 'create' ? 'bg-green-100 text-green-700' :
                          log.action === 'delete' ? 'bg-red-100 text-red-700' : 
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {log.action === 'create' ? '생성' : log.action === 'delete' ? '삭제' : '수정'}
                        </span>
                        <span className="text-sm font-bold text-slate-800 flex items-center gap-1">
                           <DocumentTextIcon className="w-3.5 h-3.5 text-slate-400"/>
                           {log.problemFilename || "파일명 없음"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        수정자: <span className="font-medium text-slate-700">{log.editorName}</span>
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-slate-400 whitespace-nowrap">
                      <ClockIcon className="w-3 h-3 mr-1" />
                      {log.timestamp?.toDate().toLocaleString('ko-KR')}
                    </div>
                  </div>

                  {log.reason && (
                    <div className="mb-2 text-xs text-slate-600 bg-slate-50 p-2 rounded">
                      <span className="font-bold text-slate-500 mr-1">사유:</span>
                      {log.reason}
                    </div>
                  )}

                  {log.changes && (
                    <ul className="text-xs space-y-1 text-slate-500 border-t border-slate-100 pt-2 mt-2">
                      {Object.entries(log.changes).map(([key, val]) => (
                        <li key={key} className="flex flex-wrap gap-1 items-center">
                          <span className="font-semibold text-slate-700 min-w-[40px]">
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
              ))}

              {/* 더 보기 버튼 */}
              {hasMore && (
                <div className="pt-4 pb-2 text-center">
                  <button 
                    onClick={() => fetchLogs(false)} 
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-300 rounded-full text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        로딩 중...
                      </>
                    ) : (
                      <>
                        <ArrowPathIcon className="w-4 h-4" />
                        더 불러오기
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}