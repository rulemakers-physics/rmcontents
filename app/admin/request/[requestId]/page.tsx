// app/admin/request/[requestId]/page.tsx

"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

// 요청 상세 데이터 타입
interface RequestDetails {
  id: string;
  title: string;
  instructorName: string;
  academy: string;
  status: "requested" | "in_progress" | "completed";
  requestedAt: Timestamp;
  referenceFileUrl?: string; // 강사가 올린 참고 파일
  completedFileUrl?: string; // 관리자가 올린 완료 파일

  // --- [수정] 폼 필드에 맞게 추가 ---
  contentKind: string;        // 컨텐츠 종류
  quantity: number;           // 수량
  questionCount: string;      // 문항 수
  deadline: string;           // 마감일 (string으로 저장됨)
  scope: Record<string, Record<string, string[]>>; // 단원 범위
  details?: string;           // (선택) 상세 요청 내용
}

export default function RequestDetailPage() {
  // --- [수정된 부분 1] ---
  const { user, loading } = useAuth();
  const isAdmin = user?.isAdmin;
  // --- [수정 끝] ---
  const router = useRouter();
  const params = useParams();
  const requestId = params.requestId as string; // URL에서 요청 ID 가져오기

  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false); // 상태 변경
  const [isUploading, setIsUploading] = useState(false); // 파일 업로드
  const [completedFile, setCompletedFile] = useState<File | null>(null);

  // 1. 요청 상세 정보 불러오기
  useEffect(() => {
    if (!requestId || loading || !isAdmin) return;

    const fetchRequest = async () => {
      setIsLoading(true);
      try {
        const docRef = doc(db, "requests", requestId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setRequest({ id: docSnap.id, ...docSnap.data() } as RequestDetails);
        } else {
          setError("해당 요청을 찾을 수 없습니다.");
        }
      } catch (err) {
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      }
      setIsLoading(false);
    };

    fetchRequest();
  }, [requestId, user, loading, isAdmin]);
  
  // 2. 관리자 권한 확인 (페이지 접근 시)
  useEffect(() => {
    if (loading) return;
    if (!user || !isAdmin) {
      router.push("/dashboard");
    }
  }, [user, loading, isAdmin, router]);

  // 3. '작업 중'으로 상태 변경 핸들러
  const handleStatusInProgress = async () => {
    setIsUpdating(true);
    try {
      const docRef = doc(db, "requests", requestId);
      await updateDoc(docRef, {
        status: "in_progress",
      });
      setRequest((prev) => prev ? { ...prev, status: "in_progress" } : null);
    } catch (err) {
      setError("상태 변경 중 오류 발생");
    }
    setIsUpdating(false);
  };

  // 4. 완료 파일 선택 핸들러
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCompletedFile(e.target.files[0]);
    }
  };

  // 5. 완료 파일 제출 핸들러 (업로드 + 상태 'completed'로 변경)
  const handleUploadComplete = async () => {
    if (!completedFile) {
      setError("완료 파일을 선택해주세요.");
      return;
    }
    
    setIsUploading(true);
    setError("");

    try {
      // 5-1. Storage에 업로드
      const uniqueFileName = `${uuidv4()}-${completedFile.name}`;
      const storagePath = `completed/${requestId}/${uniqueFileName}`;
      const fileRef = ref(storage, storagePath);
      
      await uploadBytes(fileRef, completedFile);
      const fileUrl = await getDownloadURL(fileRef);

      // 5-2. Firestore 문서 업데이트
      const docRef = doc(db, "requests", requestId);
      await updateDoc(docRef, {
        status: "completed",
        completedAt: serverTimestamp(),
        completedFileUrl: fileUrl,
        completedStoragePath: storagePath,
      });

      alert("작업 완료 처리 및 파일 업로드에 성공했습니다.");
      router.push("/admin"); // 완료 후 관리자 대시보드로 이동

    } catch (err) {
      console.error("완료 처리 중 에러:", err);
      setError("업로드 중 오류가 발생했습니다.");
      setIsUploading(false);
    }
  };


  // --- 렌더링 ---
  if (isLoading || loading || !isAdmin) {
    return <div className="flex min-h-screen items-center justify-center">로딩 중...</div>;
  }
  if (error) {
    return <div className="flex min-h-screen items-center justify-center text-red-500">{error}</div>;
  }
  if (!request) {
    return <div className="flex min-h-screen items-center justify-center">요청 정보를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-grow bg-gray-50 py-12">
        <div className="container mx-auto max-w-3xl px-6">
          <Link href="/admin" className="text-sm text-blue-600 hover:underline">&larr; 목록으로 돌아가기</Link>
          
          <div className="mt-4 rounded-lg bg-white p-8 shadow-md">
            
            {/* 1. 요청 상세 정보 */}
            <div className="border-b pb-6">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">{request.title}</h1>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold
                  ${request.status === 'requested' ? 'bg-red-100 text-red-700' :
                    request.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'}`}>
                  {request.status}
                </span>
              </div>
              <p className="mt-2 text-gray-600">
                {request.instructorName} ({request.academy})
              </p>
              <p className="mt-1 text-sm text-gray-500">
                요청일: {request.requestedAt.toDate().toLocaleString('ko-KR')}
              </p>
              
              {/* --- [수정] 상세 요청 내용을 구조화하여 표시 --- */}

              {/* 1. 요청 기본 정보 */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800">요청 기본 정보</h3>
                <dl className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 rounded-md border border-gray-200 p-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">요청 컨텐츠 종류</dt>
                    <dd className="mt-1 text-gray-900">{request.contentKind}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">필요한 수량</dt>
                    <dd className="mt-1 text-gray-900">{request.quantity} Set</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">마감일</dt>
                    <dd className="mt-1 text-gray-900">{request.deadline}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">필요한 문항 수</dt>
                    <dd className="mt-1 text-gray-900">{request.questionCount}</dd>
                  </div>
                </dl>
              </div>

              {/* 2. 컨텐츠 범위 */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800">컨텐츠 범위</h3>
                <div className="mt-4 space-y-3 rounded-md border border-gray-200 p-4">
                  {request.scope && Object.keys(request.scope).length > 0 ? (
                    Object.keys(request.scope).map((subjectName) => (
                      <div key={subjectName}>
                        <h4 className="font-medium text-gray-900">{subjectName}</h4>
                        <ul className="mt-2 list-outside list-disc space-y-1 pl-6">
                          {Object.keys(request.scope[subjectName]).map((majorTopicName) => (
                            <li key={majorTopicName} className="text-sm">
                              <span className="font-medium">{majorTopicName}</span>
                              <ul className="mt-1 list-inside list-disc pl-4 text-gray-600">
                                {request.scope[subjectName][majorTopicName].map((minorTopicName) => (
                                  <li key={minorTopicName}>{minorTopicName}</li>
                                ))}
                              </ul>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">선택된 범위가 없습니다.</p>
                  )}
                </div>
              </div>

              {/* 3. (선택) 상세 요청 내용 */}
              {request.details && (
                <div className="mt-6 space-y-2">
                  <h3 className="text-lg font-semibold text-gray-800">(선택) 상세 요청 내용</h3>
                  <p className="whitespace-pre-wrap rounded-md bg-gray-50 p-4 text-gray-700">
                    {request.details}
                  </p>
                </div>
              )}
              {/* --- [여기까지] --- */}

              {request.referenceFileUrl && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800">첨부된 참고 파일</h3>
                  <a 
                    href={request.referenceFileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-blue-600 hover:underline"
                  >
                    참고 파일 다운로드
                  </a>
                </div>
              )}
            </div>

            {/* 2. 관리자 작업 섹션 */}
            <div className="mt-8">
              {/* '작업 중'으로 변경 (아직 '요청됨' 상태일 때만 보임) */}
              {request.status === 'requested' && (
                <div className="rounded-md bg-yellow-50 p-4">
                  <h3 className="text-lg font-semibold text-yellow-800">작업 시작</h3>
                  <p className="text-sm text-yellow-700 mt-1">이 요청의 작업을 시작하려면 작업 중으로 상태를 변경하세요.</p>
                  <button
                    onClick={handleStatusInProgress}
                    disabled={isUpdating}
                    className="mt-3 rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
                  >
                    {isUpdating ? "변경 중..." : "▷ 작업 중으로 변경"}
                  </button>
                </div>
              )}

              {/* '완료 파일' 업로드 (아직 '완료됨' 상태가 아닐 때 보임) */}
              {request.status !== 'completed' && (
                <div className="mt-8 rounded-md border border-gray-200 p-6">
                  <h3 className="text-xl font-semibold text-gray-800">작업 완료 및 파일 업로드</h3>
                  <div className="mt-4 space-y-4">
                    <input
                      type="file"
                      accept=".pdf" // PDF만 허용
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:rounded-md file:border-0
                        file:bg-blue-50 file:px-4 file:py-2
                        file:text-sm file:font-medium file:text-blue-700
                        hover:file:bg-blue-100"
                    />
                    <button
                      onClick={handleUploadComplete}
                      disabled={isUploading || !completedFile}
                      className="w-full rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isUploading ? "업로드 중..." : "✓ 완료 파일 제출하기"}
                    </button>
                  </div>
                </div>
              )}

              {/* '완료됨' 상태일 때 */}
              {request.status === 'completed' && request.completedFileUrl && (
                <div className="rounded-md bg-green-50 p-6 text-center">
                  <h3 className="text-xl font-semibold text-green-800">작업 완료됨</h3>
                  <p className="mt-2 text-green-700">이 작업은 완료되어 강사에게 전달되었습니다.</p>
                  <a 
                    href={request.completedFileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-4 inline-block text-blue-600 hover:underline"
                  >
                    업로드된 완료 파일 확인
                  </a>
                </div>
              )}
              {error && <p className="mt-4 text-center text-red-500">{error}</p>}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}