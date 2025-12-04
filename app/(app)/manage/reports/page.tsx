// app/(app)/manage/reports/page.tsx

"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, query, where, orderBy, getDocs, deleteDoc, doc 
} from "firebase/firestore";
import { 
  ChartBarIcon, 
  PlusIcon, 
  DocumentTextIcon, 
  UserGroupIcon,
  ChevronRightIcon,
  ClockIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { ClassData } from "@/types/academy";
import { ExamResultData } from "@/types/grade";
import { WeeklyReport } from "@/types/report"; // types/report.ts 확인 필요
import GradeInputModal from "@/components/GradeInputModal";
import ReportViewModal from "@/components/ReportViewModal";
import WeeklyReportViewer from "@/components/WeeklyReportViewer"; // [New]
import { toast } from "react-hot-toast";

function ReportsContent() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  
  // 상태
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  
  // 탭 상태: 'exam' | 'weekly'
  const [activeTab, setActiveTab] = useState<'exam' | 'weekly'>('exam');

  const [examResults, setExamResults] = useState<ExamResultData[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]); // [New]
  
  // 모달 상태
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [isExamViewerOpen, setIsExamViewerOpen] = useState(false);
  const [isWeeklyViewerOpen, setIsWeeklyViewerOpen] = useState(false); // [New]
  
  const [selectedExamResult, setSelectedExamResult] = useState<ExamResultData | null>(null);
  const [selectedWeeklyReport, setSelectedWeeklyReport] = useState<WeeklyReport | null>(null); // [New]
  
  const [paramExamId, setParamExamId] = useState<string | undefined>(undefined);

  // 1. 반 목록 로드
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
        if (list.length > 0 && !selectedClass) setSelectedClass(list[0]);
      } catch (e) {
        console.error(e);
      }
    };
    fetchClasses();
  }, [user, selectedClass]);

  // 2. 리포트 데이터 로드 (탭에 따라 분기)
  const fetchReports = async () => {
    if (!selectedClass) return;
    try {
      if (activeTab === 'exam') {
        const q = query(
          collection(db, "exam_results"),
          where("classId", "==", selectedClass.id),
          orderBy("date", "desc")
        );
        const snap = await getDocs(q);
        setExamResults(snap.docs.map(d => ({ id: d.id, ...d.data() } as ExamResultData)));
      } else {
        // 주간 리포트 로드
        const q = query(
          collection(db, "weekly_reports"),
          where("classId", "==", selectedClass.id),
          orderBy("weekStartDate", "desc")
        );
        const snap = await getDocs(q);
        setWeeklyReports(snap.docs.map(d => ({ id: d.id, ...d.data() } as WeeklyReport)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedClass, activeTab]);

  // 3. 성적 입력 모달 자동 오픈 (파라미터)
  useEffect(() => {
    if (!loading && classes.length > 0) {
      const action = searchParams.get("action");
      const examId = searchParams.get("examId");
      if (action === "input" && examId) {
        setParamExamId(examId);
        if (!selectedClass) setSelectedClass(classes[0]);
        setIsInputModalOpen(true);
      }
    }
  }, [loading, classes, searchParams, selectedClass]);

  // 핸들러
  const handleDeleteReport = async (collectionName: string, id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
      toast.success("삭제되었습니다.");
      fetchReports();
    } catch (e) {
      toast.error("삭제 실패");
    }
  };

  if (loading) return null;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ChartBarIcon className="w-8 h-8 text-blue-600" />
              리포트 관리 센터
            </h1>
            <p className="text-slate-500 mt-1">시험 성적 분석 및 주간 학습 리포트를 관리합니다.</p>
          </div>
          
          <button 
            onClick={() => {
              setParamExamId(undefined);
              setIsInputModalOpen(true);
            }}
            disabled={!selectedClass}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            <PlusIcon className="w-5 h-5" /> 성적 입력하기
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* 사이드바 (반 목록) */}
          <div className="md:col-span-1 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 px-1">Target Class</h3>
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
          </div>

          {/* 메인 리스트 영역 */}
          <div className="md:col-span-3">
            
            {/* 탭 메뉴 */}
            <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-xl mb-6 w-fit">
              <button
                onClick={() => setActiveTab('exam')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'exam' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                시험 성적표
              </button>
              <button
                onClick={() => setActiveTab('weekly')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'weekly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                주간 리포트
              </button>
            </div>

            {/* A. 시험 성적 리스트 */}
            {activeTab === 'exam' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {examResults.map((result) => (
                  <div 
                    key={result.id}
                    onClick={() => { setSelectedExamResult(result); setIsExamViewerOpen(true); }}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group relative"
                  >
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteReport("exam_results", result.id); }}
                      className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>

                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                        <ChartBarIcon className="w-6 h-6" />
                      </div>
                      <span className="text-xs text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded">
                        {result.date?.toDate().toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{result.examTitle}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-600 mt-3">
                      <div>
                        <span className="text-xs text-slate-400 block">응시</span>
                        <span className="font-bold">{result.totalStudents}명</span>
                      </div>
                      <div className="w-px h-8 bg-slate-100"></div>
                      <div>
                        <span className="text-xs text-slate-400 block">평균</span>
                        <span className="font-bold text-blue-600">{result.average.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {examResults.length === 0 && (
                  <div className="col-span-2 text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
                    등록된 성적 데이터가 없습니다.
                  </div>
                )}
              </div>
            )}

            {/* B. 주간 리포트 리스트 [New] */}
            {activeTab === 'weekly' && (
              <div className="space-y-3">
                {weeklyReports.map((report) => (
                  <div 
                    key={report.id}
                    onClick={() => { setSelectedWeeklyReport(report); setIsWeeklyViewerOpen(true); }}
                    className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <DocumentTextIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          {report.weekStartDate} 주간 리포트
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Published</span>
                        </h4>
                        <p className="text-sm text-slate-500 mt-0.5 line-clamp-1 max-w-md">
                          {report.summary}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right text-xs text-slate-400">
                        <div className="flex items-center gap-1 justify-end mb-1">
                          <ClockIcon className="w-3 h-3" /> 발행일
                        </div>
                        {report.createdAt?.toDate().toLocaleDateString()}
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteReport("weekly_reports", report.id); }}
                        className="p-2 text-slate-300 hover:text-red-500 rounded-lg hover:bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
                {weeklyReports.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
                    발행된 주간 리포트가 없습니다.<br/>
                    대시보드의 Action Center에서 리포트를 작성할 수 있습니다.
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* 모달 1: 성적 입력 */}
      {isInputModalOpen && selectedClass && (
        <GradeInputModal 
          classData={selectedClass}
          preSelectedExamId={paramExamId} 
          onClose={() => { 
            setIsInputModalOpen(false); 
            setParamExamId(undefined); 
            fetchReports(); 
          }} 
        />
      )}

      {/* 모달 2: 성적 뷰어 */}
      {isExamViewerOpen && selectedExamResult && (
        <ReportViewModal 
          result={selectedExamResult} 
          onClose={() => setIsExamViewerOpen(false)} 
        />
      )}

      {/* 모달 3: 주간 리포트 뷰어 [New] */}
      {isWeeklyViewerOpen && selectedWeeklyReport && (
        <WeeklyReportViewer 
          report={selectedWeeklyReport}
          onClose={() => setIsWeeklyViewerOpen(false)}
        />
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReportsContent />
    </Suspense>
  );
}