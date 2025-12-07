// app/(student)/student/storage/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, deleteDoc, doc, Timestamp } from "firebase/firestore";
import { 
  FolderIcon, 
  TrashIcon, 
  PrinterIcon, 
  PlayIcon, 
  DocumentTextIcon, 
  CalendarDaysIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import ExamPrintModal from "@/components/ExamPrintModal";

interface StudentExam {
  id: string;
  title: string;
  createdAt: Timestamp;
  totalQuestions: number;
  difficulty: string;
  userName: string; // 학생 이름
  status: string;
  mode: string;
  problems?: any[];
}

export default function StudentStoragePage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  
  const [exams, setExams] = useState<StudentExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [printTarget, setPrintTarget] = useState<StudentExam | null>(null);

  // 데이터 로드
  useEffect(() => {
    if (!user) return;
    
    const fetchExams = async () => {
      setIsLoading(true);
      try {
        const q = query(
          collection(db, "student_exams"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentExam));
        setExams(list);
      } catch (e) {
        console.error(e);
        toast.error("목록을 불러오지 못했습니다.");
      }
      setIsLoading(false);
    };

    fetchExams();
  }, [user]);

  // 시험지 삭제
  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까? 학습 기록도 함께 삭제됩니다.")) return;
    try {
      await deleteDoc(doc(db, "student_exams", id));
      setExams(prev => prev.filter(e => e.id !== id));
      toast.success("삭제되었습니다.");
    } catch (e) {
      toast.error("삭제 실패");
    }
  };

  // 인쇄 모달 열기 (데이터 매핑)
  const handleOpenPrint = (exam: StudentExam) => {
    setPrintTarget(exam);
  };

  // CBT 응시 페이지로 이동 (재응시 or 이어서 풀기)
  const handleTakeExam = (exam: StudentExam) => {
    if (exam.status === 'completed') {
      if (confirm("이미 완료된 시험입니다. 결과를 보시겠습니까?\n(취소 시 재응시 페이지로 이동)")) {
        router.push(`/student/report/${exam.id}`);
        return;
      }
    }
    router.push(`/student/study/take?examId=${exam.id}`);
  };

  if (loading) return <div className="p-10 text-center">로딩 중...</div>;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen bg-slate-50">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FolderIcon className="w-8 h-8 text-emerald-600" />
            내 시험지 보관함
          </h1>
          <p className="text-slate-500 mt-1">내가 만든 시험지를 저장하고, 언제든 다시 풀거나 인쇄할 수 있습니다.</p>
        </div>
        <Link 
          href="/student/maker"
          className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg flex items-center gap-2"
        >
          <DocumentTextIcon className="w-5 h-5" /> 새 시험지 만들기
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <FolderIcon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">보관된 시험지가 없습니다.</p>
          <Link href="/student/maker" className="text-emerald-600 font-bold hover:underline mt-2 inline-block">
            첫 시험지 만들러 가기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div key={exam.id} className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative flex flex-col justify-between h-full">
              
              {/* 카드 헤더 */}
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <DocumentTextIcon className="w-6 h-6" />
                </div>
                <div className="flex gap-1">
                   <button 
                      onClick={() => handleOpenPrint(exam)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="인쇄 및 PDF 저장"
                   >
                     <PrinterIcon className="w-5 h-5" />
                   </button>
                   <button 
                      onClick={() => handleDelete(exam.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="삭제"
                   >
                     <TrashIcon className="w-5 h-5" />
                   </button>
                </div>
              </div>
              
              {/* 정보 */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    exam.mode === 'test' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>
                    {exam.mode === 'test' ? '실전 모드' : '연습/출력'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {exam.createdAt?.toDate().toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                  {exam.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                  <span>{exam.totalQuestions}문항</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span>난이도: {exam.difficulty}</span>
                </div>
              </div>

              {/* 하단 액션 */}
              <div className="pt-4 border-t border-slate-100 mt-auto">
                <button 
                  onClick={() => handleTakeExam(exam)}
                  className="w-full py-2.5 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-sm active:scale-95"
                >
                  <PlayIcon className="w-4 h-4" /> 
                  {exam.status === 'completed' ? '결과 보기 / 다시 풀기' : '문제 풀기 (CBT)'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 인쇄 모달 (재사용) */}
      {printTarget && (
        <ExamPrintModal 
          exam={{
            ...printTarget,
            instructorName: printTarget.userName, // 학생 이름을 강사 이름 위치에 매핑
            // [수정] DB의 imgUrl을 출력 컴포넌트용 imageUrl로 매핑
            problems: printTarget.problems?.map((p: any) => ({
              ...p,
              id: p.problemId || p.id,       // ID 안전 장치
              imageUrl: p.imgUrl || p.imageUrl, // [핵심] 필드명 변환
              solutionUrl: p.solutionUrl
            }))
          }}
          onClose={() => setPrintTarget(null)} 
        />
      )}

    </div>
  );
}