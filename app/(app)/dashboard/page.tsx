// app/dashboard/page.tsx

"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";
import { toast } from "react-hot-toast";

// --- 신규 컴포넌트 Import ---
import UserStatsWidget from "@/components/UserStatsWidget";
import { TableSkeleton } from "@/components/SkeletonLoader";
import EmptyState from "@/components/EmptyState";
import RequestDetailModal from "@/components/RequestDetailModal";
import FeatureTour from "@/components/FeatureTour";
import DashboardActionCenter from "@/components/DashboardActionCenter";
import DashboardAnalytics from "@/components/DashboardAnalytics";

// 아이콘 (사용하지 않는 아이콘은 제거했습니다)
import { RequestData } from "@/types/request";

export default function DashboardPage() {
  const { user, userData, loading, isFirstLogin } = useAuth();
  const router = useRouter();
  
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);

  // 진행 중인 작업 수 계산 (위젯용)
  const activeRequestsCount = useMemo(() => {
    return requests.filter(r => r.status === 'requested' || r.status === 'in_progress').length;
  }, [requests]);

  useEffect(() => {
    if (loading) return; // AuthContext 로딩 중이면 대기
    
    if (!user) {
      router.push("/login");
      return;
    }

    if (isFirstLogin === true) {
      toast.error("서비스 이용을 위해 프로필을 먼저 설정해주세요.");
      router.push("/profile/setup");
      return;
    }
    
    if (user && isFirstLogin === false) {
      // 실시간 리스너 연결
      const q = query(
        collection(db, "requests"),
        where("instructorId", "==", user.uid),
        orderBy("requestedAt", "desc")
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const requestList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as RequestData));
        setRequests(requestList);
        setIsLoading(false);
      }, (error) => {
        console.error("요청 목록 로딩 에러:", error);
        setIsLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user, loading, isFirstLogin, router]);

  // 투어 리셋 핸들러
  const handleResetTour = () => {
    localStorage.removeItem("hasSeenDashboardTour_v2");
    window.location.reload();
  };

  // --- 핸들러 ---
  const handleRequestClick = async (request: RequestData) => {
    setSelectedRequest(request);
    setIsModalOpen(true);

    // 안 읽은 메시지 초기화
    if (request.unreadCountInstructor && request.unreadCountInstructor > 0) {
      try {
        const docRef = doc(db, "requests", request.id);
        await updateDoc(docRef, { unreadCountInstructor: 0 });
        setRequests(prev => 
          prev.map(r => r.id === request.id ? { ...r, unreadCountInstructor: 0 } : r)
        );
      } catch (e) {
        console.error("읽음 처리 실패", e);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const handleSaveChanges = async (updatedData: Partial<RequestData>) => {
    if (!selectedRequest) return;
    setIsLoading(true);
    try {
      const docRef = doc(db, "requests", selectedRequest.id);
      await updateDoc(docRef, {
        ...updatedData,
        updatedAt: serverTimestamp(),
      });
      toast.success("요청이 성공적으로 수정되었습니다.");
      handleCloseModal();
    } catch (error) {
      console.error("Error updating request: ", error);
      toast.error("수정 중 오류가 발생했습니다.");
    }
    setIsLoading(false);
  };

  // 로딩 화면 처리
  if (loading || isFirstLogin === null) {
    return (
      <div className="container mx-auto max-w-5xl px-6 py-12">
         <div className="animate-pulse space-y-8">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="h-32 bg-slate-200 rounded-xl"></div>
            <div className="space-y-4">
               <div className="h-12 bg-slate-200 rounded"></div>
               <div className="h-12 bg-slate-200 rounded"></div>
               <div className="h-12 bg-slate-200 rounded"></div>
            </div>
         </div>
      </div>
    );
  }
  
  if (!user) return null; 

  return (
    <div className="flex min-h-full flex-col bg-slate-50">
      <FeatureTour />
      <main className="flex-grow py-12">
        <div className="container mx-auto max-w-6xl px-6">
          
          {/* 1. 헤더 및 인사말 */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">
              안녕하세요, {userData?.name ? `${userData.name} 선생님` : "선생님"}! 👋
            </h1>
            <p className="text-slate-500 mt-1">
              오늘도 학생들을 위한 최고의 컨텐츠를 준비해보세요.
            </p>
          </div>

          {/* 2. [위치 이동] 요청 내역 리스트 (최상단) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-10">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">최근 요청 내역</h2>
              <span className="text-xs text-slate-400">최근 3개월 내역</span>
            </div>

            {isLoading ? (
              <div className="p-6">
                <TableSkeleton />
              </div>
            ) : requests.length === 0 ? (
              <div className="p-6">
                <EmptyState 
                  title="아직 요청한 작업이 없습니다." 
                  desc="새로운 맞춤 교재 제작을 요청해보세요." 
                  actionLink="/request"
                  actionText="첫 작업 요청하기"
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">상태</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">요청 제목</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">요청일</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">완료 파일</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {requests.map((req) => (
                      <tr 
                        key={req.id} 
                        onClick={() => handleRequestClick(req)}
                        className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={req.status} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-700 truncate max-w-[200px] sm:max-w-xs">
                              {req.title}
                            </span>
                            {/* 새 메시지 배지 */}
                            {req.unreadCountInstructor && req.unreadCountInstructor > 0 ? (
                               <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600 ring-1 ring-inset ring-red-500/20 animate-pulse">
                                 New Message
                               </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {req.requestedAt.toDate().toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {req.status === 'completed' && req.completedFileUrl ? (
                            <a
                              href={req.completedFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()} 
                              className="inline-flex items-center justify-center rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-100 transition-colors border border-indigo-100"
                            >
                              다운로드
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">
                              {req.status === 'in_progress' ? '제작 진행 중' :
                               req.status === 'rejected' ? '반려됨' : '대기 중'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {/* 5. 통계 위젯 (하단 배치) */}
          {userData && (
            <div className="mb-6">
              <UserStatsWidget 
                userData={userData} 
                activeRequestsCount={activeRequestsCount} 
              />
            </div>
          )}
          {/* 3. 액션 센터 위젯 (요청 내역 아래로 이동) */}
          {userData && (
            <div className="mb-6">
               <DashboardActionCenter />
            </div>
          )}

          {/* 4. 전문 분석 대시보드 (차트) */}
          <div className="mb-6">
            <DashboardAnalytics />
          </div>


          {/* 이용 가이드 다시 보기 버튼 (페이지 최하단) 
            <div className="flex justify-end p-4 border-t border-slate-100 mt-8">
              <button 
                onClick={handleResetTour} 
                className="text-xs text-slate-400 hover:text-blue-600 underline flex items-center gap-1"
              >
                💡 이용 가이드 다시 보기
              </button>
            </div>
            */}
        </div>
      </main>

      {isModalOpen && selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          onClose={handleCloseModal}
          onSave={handleSaveChanges}
        />
      )}
    </div>
  );
}

// 상태 배지 컴포넌트 (내부용)
function StatusBadge({ status }: { status: string }) {
  const styles = {
    requested: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
    in_progress: "bg-blue-50 text-blue-700 ring-blue-600/20",
    completed: "bg-green-50 text-green-700 ring-green-600/20",
    rejected: "bg-slate-50 text-slate-600 ring-slate-500/20",
  };
  
  const labels = {
    requested: "요청됨",
    in_progress: "작업중",
    completed: "완료됨",
    rejected: "반려됨",
  };

  const key = status as keyof typeof styles;

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[key]}`}>
      {labels[key]}
    </span>
  );
}