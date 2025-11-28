// app/service/storage/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // [추가] 라우터 사용
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, deleteDoc, doc, Timestamp } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { 
  FolderIcon, 
  TrashIcon, 
  DocumentTextIcon, 
  CalendarDaysIcon,
  PencilSquareIcon
} from "@heroicons/react/24/outline";

// 저장된 시험지 타입 정의
interface SavedExam {
  id: string;
  title: string;
  createdAt: Timestamp;
  problemCount: number;
  instructorName: string;
}

export default function StoragePage() {
  const { user, loading } = useAuth();
  const router = useRouter(); // [추가]
  const [savedExams, setSavedExams] = useState<SavedExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 목록 불러오기
  const fetchExams = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const q = query(
        collection(db, "saved_exams"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SavedExam));
      setSavedExams(list);
    } catch (err) {
      console.error(err);
      toast.error("목록을 불러오지 못했습니다.");
    }
    setIsLoading(false);
  }, [user]); // user가 변경될 때만 함수 재생성

  // 3. useEffect의 의존성 배열에 fetchExams를 안전하게 넣을 수 있습니다.
  useEffect(() => {
    if (!loading && user) {
      fetchExams();
    }
  }, [loading, user, fetchExams]);

  // [추가] 새 시험지 만들기 핸들러
  const handleCreateNew = () => {
    // 1. 임시 저장 데이터 삭제
    localStorage.removeItem("exam_draft");
    // 2. 삭제가 완료된 후 페이지 이동
    router.push("/service/maker");
  };

  // 삭제 핸들러
  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까? 복구할 수 없습니다.")) return;
    try {
      await deleteDoc(doc(db, "saved_exams", id));
      toast.success("삭제되었습니다.");
      setSavedExams(prev => prev.filter(exam => exam.id !== id));
    } catch (e) {
      toast.error("삭제 실패");
    }
  };

  if (loading) return null;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FolderIcon className="w-8 h-8 text-blue-600" />
            내 시험지 보관함
          </h1>
          <p className="text-slate-500 mt-1">저장한 시험지를 관리하고 다시 편집하세요.</p>
        </div>
        
        {/* [수정] Link 대신 button 사용 */}
        <button 
          onClick={handleCreateNew}
          className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg cursor-pointer"
        >
          + 새 시험지 만들기
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : savedExams.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
          <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-500">저장된 시험지가 없습니다.</h3>
          <p className="text-sm text-gray-400 mt-2">문제은행에서 나만의 시험지를 만들어보세요!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedExams.map((exam) => (
            <div key={exam.id} className="group bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 relative">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <DocumentTextIcon className="w-6 h-6" />
                </div>
                <div className="flex gap-2">
                  {/* [수정] 편집 버튼 활성화 및 링크 연결 */}
                  <Link href={`/service/maker?id=${exam.id}`}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="시험지 수정하기">
                    <PencilSquareIcon className="w-4 h-4" />
                  </Link>
                  <button 
                    onClick={() => handleDelete(exam.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="삭제하기"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1">{exam.title}</h3>
              
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-700">{exam.problemCount}</span> 문항
                </div>
                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                <div className="flex items-center gap-1">
                  <CalendarDaysIcon className="w-3 h-3" />
                  {exam.createdAt?.toDate().toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}