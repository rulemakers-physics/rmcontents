// components/RequestDetailModal.tsx

import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import { RequestData } from "@/app/dashboard/page"; 
import {
  BookOpenIcon,
  ChevronDownIcon,
  ClipboardDocumentListIcon,
  DocumentArrowUpIcon,
  InformationCircleIcon,
  PaperClipIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  UserCircleIcon, // [신규] 담당자 아이콘
} from "@heroicons/react/24/outline";
import FeedbackThread from "./FeedbackThread"; 
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // [신규]
import { storage } from "@/lib/firebase"; // [신규]
import { v4 as uuidv4 } from "uuid"; // [신규]
import { useAuth } from "@/context/AuthContext"; // [신규]

// --- 단원 데이터 (변경 없음) ---
interface MajorTopic {
  name: string;
  minorTopics: string[];
}
interface Subject {
  name: string;
  majorTopics: MajorTopic[];
}
const scienceUnits: Subject[] = [
  {
    name: "통합과학 1",
    majorTopics: [
      { name: "1. 과학의 기초", minorTopics: ["시간과 공간", "기본량과 단위", "측정과 측정 표준", "정보와 디지털 기술"] },
      { name: "2. 원소의 형성", minorTopics: ["우주 초기에 형성된 원소", "지구와 생명체를 이루는 원소의 생성"] },
      { name: "3. 물질의 규칙성과 성질", minorTopics: ["원소의 주기성과 화학 결합", "이온 결합과 공유 결합", "지각과 생명체 구성 물질의 규칙성", "물질의 전기적 성질"] },
      { name: "4. 지구시스템", minorTopics: ["지구시스템의 구성 요소", "지구시스템의 상호작용", "지권의 변화"] },
      { name: "5. 역학 시스템", minorTopics: ["중력과 역학시스템", "운동과 충돌"] },
      { name: "6. 생명 시스템", minorTopics: ["생명 시스템의 기본 단위", "물질대사와 효소", "세포 내 정보의 흐름"] }
    ]
  },
  {
    name: "통합과학 2",
    majorTopics: [
      { name: "1. 지질 시대와 생물 다양성", minorTopics: ["지질시대의 생물과 화석", "자연선택과 진화", "생물다양성과 보전"] },
      { name: "2. 화학 변화", minorTopics: ["산화와 환원", "산성과 염기성", "중화 반응", "물질 변화에서 에너지 출입"] },
      { name: "3. 생태계와 환경 변화", minorTopics: ["생태계 구성 요소", "생태계 평형", "기후 변화와 지구 환경 변화"] },
      { name: "4. 에너지와 지속가능한 발전", minorTopics: ["태양 에너지의 생성과 전환", "전기 에너지의 생산", "에너지 효율과 신재생 에너지"] },
      { name: "5. 과학과 미래 사회", minorTopics: ["과학의 유용성과 필요성", "과학 기술 사회와 빅데이터", "과학 기술의 발전과 미래 사회", "과학 관련 사회적 쟁점과 과학 윤리"] }
    ]
  }
];
// --- ---

// [신규] 파일 데이터 타입 정의
interface ReferenceFile {
  name: string;
  url: string;
  path: string;
}

// [신규] RequestData 확장 (담당자 필드 인식을 위해)
interface ExtendedRequestData extends RequestData {
  assignedResearcher?: string;
}

interface RequestDetailModalProps {
  request: RequestData;
  onClose: () => void;
  onSave: (updatedData: Partial<RequestData>) => Promise<void>;
}

