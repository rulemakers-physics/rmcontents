// app/(app)/admin/reports/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  getDoc 
} from "firebase/firestore";
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowTopRightOnSquareIcon,
  InboxIcon
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import AdminProblemEditModal from "@/components/AdminProblemEditModal";
import { Problem } from "../problems/page"; // 기존 타입 재사용

interface Report {
  id: string;
  problemId: string;
  problemContent: string;
  reporterName: string;
  type: string;
  description: string;
  status: "pending" | "resolved" | "ignored";
  createdAt: any;
}

export default function AdminReportsPage() {
  const { user, loading } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 문제 수정 모달용 상태
  const [targetProblem, setTargetProblem] = useState<Problem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (!user?.isAdmin) return;

    const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
      setReports(list);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 상태 변경 핸들러
  const handleStatusChange = async (reportId: string, newStatus: "resolved" | "ignored") => {
    try {
      await updateDoc(doc(db, "reports", reportId), { status: newStatus });
      toast.success(newStatus === "resolved" ? "처리 완료되었습니다." : "무시 처리되었습니다.");
    } catch (e) {
      toast.error("상태 변경 실패");
    }
  };

  // 문제 수정 모달 열기
  const openProblemEditor = async (problemId: string) => {
    const loadingToast = toast.loading("문제 정보를 불러오는 중...");
    try {
      const docSnap = await getDoc(doc(db, "problems", problemId));
      if (docSnap.exists()) {
        setTargetProblem({ id: docSnap.id, ...docSnap.data() } as Problem);
        setIsEditModalOpen(true);
        toast.dismiss(loadingToast);
      } else {
        toast.error("삭제되었거나 존재하지 않는 문제입니다.", { id: loadingToast });
      }
    } catch (e) {
      console.error(e);
      toast.error("불러오기 실패", { id: loadingToast });
    }
  };

  if (loading || !user?.isAdmin) return <div className="p-8 text-center">권한 확인 중...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex items-center gap-3 mb-8">
          <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">문항 오류 신고 관리</h1>
            <p className="text-slate-500 text-sm mt-1">사용자가 제보한 문항 오류를 검토하고 수정합니다.</p>
          </div>
        </div>

        {reports.length === 0 && !isLoading ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <InboxIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">접수된 신고 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {reports.map((report) => (
              <div 
                key={report.id} 
                className={`bg-white p-6 rounded-xl border shadow-sm transition-all ${
                  report.status === 'pending' ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-200 opacity-70'
                }`}
              >
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  
                  {/* 정보 영역 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        report.status === 'pending' ? 'bg-red-100 text-red-600' : 
                        report.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {report.status === 'pending' ? '대기중' : report.status === 'resolved' ? '처리완료' : '무시됨'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {report.createdAt?.toDate().toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        제보자: {report.reporterName}
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                      [{report.type}] 
                      <span className="text-base font-normal text-slate-600 truncate max-w-md">
                        {report.problemContent}
                      </span>
                    </h3>
                    
                    <p className="mt-2 text-slate-700 bg-slate-50 p-3 rounded-lg text-sm border border-slate-100">
                      {report.description}
                    </p>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex md:flex-col gap-2 justify-center min-w-[140px]">
                    <button 
                      onClick={() => openProblemEditor(report.problemId)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    >
                      <ArrowTopRightOnSquareIcon className="w-4 h-4" /> 문제 확인
                    </button>
                    
                    {report.status === 'pending' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleStatusChange(report.id, 'resolved')}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-50 text-green-700 border border-green-200 text-sm font-bold rounded-lg hover:bg-green-100"
                          title="처리 완료로 변경"
                        >
                          <CheckCircleIcon className="w-5 h-5" /> 완료
                        </button>
                        <button 
                          onClick={() => handleStatusChange(report.id, 'ignored')}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-50 text-gray-500 border border-gray-200 text-sm font-bold rounded-lg hover:bg-gray-100"
                          title="무시(반려)"
                        >
                          <XCircleIcon className="w-5 h-5" /> 무시
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 문제 수정 모달 연결 */}
        {isEditModalOpen && targetProblem && (
          <AdminProblemEditModal 
            problem={targetProblem} 
            onClose={() => setIsEditModalOpen(false)} 
          />
        )}

      </div>
    </div>
  );
}