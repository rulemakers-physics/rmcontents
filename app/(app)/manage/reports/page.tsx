// app/(app)/manage/reports/page.tsx

"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, query, where, orderBy, getDocs 
} from "firebase/firestore";
import { 
  ChartBarIcon, 
  PlusIcon, 
  DocumentTextIcon, 
  UserGroupIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";
import { ClassData } from "@/types/academy";
import { ExamResultData } from "@/types/grade";
import GradeInputModal from "@/components/GradeInputModal";
import ReportViewModal from "@/components/ReportViewModal";

// useSearchParams를 사용하는 컴포넌트는 반드시 Suspense 경계 안에 있어야 합니다.
function ReportsContent() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  
  // 상태 관리
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [examResults, setExamResults] = useState<ExamResultData[]>([]);
  
  // 모달 상태
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ExamResultData | null>(null);
  
  // URL 파라미터로 전달된 시험지 ID (보관함 연동용)
  const [paramExamId, setParamExamId] = useState<string | undefined>(undefined);

  // 1. 반 목록 불러오기
  useEffect(() => {
    if (!user) return;
    const fetchClasses = async () => {
      try {
        const q = query(
          collection(db, "classes"), 
          where("instructorId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ClassData));
        
        setClasses(list);
        
        // 반이 있으면 첫 번째 반을 기본 선택
        if (list.length > 0 && !selectedClass) {
          setSelectedClass(list[0]);
        }
      } catch (e) {
        console.error("반 목록 로딩 실패", e);
      }
    };
    fetchClasses();
  }, [user, selectedClass]);

  // 2. 선택된 반의 성적 리포트 목록 불러오기
  const fetchExamResults = async () => {
    if (!selectedClass) return;
    try {
      const q = query(
        collection(db, "exam_results"),
        where("classId", "==", selectedClass.id),
        orderBy("date", "desc")
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ExamResultData));
      setExamResults(list);
    } catch (e) {
      console.error("성적 리포트 로딩 실패", e);
    }
  };

  useEffect(() => {
    fetchExamResults();
  }, [selectedClass]);

  // 3. URL 파라미터 감지 및 자동 모달 오픈 (보관함 -> 성적 입력 연동)
  useEffect(() => {
    if (!loading && classes.length > 0) {
      const action = searchParams.get("action");
      const examId = searchParams.get("examId");

      if (action === "input" && examId) {
        setParamExamId(examId);
        // 반이 선택되어 있지 않다면 첫 번째 반으로 자동 선택 (혹은 사용자에게 선택 유도 가능)
        if (!selectedClass) setSelectedClass(classes[0]);
        setIsInputModalOpen(true);
      }
    }
  }, [loading, classes, searchParams, selectedClass]);

  // 핸들러
  const handleOpenReport = (result: ExamResultData) => {
    setSelectedResult(result);
    setIsReportModalOpen(true);
  };

  if (loading) return null;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ChartBarIcon className="w-8 h-8 text-blue-600" />
              성적 분석 리포트
            </h1>
            <p className="text-slate-500 mt-1">학생들의 성적 추이를 분석하고 학부모 상담 자료를 생성합니다.</p>
          </div>
          <button 
            onClick={() => {
              setParamExamId(undefined); // 직접 입력 시 초기화
              setIsInputModalOpen(true);
            }}
            disabled={!selectedClass}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            <PlusIcon className="w-5 h-5" /> 새 성적 입력
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* 좌측: 반 선택 사이드바 */}
          <div className="md:col-span-1 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 px-1">Classes</h3>
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(cls)}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all ${
                  selectedClass?.id === cls.id 
                    ? "bg-white text-blue-600 shadow-md ring-1 ring-blue-100" 
                    : "text-slate-500 hover:bg-white hover:text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="w-4 h-4" />
                  {cls.name}
                </div>
                {selectedClass?.id === cls.id && <ChevronRightIcon className="w-3 h-3" />}
              </button>
            ))}
            {classes.length === 0 && (
              <div className="p-4 text-xs text-slate-400 text-center border border-dashed rounded-xl">
                등록된 반이 없습니다.<br/>반 관리 메뉴에서 먼저 생성해주세요.
              </div>
            )}
          </div>

          {/* 우측: 리포트 목록 */}
          <div className="md:col-span-3">
            {examResults.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                <DocumentTextIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">등록된 시험 결과가 없습니다.</p>
                <p className="text-sm text-slate-400 mt-1">우측 상단 버튼을 눌러 첫 성적을 입력해보세요.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {examResults.map((result) => (
                  <div 
                    key={result.id}
                    onClick={() => handleOpenReport(result)}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <ChartBarIcon className="w-6 h-6" />
                      </div>
                      <span className="text-xs text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded">
                        {result.date?.toDate().toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{result.examTitle}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-600 mt-3">
                      <div>
                        <span className="text-xs text-slate-400 block">응시 인원</span>
                        <span className="font-bold">{result.totalStudents}명</span>
                      </div>
                      <div className="w-px h-8 bg-slate-100"></div>
                      <div>
                        <span className="text-xs text-slate-400 block">반 평균</span>
                        <span className="font-bold text-blue-600">{result.average.toFixed(1)}점</span>
                      </div>
                      <div className="w-px h-8 bg-slate-100"></div>
                      <div>
                        <span className="text-xs text-slate-400 block">최고점</span>
                        <span className="font-bold text-slate-800">{result.highest}점</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 성적 입력 모달 */}
      {isInputModalOpen && selectedClass && (
        <GradeInputModal 
          classData={selectedClass}
          preSelectedExamId={paramExamId} 
          onClose={() => { 
            setIsInputModalOpen(false); 
            setParamExamId(undefined); // ID 초기화
            fetchExamResults(); // 목록 갱신
          }} 
        />
      )}

      {/* 리포트 뷰어 모달 */}
      {isReportModalOpen && selectedResult && (
        <ReportViewModal 
          result={selectedResult} 
          onClose={() => setIsReportModalOpen(false)} 
        />
      )}
    </div>
  );
}

// 메인 페이지 컴포넌트
export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">로딩 중...</div>}>
      <ReportsContent />
    </Suspense>
  );
}