export default function RequestDetailModal({ request, onClose, onSave }: RequestDetailModalProps) {
  const { user } = useAuth(); // [신규] 파일 업로드 경로에 user.uid 사용
  const isReadOnly = request.status !== 'requested';

  // --- 폼 State ---
  const [title, setTitle] = useState("");
  const [contentKind, setContentKind] = useState("");
  const [openMajorTopics, setOpenMajorTopics] = useState<string[]>([]);
  type SelectedScope = Record<string, Record<string, string[]>>;
  const [selectedScope, setSelectedScope] = useState<SelectedScope>({});
  const [quantity, setQuantity] = useState("1");
  const [questionCount, setQuestionCount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [optionalDetails, setOptionalDetails] = useState("");
  
  // [수정] 파일 및 저장 상태 관리
  const [currentFiles, setCurrentFiles] = useState<ReferenceFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // --- ---

  // --- useEffect ---
  useEffect(() => {
    setTitle(request.title);
    setContentKind(request.contentKind);
    setSelectedScope(request.scope || {});
    setQuantity(String(request.quantity));
    setQuestionCount(request.questionCount);
    setDeadline(request.deadline);
    setOptionalDetails(request.details || "");
    // [신규] 초기 파일 목록 설정
    setCurrentFiles(request.referenceFiles || []);
  }, [request]);
  
  // --- 단원 핸들러 (변경 없음) ---
  const toggleMajorTopic = (majorTopicName: string) => {
    if (isReadOnly) return; 
    setOpenMajorTopics(prev =>
      prev.includes(majorTopicName)
        ? prev.filter(name => name !== majorTopicName)
        : [...prev, majorTopicName]
    );
  };

  const handleMinorTopicChange = (
    subjectName: string,
    majorTopicName: string,
    minorTopicName: string,
    isChecked: boolean
  ) => {
    if (isReadOnly) return; 
    setSelectedScope(prevScope => {
      const newScope = JSON.parse(JSON.stringify(prevScope));
      if (!newScope[subjectName]) newScope[subjectName] = {};
      if (!newScope[subjectName][majorTopicName]) newScope[subjectName][majorTopicName] = [];

      if (isChecked) {
        newScope[subjectName][majorTopicName].push(minorTopicName);
      } else {
        newScope[subjectName][majorTopicName] = newScope[subjectName][majorTopicName].filter(
          (topic: string) => topic !== minorTopicName
        );
      }

      if (newScope[subjectName][majorTopicName].length === 0) delete newScope[subjectName][majorTopicName];
      if (Object.keys(newScope[subjectName]).length === 0) delete newScope[subjectName];

      return newScope;
    });
  };

  const isMinorTopicSelected = (
    subjectName: string,
    majorTopicName: string,
    minorTopicName: string
  ): boolean => {
    return !!(
      selectedScope[subjectName] &&
      selectedScope[subjectName][majorTopicName] &&
      selectedScope[subjectName][majorTopicName].includes(minorTopicName)
    );
  };

  // --- [신규] 파일 추가 핸들러 ---
  const handleAddFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    setIsUploading(true);

    try {
      const newFiles = Array.from(e.target.files);
      const uploadPromises = newFiles.map(async (file) => {
        const uniqueFileName = `${uuidv4()}-${file.name}`;
        const storagePath = `uploads/requests/${user.uid}/${uniqueFileName}`;
        const fileRef = ref(storage, storagePath);
        await uploadBytes(fileRef, file);
        const fileUrl = await getDownloadURL(fileRef);
        return {
          name: file.name,
          url: fileUrl,
          path: storagePath,
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setCurrentFiles((prev) => [...prev, ...uploadedFiles]);
    } catch (error) {
      console.error("파일 업로드 실패:", error);
      alert("파일 업로드 중 오류가 발생했습니다.");
    }
    setIsUploading(false);
  };

  // --- [신규] 파일 삭제 핸들러 ---
  const handleDeleteFile = (indexToRemove: number) => {
    if (confirm("이 파일을 목록에서 삭제하시겠습니까? ('변경 내용 저장' 버튼을 눌러야 반영됩니다)")) {
      setCurrentFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    }
  };

  // --- [수정] 저장 핸들러 ---
  const handleSaveSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // 기본 정보 유효성 검사는 '접수됨(requested)' 상태일 때만 수행
    if (!isReadOnly) {
      if (!title || !contentKind || !quantity || !questionCount || !deadline || 
          Object.keys(selectedScope).length === 0) 
      {
        alert("필수 항목(*)을 모두 입력해주세요. (단원 범위 포함)");
        return;
      }
    }

    setIsSaving(true);

    // 업데이트할 데이터 구성
    const updatedData: Partial<RequestData> = {
      // 파일 정보와 상세 내용(details)은 상태와 무관하게 항상 업데이트 가능
      referenceFiles: currentFiles,
      details: optionalDetails, 
    };

    // '접수됨' 상태일 때만 나머지 핵심 필드도 업데이트
    if (!isReadOnly) {
      updatedData.title = title;
      updatedData.contentKind = contentKind;
      updatedData.scope = selectedScope;
      updatedData.quantity = parseInt(quantity, 10);
      updatedData.questionCount = questionCount;
      updatedData.deadline = deadline;
    }

    await onSave(updatedData);
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-lg bg-gray-100 shadow-xl">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-white rounded-t-lg">
          <h2 className="text-2xl font-bold text-gray-900">
            {isReadOnly ? "요청 내역 확인" : "요청 내역 수정"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* 모달 바디 */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6 space-y-8">
          
          {request.status === 'rejected' && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                <h3 className="ml-2 text-lg font-semibold text-red-800">요청 반려됨</h3>
              </div>
              <p className="mt-2 text-sm text-red-700">
                <strong>반려 사유:</strong> {request.rejectReason || "사유 미기재"}
              </p>
            </div>
          )}

          {/* [신규] 담당자 배정 정보 표시 */}
          {(request as ExtendedRequestData).assignedResearcher && (
             <div className="rounded-md bg-blue-50 p-4 border border-blue-200 flex items-center gap-2">
                <UserCircleIcon className="h-5 w-5 text-blue-600" />
                <span className="text-blue-700 font-bold">담당 연구원:</span>
                <span className="text-blue-900">{(request as ExtendedRequestData).assignedResearcher}</span>
             </div>
          )}

          {/* --- 폼 --- */}
          <form onSubmit={handleSaveSubmit} className="space-y-8">
            
            <div className="rounded-lg bg-white p-6 shadow-lg sm:p-8">
              <h2 className="flex items-center text-xl font-semibold text-gray-800">
                <InformationCircleIcon className="h-6 w-6 mr-2 text-indigo-600" />
                기본 정보
              </h2>
              <div className="mt-6 grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">요청 제목*</label>
                  <input
                    id="title" type="text" value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required disabled={isReadOnly} 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="relative">
                  <label htmlFor="contentKind" className="block text-sm font-medium text-gray-700">요청 컨텐츠 종류*</label>
                  <select
                    id="contentKind" value={contentKind}
                    onChange={(e) => setContentKind(e.target.value)}
                    required disabled={isReadOnly} 
                    className="mt-1 block w-full appearance-none rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 pr-10 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="" disabled>종류를 선택하세요</option>
                    <option value="학교별 실전 모의고사">학교별 실전 모의고사</option>
                    <option value="학교별 내신 대비 N제">학교별 내신 대비 N제</option>
                    <option value="고난도 문항모음">고난도 문항모음</option>
                  </select>
                  <ChevronDownIcon className="pointer-events-none absolute right-3 top-8 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

              {/* --- 피드백 쓰레드 (prop 전달) --- */}
            <div className="mt-8">
            <FeedbackThread requestId={request.id} requestStatus={request.status} />
            </div>

            <div className="rounded-lg bg-white p-6 shadow-lg sm:p-8">
              <h2 className="flex items-center text-xl font-semibold text-gray-800">
                <BookOpenIcon className="h-6 w-6 mr-2 text-indigo-600" />
                컨텐츠 범위 설정*
              </h2>
              <div className="mt-4 space-y-4">
                {scienceUnits.map((subject) => (
                  <div key={subject.name} className="rounded-md border border-gray-200">
                    <h3 className="bg-gray-50 px-4 py-3 text-lg font-medium text-gray-900 rounded-t-md">{subject.name}</h3>
                    <div className="divide-y divide-gray-200">
                      {subject.majorTopics.map((majorTopic) => {
                        const isOpen = openMajorTopics.includes(majorTopic.name);
                        return (
                          <div key={majorTopic.name}>
                            <button
                              type="button"
                              onClick={() => toggleMajorTopic(majorTopic.name)}
                              disabled={isReadOnly} 
                              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-indigo-700 hover:bg-indigo-50 focus:outline-none disabled:text-gray-500 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                            >
                              <span>{majorTopic.name}</span>
                              <ChevronDownIcon className={`h-5 w-5 transform transition-transform ${isOpen ? "rotate-180" : ""}`} />
                            </button>
                            {isOpen && (
                              <div className="border-t border-gray-200 bg-white p-4">
                                <div className="flex flex-col space-y-1">
                                  {majorTopic.minorTopics.map((minorTopic) => (
                                    <div key={minorTopic} className="flex items-center">
                                      <input
                                        id={`modal-minor-${subject.name}-${majorTopic.name}-${minorTopic}`}
                                        type="checkbox"
                                        checked={isMinorTopicSelected(subject.name, majorTopic.name, minorTopic)}
                                        onChange={(e) => handleMinorTopicChange(subject.name, majorTopic.name, minorTopic, e.target.checked)}
                                        disabled={isReadOnly} 
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed"
                                      />
                                      <label
                                        htmlFor={`modal-minor-${subject.name}-${majorTopic.name}-${minorTopic}`}
                                        className={`ml-3 text-sm text-gray-700 ${isReadOnly ? 'cursor-not-allowed text-gray-500' : 'cursor-pointer'}`}
                                      >
                                        {minorTopic}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
                {Object.keys(selectedScope).length > 0 && (
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-900">선택된 범위 요약:</h4>
                  <div className="mt-2 space-y-2">
                    {Object.keys(selectedScope).map((subjectName) => {
                      const allMinorTopics = Object.values(selectedScope[subjectName]).flat();
                      
                      return (
                        <div key={subjectName}>
                          <p className="text-sm font-semibold text-indigo-700">{subjectName}</p>
                          <p className="text-sm text-gray-600">
                            {allMinorTopics.join(', ')}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="rounded-lg bg-white p-6 shadow-lg sm:p-8">
                <h2 className="flex items-center text-xl font-semibold text-gray-800"><ClipboardDocumentListIcon className="h-6 w-6 mr-2 text-indigo-600" />상세 요건</h2>
                <div className="mt-6 space-y-6">
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">요청 수량* (Set)</label>
                    <input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required min="1" disabled={isReadOnly} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed" />
                  </div>
                  <div>
                    <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">컨텐츠 사용 예정일*</label>
                    <input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required disabled={isReadOnly} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed" />
                  </div>
                  <div>
                    <label htmlFor="questionCount" className="block text-sm font-medium text-gray-700">필요한 문항 수*</label>
                    <input id="questionCount" type="text" value={questionCount} onChange={(e) => setQuestionCount(e.target.value)} required disabled={isReadOnly} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed" placeholder="예: 객관식 20문항, 서술형 5문항"/>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-lg sm:p-8">
                <h2 className="flex items-center text-xl font-semibold text-gray-800"><PaperClipIcon className="h-6 w-6 mr-2 text-indigo-600" />추가 사항 및 파일</h2>
                <div className="mt-6 space-y-6">
                  <div>
                    <label htmlFor="optionalDetails" className="block text-sm font-medium text-gray-700">상세 요청 내용 (선택)</label>
                    {/* [수정] 상세 요청 내용도 항상 수정 가능하게 변경 */}
                    <textarea id="optionalDetails" rows={5} value={optionalDetails} onChange={(e) => setOptionalDetails(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="추가 요청사항이나 변경사항이 있다면 언제든 수정해주세요."/>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">첨부 파일 (수정 가능)</label>
                    
                    {/* [수정] 파일 리스트 (삭제 기능 추가) */}
                    {currentFiles.length > 0 ? (
                      <ul className="space-y-2 mb-4">
                        {currentFiles.map((file, idx) => (
                          <li key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline truncate">
                              <PaperClipIcon className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{file.name}</span>
                            </a>
                            <button type="button" onClick={() => handleDeleteFile(idx)} className="text-gray-400 hover:text-red-500 ml-2">
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 mb-4">첨부된 파일이 없습니다.</p>
                    )}

                    {/* [수정] 파일 추가 버튼 (항상 노출) */}
                    <label className="cursor-pointer inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-medium text-indigo-700 border border-indigo-600 shadow-sm hover:bg-indigo-50">
                       {isUploading ? "업로드 중..." : (
                         <>
                           <DocumentArrowUpIcon className="h-4 w-4 mr-2"/>
                           파일 추가하기
                         </>
                       )}
                       <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" onChange={handleAddFiles} className="hidden" disabled={isUploading} />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* --- 모달 푸터 --- */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-300 bg-white rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            닫기
          </button>
          {/* [수정] 저장 버튼은 항상 활성화 (파일/내용 저장을 위해) */}
          <button
            type="button"
            onClick={handleSaveSubmit} 
            disabled={isSaving || isUploading}
            className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSaving ? "저장 중..." : "변경 내용 저장"}
          </button>
        </div>

      </div>
    </div>
  );
}