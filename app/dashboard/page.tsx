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
  serverTimestamp 
} from "firebase/firestore";
import RequestDetailModal from "@/components/RequestDetailModal"; 

// [신규] 참고 파일 데이터 타입
interface ReferenceFile {
  name: string;
  url: string;
  path: string;
}

// [수정] 모달에서 사용할 전체 요청 데이터 타입
export interface RequestData {
  id: string;
  title: string;
  status: "requested" | "in_progress" | "completed" | "rejected"; // [수정]
  requestedAt: Timestamp;
  completedAt?: Timestamp;
  completedFileUrl?: string;
  
  // --- request 폼에서 추가된 필드 ---
  contentKind: string;
  quantity: number;
  questionCount: string;
  deadline: string;
  scope: Record<string, Record<string, string[]>>; // 단원 범위
  details?: string; // (선택) 상세 요청
  referenceFiles?: ReferenceFile[]; // [수정] referenceFileUrl -> referenceFiles
  instructorId: string; // (필수)
  rejectReason?: string; // [신규] 반려 사유
}


export default function DashboardPage() {
  const { user, loading, isFirstLogin } = useAuth(); 
  const router = useRouter();
  
  const [requests, setRequests] = useState<RequestData[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  // --- 모달 상태 관리 ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
  // --- ---

  // 로그인 / 첫 로그인 / 데이터 fetching 로직 (변경 없음)
  useEffect(() => {
    // 1. AuthContext 로딩 중이면 대기
    if (loading) {
      setIsLoading(true);
      return;
    }
    
    // 2. 로그아웃 상태면 로그인 페이지로
    if (!user) {
      router.push("/login");
      return;
    }

    // 3. [핵심] 로그인했지만 첫 로그인(프로필 미설정)이면 설정 페이지로
    if (isFirstLogin === true) {
      alert("서비스 이용을 위해 프로필을 먼저 설정해주세요.");
      router.push("/profile/setup");
      return;
    }
    
    // 4. 모든 조건을 통과 (로그인O, 프로필설정O) 한 경우에만 요청 목록을 불러옴
    if (user && isFirstLogin === false) {
      const fetchMyRequests = async () => {
        setIsLoading(true);
        try {
          const q = query(
            collection(db, "requests"),
            where("instructorId", "==", user.uid),
            orderBy("requestedAt", "desc")
          );
          
          const querySnapshot = await getDocs(q);
          const requestList = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as RequestData)); 
          
          setRequests(requestList);
        } catch (error) {
          console.error("내 요청 목록을 불러오는 중 에러:", error);
        }
        setIsLoading(false);
      };

      fetchMyRequests();
    }
  }, [user, loading, isFirstLogin, router]); 

  
  // --- 모달 핸들러 (변경 없음) ---
  
  // 리스트 항목 클릭 시 모달 열기
  const handleRequestClick = (request: RequestData) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  // 모달에서 '저장' 버튼 클릭 시 (Modal 컴포넌트가 호출)
  const handleSaveChanges = async (updatedData: Partial<RequestData>) => {
    if (!selectedRequest) return;

    setIsLoading(true); // 전체 페이지 로딩으로 표시 (간단하게)

    try {
      const docRef = doc(db, "requests", selectedRequest.id);
      await updateDoc(docRef, {
        ...updatedData,
        updatedAt: serverTimestamp(), // 수정 시간 기록
      });
      
      // 로컬 상태 즉시 업데이트
      setRequests(prev => 
        prev.map(req => 
          req.id === selectedRequest.id ? { ...req, ...updatedData } : req
        )
      );
      
      alert("요청이 성공적으로 수정되었습니다.");
      handleCloseModal();

    } catch (error) {
      console.error("Error updating request: ", error);
      alert("수정 중 오류가 발생했습니다.");
    }
    setIsLoading(false);
  };
  // --- ---


  // 로딩 UI (변경 없음)
  if (loading || isLoading || isFirstLogin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        요청 목록을 불러오는 중...
      </div>
    );
  }
  
  if (!user) {
    return null; 
  }

  // --- 강사 대시보드 UI ---
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
                      {/* 상태 */}
                      <td className="px-6 py-4">
                        {/* [수정] 'rejected' 상태 추가 */}
                        {req.status === 'requested' && <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">요청됨</span>}
                        {req.status === 'in_progress' && <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">작업중</span>}
                        {req.status === 'completed' && <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">완료됨</span>}
                        {req.status === 'rejected' && <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">반려됨</span>}
                      </td>
                      {/* 제목 */}
                      <td className="px-6 py-4 font-medium text-gray-900">{req.title}</td>
                      {/* 요청일 */}
                      <td className="px-6 py-4 text-gray-500">{req.requestedAt.toDate().toLocaleDateString('ko-KR')}</td>
                      {/* 완료/다운로드 */}
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

      {/* 모달 렌더링 */}
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