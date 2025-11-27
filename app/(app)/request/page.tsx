// app/request/page.tsx

"use client";

import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-hot-toast";

// --- [신규] 아이콘 추가 (BookOpenIcon) ---
import { 
  ChevronDownIcon, 
  DocumentArrowUpIcon,
  InformationCircleIcon, 
  ClipboardDocumentListIcon,
  PaperClipIcon,
  CheckBadgeIcon,
  ClockIcon,
  AcademicCapIcon,
  LockClosedIcon,
  BookOpenIcon,
  XMarkIcon // [신규] 파일 삭제용
} from "@heroicons/react/24/outline";

// --- [신규] 단원 데이터 구조 정의 ---
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


export default function RequestPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // --- 폼 상태 ---
  const [title, setTitle] = useState("");
  const [contentKind, setContentKind] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [questionCount, setQuestionCount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [optionalDetails, setOptionalDetails] = useState("");
  
  // --- [수정] 파일 상태 (단일 -> 배열) ---
  const [files, setFiles] = useState<File[]>([]); 
  
  // --- 단원 선택 폼 상태 ---
  const [openMajorTopics, setOpenMajorTopics] = useState<string[]>([]);
  type SelectedScope = Record<string, Record<string, string[]>>;
  const [selectedScope, setSelectedScope] = useState<SelectedScope>({});
  
  // --- 기존 상태 ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 로그인 보호 로직 (변경 없음)
  useEffect(() => {
    if (loading) return;
    if (!user) {
      toast.error("로그인이 필요한 서비스입니다.");
      router.push("/login");
    }
  }, [user, loading, router]);

  // --- 단원 선택 핸들러 ---

  // 1. 대주제 아코디언을 열고 닫는 토글 핸들러
  const toggleMajorTopic = (majorTopicName: string) => {
    setOpenMajorTopics(prev =>
      prev.includes(majorTopicName)
        ? prev.filter(name => name !== majorTopicName)
        : [...prev, majorTopicName]
    );
  };

  // 2. 중주제 체크박스 토글 핸들러 (데이터 구조에 맞게 수정)
  const handleMinorTopicChange = (
    subjectName: string,
    majorTopicName: string,
    minorTopicName: string,
    isChecked: boolean
  ) => {
    setSelectedScope(prevScope => {
      // 불변성 유지를 위해 깊은 복사
      const newScope = JSON.parse(JSON.stringify(prevScope));

      // 객체 경로 생성
      if (!newScope[subjectName]) {
        newScope[subjectName] = {};
      }
      if (!newScope[subjectName][majorTopicName]) {
        newScope[subjectName][majorTopicName] = [];
      }

      // 체크 여부에 따라 추가 또는 제거
      if (isChecked) {
        newScope[subjectName][majorTopicName].push(minorTopicName);
      } else {
        newScope[subjectName][majorTopicName] = newScope[subjectName][majorTopicName].filter(
          (topic: string) => topic !== minorTopicName
        );
      }

      // 데이터 정리: 빈 배열이나 객체는 삭제
      if (newScope[subjectName][majorTopicName].length === 0) {
        delete newScope[subjectName][majorTopicName];
      }
      if (Object.keys(newScope[subjectName]).length === 0) {
        delete newScope[subjectName];
      }

      return newScope;
    });
  };

  // 3. (헬퍼 함수) 중주제가 현재 선택되었는지 확인
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

  // --- [수정] 파일 핸들러 (여러 파일 처리) ---
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const filesFromInput = e.target.files; // Type is FileList | null
          
    // [수정] null 체크 및 length > 0 체크를 명시적으로 수행
    if (filesFromInput && filesFromInput.length > 0) {
      // Inside this block, filesFromInput is guaranteed to be FileList
      const newFileArray = Array.from(filesFromInput);
      setFiles(prevFiles => [...prevFiles, ...newFileArray]);
    }
  };

  // [신규] 특정 파일 제거 핸들러
  const handleRemoveFile = (indexToRemove: number) => {
    setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };
  // --- [수정] ---

  // --- [수정됨] 폼 제출 핸들러 ---
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("로그인이 필요합니다.");
      return;
    }
    
    // [수정] 단원 선택 유효성 검사 (selectedScope 객체가 비어있는지 확인)
    if (!title || !contentKind || !quantity || !questionCount || !deadline || 
        Object.keys(selectedScope).length === 0) 
    {
      setError("필수 항목(*)을 모두 입력해주세요. (단원 범위 포함)");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // --- [수정] 여러 파일 업로드 로직 ---
      const uploadPromises = files.map(async (file) => {
        const uniqueFileName = `${uuidv4()}-${file.name}`;
        const storagePath = `uploads/requests/${user.uid}/${uniqueFileName}`;
        const fileRef = ref(storage, storagePath);
        await uploadBytes(fileRef, file);
        const fileUrl = await getDownloadURL(fileRef);
        return {
          url: fileUrl,
          path: storagePath,
          name: file.name, // [신규] 원본 파일명도 저장
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      // --- [수정] ---

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      // [수정] Firestore에 여러 파일 정보(객체 배열) 저장
      await addDoc(collection(db, "requests"), {
        instructorId: user.uid,
        instructorName: userData?.name || "이름없음",
        academy: userData?.academy || "학원없음",
        
        // 1. 기본 정보
        title: title,
        contentKind: contentKind,
        
        // 2. 단원 범위 [수정됨]
        scope: selectedScope, // 기존 subject, majorTopic, minorTopics 대신 scope 객체 저장
        
        // 3. 상세 요건
        quantity: parseInt(quantity, 10),
        questionCount: questionCount,
        deadline: deadline,
        
        // 4. 추가 사항
        details: optionalDetails,
        referenceFiles: uploadedFiles, // [{ url, path, name }, ...]

        // 5. 메타데이터
        status: "requested",
        requestedAt: serverTimestamp(),
      });

      toast.success("작업 요청이 성공적으로 제출되었습니다.");
      router.push("/dashboard");

    } catch (err) {
      console.error("요청 제출 중 에러:", err);
      toast.error("제출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setIsSubmitting(false);
    }
  };
  
  // 로딩 및 비로그인 UI (변경 없음)
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-100">로딩 중...</div>
  }
  if (!user) {
    return null;
  }

  // --- [수정된 JSX] ---
  return (
    <div className="min-h-screen bg-gray-100 py-12 sm:py-16">
      <div className="container mx-auto max-w-6xl px-4">
        
        <h1 className="mb-8 text-center text-3xl font-bold text-gray-900">
          새 작업 요청하기
        </h1>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">

          {/* === 왼쪽: 작업 요청 폼 (2/3) === */}
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* --- 섹션 1: 기본 정보 (변경 없음) --- */}
              <div className="rounded-lg bg-white p-6 shadow-lg sm:p-8">
                <h2 className="flex items-center text-xl font-semibold text-gray-800">
                  <InformationCircleIcon className="h-6 w-6 mr-2 text-indigo-600" />
                  기본 정보
                </h2>
                <div className="mt-6 grid grid-cols-1 gap-6">
                  {/* 요청 제목 */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      요청 제목*
                    </label>
                    <input
                      id="title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="예: OO고 2학년 1학기 중간고사 대비"
                    />
                  </div>

                  {/* 컨텐츠 종류 */}
                  <div className="relative">
                    <label htmlFor="contentKind" className="block text-sm font-medium text-gray-700">
                      요청 컨텐츠 종류*
                    </label>
                    <select
                      id="contentKind"
                      value={contentKind}
                      onChange={(e) => setContentKind(e.target.value)}
                      required
                      className="mt-1 block w-full appearance-none rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 pr-10"
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

              {/* --- [교체] 섹션: 컨텐츠 범위 --- */}
              <div className="rounded-lg bg-white p-6 shadow-lg sm:p-8">
                <h2 className="flex items-center text-xl font-semibold text-gray-800">
                  <BookOpenIcon className="h-6 w-6 mr-2 text-indigo-600" />
                  컨텐츠 범위 설정*
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  요청할 컨텐츠의 범위를 모두 선택해주세요. (1개 이상 필수)
                </p>
                
                <div className="mt-4 space-y-4">
                  {/* 'scienceUnits' 데이터를 순회 */}
                  {scienceUnits.map((subject) => (
                    <div key={subject.name} className="rounded-md border border-gray-200">
                      
                      {/* 과목명 헤더 */}
                      <h3 className="bg-gray-50 px-4 py-3 text-lg font-medium text-gray-900 rounded-t-md">
                        {subject.name}
                      </h3>
                      
                      <div className="divide-y divide-gray-200">
                        {/* 해당 과목의 대주제들을 순회 */}
                        {subject.majorTopics.map((majorTopic) => {
                          const isOpen = openMajorTopics.includes(majorTopic.name);
                          return (
                            <div key={majorTopic.name}>
                              
                              {/* 대주제 (Accordion Toggle Button) */}
                              <button
                                type="button" // 폼 제출 방지
                                onClick={() => toggleMajorTopic(majorTopic.name)}
                                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-indigo-700 hover:bg-indigo-50 focus:outline-none"
                              >
                                <span>{majorTopic.name}</span>
                                <ChevronDownIcon
                                  className={`h-5 w-5 transform transition-transform ${
                                    isOpen ? "rotate-180" : ""
                                  }`}
                                />
                              </button>
                              
                              {/* 중주제 목록 (Accordion Content) */}
                              {isOpen && (
                                <div className="border-t border-gray-200 bg-white p-4">
                                  <div className="flex flex-col space-y-1">
                                    {majorTopic.minorTopics.map((minorTopic) => (
                                      <div key={minorTopic} className="flex items-center">
                                        <input
                                          id={`minor-${subject.name}-${majorTopic.name}-${minorTopic}`}
                                          name="minorTopic"
                                          type="checkbox"
                                          value={minorTopic}
                                          // 'isMinorTopicSelected' 헬퍼 함수로 checked 상태 관리
                                          checked={isMinorTopicSelected(
                                            subject.name,
                                            majorTopic.name,
                                            minorTopic
                                          )}
                                          // 핸들러에 모든 식별자 전달
                                          onChange={(e) => handleMinorTopicChange(
                                            subject.name,
                                            majorTopic.name,
                                            minorTopic,
                                            e.target.checked
                                          )}
                                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label
                                          htmlFor={`minor-${subject.name}-${majorTopic.name}-${minorTopic}`}
                                          className="ml-3 text-sm text-gray-700 cursor-pointer"
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
              </div>
              {Object.keys(selectedScope).length > 0 && (
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-900">선택된 범위 요약:</h4>
                  <div className="mt-2 space-y-2">
                    {/* selectedScope의 subject 키('통합과학 1' 등)들을 순회 */}
                    {Object.keys(selectedScope).map((subjectName) => {
                      // 해당 subject의 모든 major topic에 속한 minor topic들을 하나의 배열로 합침
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
              {/* --- 섹션 2 (구): 상세 요건 (변경 없음) --- */}
              <div className="rounded-lg bg-white p-6 shadow-lg sm:p-8">
                <h2 className="flex items-center text-xl font-semibold text-gray-800">
                  <ClipboardDocumentListIcon className="h-6 w-6 mr-2 text-indigo-600" />
                  상세 요건
                </h2>
                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* 요청 수량 */}
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                      요청 수량* (ex.모의고사 2회분이면 2)
                    </label>
                    <input
                      id="quantity"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                      min="1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  {/* 컨텐츠 사용 예정일 */}
                  <div>
                    <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
                      컨텐츠 사용 예정일*
                    </label>
                    <input
                      id="deadline"
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="컨텐츠가 전달되어야하는 시점"
                    />
                     <p className="mt-1 text-xs text-gray-500">컨텐츠가 전달되어야하는 시점을 작성해주세요.</p>
                  </div>
                  {/* 필요한 문항 수 (2열 모두 차지) */}
                  <div className="md:col-span-2">
                    <label htmlFor="questionCount" className="block text-sm font-medium text-gray-700">
                      필요한 문항 수*
                    </label>
                    <input
                      id="questionCount"
                      type="text"
                      value={questionCount}
                      onChange={(e) => setQuestionCount(e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="예: 객관식 20문항, 서술형 5문항"
                    />
                    <p className="mt-1 text-xs text-gray-500">객관식, 서술형 등 원하시는 내용을 같이 작성해주셔도 좋습니다.</p>
                  </div>
                </div>
              </div>

              {/* --- [수정] 섹션 3: 추가 사항 (파일 업로드 UI 변경) --- */}
              <div className="rounded-lg bg-white p-6 shadow-lg sm:p-8">
                <h2 className="flex items-center text-xl font-semibold text-gray-800">
                  <PaperClipIcon className="h-6 w-6 mr-2 text-indigo-600" />
                  추가 사항
                </h2>
                <div className="mt-6 grid grid-cols-1 gap-6">
                  {/* 상세 요청 내용 (선택) */}
                  <div>
                    <label htmlFor="optionalDetails" className="block text-sm font-medium text-gray-700">
                      상세 요청 내용 (선택)
                    </label>
                    <textarea
                      id="optionalDetails"
                      rows={5}
                      value={optionalDetails}
                      onChange={(e) => setOptionalDetails(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="특정 유형, 스타일, 반드시 포함해야 할 개념 등 원하시는 내용을 기입해주세요."
                    />
                  </div>
                  
                  {/* [수정] 파일 업로드 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      참고 파일 (선택)
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      학교 기출 문제, 참고 자료 등 (PDF, PNG, JPG, JPEG)
                    </p>
                    
                    {/* 파일 목록 */}
                    {files.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between rounded-md bg-gray-100 p-2">
                            <span className="text-sm text-gray-700 truncate pr-2">
                              {file.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(index)}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 파일 선택 버튼 */}
                    <div className="mt-4">
                      <label 
                        htmlFor="file" 
                        className="cursor-pointer rounded-md bg-white px-4 py-2 text-sm font-medium text-indigo-700 border border-indigo-600 shadow-sm hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        <DocumentArrowUpIcon className="inline-block h-5 w-5 mr-2 -ml-1" />
                        파일 추가하기
                      </label>
                      <input
                        id="file"
                        type="file"
                        // [수정] multiple, accept 속성 변경
                        multiple 
                        accept=".pdf,.png,.jpg,.jpeg" 
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* --- [수정] --- */}


              {/* 에러 메시지 및 제출 버튼 (변경 없음) */}
              <div className="mt-8">
                {error && (
                  <p className="text-center text-sm text-red-600 mb-4">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "제출 중..." : "작업 요청하기"}
                </button>
              </div>
            </form>
          </div>

          {/* === 오른쪽 사이드바 (변경 없음) === */}
          <div className="md:col-span-1">
            <div className="md:sticky md:top-24 space-y-6">
              {/* [추가] 단원 선택 가이드 (스크롤 따라옴) */}
              <div className="rounded-lg bg-indigo-900 p-6 shadow-lg text-white">
                <h3 className="flex items-center text-lg font-bold">
                  <BookOpenIcon className="h-5 w-5 mr-2 text-yellow-400" />
                  단원 선택 가이드
                </h3>
                <div className="mt-4 space-y-3 text-sm text-indigo-100">
                  <p>
                    <span className="font-bold text-white">Tip 1.</span><br/>
                      출판사마다 단원 구성이 다를 수 있습니다. 주제명을 기준으로 선택해주세요.
                  </p>
                  <p>
                    <span className="font-bold text-white">Tip 2.</span><br/>
                    <span className="underline decoration-yellow-400/50 underline-offset-4">시험 범위가 겹치는 경우</span>,
                    해당되는 모든 소단원을 넉넉하게 체크해주시는 것이 좋습니다.
                    </p>
                    <p className="pt-2 text-xs opacity-80 border-t border-indigo-700">
                      * 선택하신 범위 내에서 문항 선별 및 난이도 조정이 이루어집니다.
                    </p>
                  </div>
                </div>
              {/* 핵심 가치 카드 */}
              <div className="rounded-lg bg-white p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900">
                  RuleMakers의 약속
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  최고의 컨텐츠를 만들기 위한 3가지 원칙입니다.
                </p>
                <ul className="mt-4 space-y-3">
                  <li className="flex items-start">
                    <CheckBadgeIcon className="h-5 w-5 flex-shrink-0 text-indigo-500 mt-0.5" />
                    <span className="ml-3 text-sm text-gray-700">
                      <span className="font-medium">100% 맞춤형 제작:</span> 요청주신 사항을 정확히 반영하며, 고객님만을 위한 컨텐츠를 제작합니다.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <ClockIcon className="h-5 w-5 flex-shrink-0 text-indigo-500 mt-0.5" />
                    <span className="ml-3 text-sm text-gray-700">
                      <span className="font-medium">신속한 컨텐츠 제공:</span> 요청일로부터 3일 내로 전달드립니다.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <AcademicCapIcon className="h-5 w-5 flex-shrink-0 text-indigo-500 mt-0.5" />
                    <span className="ml-3 text-sm text-gray-700">
                      <span className="font-medium">전문가 검수:</span> 전문가의 세밀한 검수로 퀄리티를 보장드립니다.
                    </span>
                  </li>
                </ul>
              </div>
              {/* 보안 및 안내 카드 */}
              <div className="rounded-lg bg-indigo-50 p-6 border border-indigo-200">
                 <h3 className="text-lg font-semibold text-gray-900">
                  궁금한 점이 있으신가요?
                </h3>
                <p className="mt-2 text-sm text-gray-700">
                  요청서 작성에 어려움이 있거나 특별히 요청하실 사항이 있다면 언제든 문의 채널로 연락주세요.
                </p>
                <div className="mt-4 flex items-center text-sm text-gray-700">
                  <LockClosedIcon className="h-5 w-5 flex-shrink-0 text-gray-500" />
                  <span className="ml-2">모든 요청 내용과 자료는 기밀로 유지됩니다.</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}