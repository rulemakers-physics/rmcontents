// app/admin/request/[requestId]/page.tsx

"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"; 
import { v4 as uuidv4 } from "uuid";
import { PaperClipIcon, XCircleIcon } from "@heroicons/react/24/solid";
import FeedbackThread from "@/components/FeedbackThread"; // [신규] 피드백 컴포넌트

// [신규] 참고 파일 데이터 타입
interface ReferenceFile {
  name: string;
  url: string;
  path: string;
}

// 요청 상세 데이터 타입
interface RequestDetails {
  id: string;
  title: string;
  instructorName: string;
  academy: string;
  status: "requested" | "in_progress" | "completed" | "rejected";
  requestedAt: Timestamp;
  
  referenceFiles?: ReferenceFile[]; 
  
  completedFileUrl?: string; 
  completedStoragePath?: string; 

  contentKind: string;        
  quantity: number;           
  questionCount: string;      
  deadline: string;           
  scope: Record<string, Record<string, string[]>>; 
  details?: string;
  
  rejectReason?: string;
  completedAt?: Timestamp;
}

export default function RequestDetailPage() {
  const { user, loading } = useAuth();
  const isAdmin = user?.isAdmin;
  const router = useRouter();
  const params = useParams();
  const requestId = params.requestId as string; 

  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false); 
  const [isUploading, setIsUploading] = useState(false); 
  const [completedFile, setCompletedFile] = useState<File | null>(null);

  // 1. 요청 상세 정보 불러오기 (변경 없음)
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
  
  // 2. 관리자 권한 확인 (변경 없음)
  useEffect(() => {
    if (loading) return;
    if (!user || !isAdmin) {
      router.push("/dashboard");
    }
  }, [user, loading, isAdmin, router]);

  // 3. '작업 중'으로 상태 변경 핸들러 (변경 없음)
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
  
  // 4. '반려하기' 핸들러 (변경 없음)
  const handleReject = async () => {
    const reason = prompt("요청을 반려하는 사유를 입력해주세요.");
    if (!reason || reason.trim() === "") {
      alert("반려 사유를 입력해야 합니다.");
      return;
    }

    setIsUpdating(true);
    try {
      const docRef = doc(db, "requests", requestId);
      await updateDoc(docRef, {
        status: "rejected",
        rejectReason: reason,
      });
      setRequest((prev) => prev ? { ...prev, status: "rejected", rejectReason: reason } : null);
      alert("요청이 반려 처리되었습니다.");
    } catch (err) {
      setError("반려 처리 중 오류 발생");
    }
    setIsUpdating(false);
  };


  // 5. 완료 파일 선택 핸들러 (변경 없음)
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCompletedFile(e.target.files[0]);
    }
  };

  // 6. [수정] 완료 파일 제출 핸들러 (기존 파일 삭제 로직 추가)
  const handleUploadComplete = async () => {
    if (!completedFile) {
      setError("완료 파일을 선택해주세요.");
      return;
    }
    
    setIsUploading(true);
    setError("");

    const oldStoragePath = request?.completedStoragePath;

    try {
      // 6-1. Storage에 업로드
      const uniqueFileName = `${uuidv4()}-${completedFile.name}`;
      const storagePath = `completed/${requestId}/${uniqueFileName}`;
      const fileRef = ref(storage, storagePath);
      
      await uploadBytes(fileRef, completedFile);
      const fileUrl = await getDownloadURL(fileRef);

      // 6-2. Firestore 문서 업데이트
      const docRef = doc(db, "requests", requestId);
      await updateDoc(docRef, {
        status: "completed",
        completedAt: serverTimestamp(),
        completedFileUrl: fileUrl,
        completedStoragePath: storagePath,
      });

      // 6-3. 기존 파일 삭제
      if (oldStoragePath) {
        try {
          const oldFileRef = ref(storage, oldStoragePath);
          await deleteObject(oldFileRef);
          console.log("기존 완료 파일이 성공적으로 삭제되었습니다.");
        } catch (deleteError) {
          console.warn("기존 파일 삭제 중 오류 발생 (무시함):", deleteError);
        }
      }

      alert("작업 완료 처리 및 파일 업로드에 성공했습니다.");
      
      setRequest((prev) => prev ? { 
        ...prev, 
        status: "completed", 
        completedFileUrl: fileUrl, 
        completedStoragePath: storagePath 
      } : null);
      
      router.push("/admin"); 

    } catch (err) {
      console.error("완료 처리 중 에러:", err);
      setError("업로드 중 오류가 발생했습니다.");
    }
    setIsUploading(false);
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
  
  const isJobFinished = request.status === 'completed' || request.status === 'rejected';

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-grow bg-gray-50 py-12">
        <div className="container mx-auto max-w-3xl px-6">
          <Link 
            href={isJobFinished ? "/admin/completed" : "/admin"} 
            className="text-sm text-blue-600 hover:underline"
          >
            &larr; 목록으로 돌아가기
          </Link>
          
          <div className="mt-4 rounded-lg bg-white p-8 shadow-md">
            
            {request.status === 'rejected' && (
              <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4">
                <div className="flex items-center">
                  <XCircleIcon className="h-6 w-6 text-red-600" />
                  <h3 className="ml-2 text-lg font-semibold text-red-800">반려된 요청</h3>
                </div>
                <p className="mt-2 text-sm text-red-700">
                  <strong>반려 사유:</strong> {request.rejectReason}
                </p>
              </div>
            )}
            
            {/* 1. 요청 상세 정보 (변경 없음) */}
            <div className="border-b pb-6">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">{request.title}</h1>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold
                  ${request.status === 'requested' ? 'bg-red-100 text-red-700' :
                    request.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                    request.status === 'rejected' ? 'bg-gray-100 text-gray-700' :
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

              {request.details && (
                <div className="mt-6 space-y-2">
                  <h3 className="text-lg font-semibold text-gray-800">(선택) 상세 요청 내용</h3>
                  <p className="whitespace-pre-wrap rounded-md bg-gray-50 p-4 text-gray-700">
                    {request.details}
                  </p>
                </div>
              )}

              {request.referenceFiles && request.referenceFiles.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800">첨부된 참고 파일</h3>
                  <ul className="mt-3 space-y-2 rounded-md border border-gray-200 p-4">
                    {request.referenceFiles.map((file) => (
                      <li key={file.path}>
                        <a 
                          href={file.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:underline"
                        >
                          <PaperClipIcon className="h-4 w-4" />
                          <span className="text-sm font-medium">{file.name}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* --- [수정] 피드백 섹션 (prop 전달) --- */}
            <div className="mt-8">
              <FeedbackThread requestId={requestId} requestStatus={request.status} />
            </div>

            {/* 2. 관리자 작업 섹션 (변경 없음) */}
            <div className="mt-8">
              {request.status === 'requested' && (
                <div className="rounded-md bg-yellow-50 p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800">작업 시작</h3>
                    <p className="text-sm text-yellow-700 mt-1">이 요청의 작업을 시작하려면 상태를 변경하세요.</p>
                  </div>
                  <button
                    onClick={handleStatusInProgress}
                    disabled={isUpdating}
                    className="rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
                  >
                    {isUpdating ? "변경 중..." : "▷ 작업 중으로 변경"}
                  </button>
                </div>
              )}

              {!isJobFinished && (
                 <div className="mt-4 rounded-md bg-red-50 p-4 flex items-center justify-between">
                   <div>
                    <h3 className="text-lg font-semibold text-red-800">요청 반려</h3>
                    <p className="text-sm text-red-700 mt-1">요청을 거절해야 할 경우 반려 처리를 진행하세요.</p>
                   </div>
                   <button
                    onClick={handleReject}
                    disabled={isUpdating}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {isUpdating ? "처리 중..." : "X 반려하기"}
                  </button>
                 </div>
              )}
              
              {!isJobFinished && (
                <div className="mt-8 rounded-md border border-gray-200 p-6">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {request.completedFileUrl ? "수정본 업로드" : "작업 완료 및 파일 업로드"}
                  </h3>
                  {request.completedFileUrl && (
                    <p className="text-sm text-gray-600 mt-2">
                      수정본을 업로드하면 기존에 업로드된 파일은 삭제됩니다.
                    </p>
                  )}
                  <div className="mt-4 space-y-4">
                    <input
                      type="file"
                      accept=".pdf"
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
                      {isUploading ? "업로드 중..." : (request.completedFileUrl ? "✓ 수정본 제출하기" : "✓ 완료 파일 제출하기")}
                    </button>
                  </div>
                </div>
              )}

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