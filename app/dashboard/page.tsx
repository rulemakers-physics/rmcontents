// app/dashboard/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext"; 
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  doc, 
  updateDoc, 
  serverTimestamp,
  onSnapshot // [수정] 실시간 배지 업데이트를 위해 onSnapshot 사용 권장 (여기선 간단히 getDocs 유지하되 모달 오픈시 업데이트)
} from "firebase/firestore";
import RequestDetailModal from "@/components/RequestDetailModal"; 

interface ReferenceFile {
  name: string;
  url: string;
  path: string;
}

export interface RequestData {
  id: string;
  title: string;
  status: "requested" | "in_progress" | "completed" | "rejected";
  requestedAt: Timestamp;
  completedAt?: Timestamp;
  completedFileUrl?: string;
  
  contentKind: string;
  quantity: number;
  questionCount: string;
  deadline: string;
  scope: Record<string, Record<string, string[]>>;
  details?: string;
  referenceFiles?: ReferenceFile[];
  instructorId: string;
  rejectReason?: string;

  // [신규] 강사용 안 읽은 메시지 카운트
  unreadCountInstructor?: number;
}


export default function DashboardPage() {
  const { user, loading, isFirstLogin } = useAuth(); 
  const router = useRouter();
  
  const [requests, setRequests] = useState<RequestData[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);

  useEffect(() => {
    if (loading) {
      setIsLoading(true);
      return;
    }
    
    if (!user) {
      router.push("/login");
      return;
    }

    if (isFirstLogin === true) {
      alert("서비스 이용을 위해 프로필을 먼저 설정해주세요.");
      router.push("/profile/setup");
      return;
    }
    
    if (user && isFirstLogin === false) {
      // [수정] 실시간 업데이트(배지 표시)를 위해 onSnapshot 사용
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

  
  // --- 모달 핸들러 ---
  
  // 리스트 항목 클릭 시 모달 열기 + 읽음 처리
  const handleRequestClick = async (request: RequestData) => {
    setSelectedRequest(request);
    setIsModalOpen(true);

    // [신규] 안 읽은 메시지가 있으면 0으로 초기화 (읽음 처리)
    if (request.unreadCountInstructor && request.unreadCountInstructor > 0) {
      try {
        const docRef = doc(db, "requests", request.id);
        await updateDoc(docRef, {
          unreadCountInstructor: 0
        });
        // 로컬 상태 업데이트 (UI 즉시 반영)
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
      alert("요청이 성공적으로 수정되었습니다.");
      handleCloseModal();
    } catch (error) {
      console.error("Error updating request: ", error);
      alert("수정 중 오류가 발생했습니다.");
    }
    setIsLoading(false);
  };

  if (loading || isLoading || isFirstLogin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        요청 목록을 불러오는 중...
      </div>
    );
  }
  
  if (!user) return null; 

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-grow bg-gray-50 py-12">
        <div className="container mx-auto max-w-5xl px-6">
          
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              요청한 작업 목록
            </h1>
            <Link 
              href="/request"
              className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              + 새 작업 요청하기
            </Link>
          </div>
          
          <div className="mt-8 overflow-x-auto rounded-lg bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">요청 제목</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">요청일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">완료/다운로드</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      아직 요청한 작업이 없습니다.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr 
                      key={req.id} 
                      onClick={() => handleRequestClick(req)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        {req.status === 'requested' && <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">요청됨</span>}
                        {req.status === 'in_progress' && <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">작업중</span>}
                        {req.status === 'completed' && <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">완료됨</span>}
                        {req.status === 'rejected' && <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">반려됨</span>}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                        {req.title}
                        {/* [신규] 새 메시지 알림 배지 */}
                        {req.unreadCountInstructor && req.unreadCountInstructor > 0 ? (
                           <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                             New Message
                           </span>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{req.requestedAt.toDate().toLocaleDateString('ko-KR')}</td>
                      <td className="px-6 py-4">
                        {req.status === 'completed' && req.completedFileUrl ? (
                          <a
                            href={req.completedFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()} 
                            className="rounded-md bg-indigo-100 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200"
                          >
                            다운로드
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">
                            {req.status === 'in_progress' ? '작업 진행 중' :
                             req.status === 'rejected' ? '반려됨' : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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