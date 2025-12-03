// app/dashboard/page.tsx

"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  onSnapshot,
  Timestamp
} from "firebase/firestore";
import { toast } from "react-hot-toast";

// --- 신규 컴포넌트 Import ---
import UserStatsWidget from "@/components/UserStatsWidget";
import { TableSkeleton } from "@/components/SkeletonLoader";
import EmptyState from "@/components/EmptyState";
import RequestDetailModal from "@/components/RequestDetailModal";
import FeatureTour from "@/components/FeatureTour";
// [신규] 대시보드 위젯 추가
import DashboardActionCenter from "@/components/DashboardActionCenter";
import DashboardAnalytics from "@/components/DashboardAnalytics";

// 아이콘
import { 
  BeakerIcon, 
  DocumentTextIcon, 
  ChevronRightIcon 
} from "@heroicons/react/24/outline";
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

  // [2. 추가] 투어 리셋 핸들러
  const handleResetTour = () => {
    // 로컬 스토리지에서 '봤음' 기록 삭제
    localStorage.removeItem("hasSeenDashboardTour_v2");
    // 페이지를 새로고침하여 투어 컴포넌트가 다시 마운트되도록 함
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
        // 로컬 상태 즉시 반영 (깜빡임 방지)
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
    setIsLoading(true); // 저장 중 로딩 표시 (선택 사항)
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
    <div className="flex min-h-screen flex-col bg-slate-50">
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
          
          {/* ▼▼▼ [신규] 액션 센터 위젯 추가 ▼▼▼ */}
          {userData && (
            <DashboardActionCenter />
          )}
          {/* ▲▲▲ [신규] ▲▲▲ */}

          {/* 4. [신규] 전문 분석 대시보드 (차트) */}
          <DashboardAnalytics />

          {/* 2. 통계 위젯 (컴포넌트 적용) */}
          {userData && (
            <UserStatsWidget 
              userData={userData} 
              activeRequestsCount={activeRequestsCount} 
            />
          )}

          {/* 3. Quick Actions (서비스 연결 카드) */}
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {/* A. 문제은행 바로가기 */}
            <Link 
              href="/service/maker"
              className="group relative flex items-center justify-between p-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden"
            >
               <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-2">
                   <BeakerIcon className="w-6 h-6 text-blue-200" />
                   <span className="text-xs font-bold text-blue-100 bg-white/20 px-2 py-0.5 rounded-full">BETA</span>
                 </div>
                 <h3 className="text-xl font-bold text-white mb-1">자체 제작 문제은행</h3>
                 <p className="text-blue-100 text-sm">원하는 문제를 골라 시험지를 직접 만드세요.</p>
               </div>
               <div className="relative z-10 bg-white/10 p-2 rounded-full group-hover:bg-white/20 transition-colors">
                 <ChevronRightIcon className="w-6 h-6 text-white" />
               </div>
               {/* 데코레이션 */}
               <div className="absolute right-[-20px] bottom-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
            </Link>

            {/* B. 맞춤 제작 요청하기 */}
            <Link 
              href="/request"
              className="group relative flex items-center justify-between p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all hover:-translate-y-1"
            >
               <div>
                 <div className="flex items-center gap-2 mb-2">
                   <DocumentTextIcon className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-1">맞춤 제작 요청</h3>
                 <p className="text-slate-500 text-sm">기출 분석 및 변형 문제를 전문가에게 맡기세요.</p>
               </div>
               <div className="bg-slate-50 p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                 <ChevronRightIcon className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
               </div>
            </Link>
          </div>
          
          {/* 4. 요청 내역 리스트 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
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
          {/* 이용 가이드 다시 보기 버튼 */}
            <div className="flex justify-end p-4 border-t border-slate-100">
              <button 
                onClick={handleResetTour} // 이제 함수가 정의되어 정상 작동합니다.
                className="text-xs text-slate-400 hover:text-blue-600 underline flex items-center gap-1"
              >
                💡 이용 가이드 다시 보기
              </button>
            </div>
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