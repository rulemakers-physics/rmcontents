// app/(app)/admin/problems/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  startAfter, 
  where, 
  DocumentData, 
  QueryDocumentSnapshot,
  Timestamp
} from "firebase/firestore";
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  PencilSquareIcon,
  PhotoIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon // [신규] 아이콘
} from "@heroicons/react/24/outline";
import AdminProblemEditModal from "@/components/AdminProblemEditModal";
import ProblemLogHistoryModal from "@/components/ProblemLogHistoryModal"; // [신규] 컴포넌트 임포트
import { toast } from "react-hot-toast";

// 문제 타입 정의
export interface Problem {
  id: string;
  filename: string;
  majorTopic: string;
  minorTopic: string;
  difficulty: string;
  imgUrl: string;
  answer?: string;
  createdAt?: Timestamp;
}

export default function AdminProblemsPage() {
  const { user, loading } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // 필터 및 검색 상태
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // 모달 상태
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false); // [신규] 전체 이력 모달 상태

  // 데이터 로드 함수
  const fetchProblems = async (isInitial = false) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const problemsRef = collection(db, "problems");
      let q;

      if (searchTerm.trim() !== "") {
        q = query(
          problemsRef,
          where("filename", ">=", searchTerm),
          where("filename", "<=", searchTerm + "\uf8ff"),
          orderBy("filename"),
          limit(20)
        );
      } else {
        if (difficultyFilter !== "all") {
          q = query(
            problemsRef, 
            where("difficulty", "==", difficultyFilter), 
            orderBy("createdAt", "desc"), 
            limit(20)
          );
        } else {
          q = query(
            problemsRef, 
            orderBy("createdAt", "desc"), 
            limit(20)
          );
        }
      }

      if (!isInitial && lastDoc && searchTerm.trim() === "") {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      
      const newProblems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Problem));

      if (snapshot.docs.length < 20) setHasMore(false);
      else setHasMore(true);
      
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setProblems(prev => isInitial ? newProblems : [...prev, ...newProblems]);

    } catch (error) {
      console.error("문제 로딩 실패:", error);
      toast.error("데이터를 불러오지 못했습니다.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user?.isAdmin) {
      const timer = setTimeout(() => {
        setHasMore(true);
        setLastDoc(null);
        fetchProblems(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, difficultyFilter, searchTerm]);

  const handleEdit = (problem: Problem) => {
    setSelectedProblem(problem);
    setIsModalOpen(true);
  };

  const handleCloseModal = (needsRefresh = false) => {
    setIsModalOpen(false);
    setSelectedProblem(null);
    if (needsRefresh) {
      fetchProblems(true);
    }
  };

  if (loading || !user?.isAdmin) return <div className="p-8 text-center">접근 권한 확인 중...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">문제 DB 관리</h1>
            <p className="text-slate-500 text-sm mt-1">등록된 문항을 조회하고 메타데이터를 수정합니다.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* [신규] 전체 이력 버튼 */}
            <button
              onClick={() => setShowFullHistory(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm"
            >
              <ClipboardDocumentListIcon className="w-4 h-4" />
              전체 이력
            </button>

            {/* 검색창 */}
            <div className="relative">
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="문항 코드(파일명) 검색" 
                className="pl-10 pr-4 py-2.5 w-full sm:w-64 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm transition-all"
              />
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* 난이도 필터 */}
            <div className="relative">
              <select 
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="appearance-none pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm cursor-pointer"
              >
                <option value="all">모든 난이도</option>
                <option value="기본">기본</option>
                <option value="하">하</option>
                <option value="중">중</option>
                <option value="상">상</option>
                <option value="킬러">킬러</option>
              </select>
              <FunnelIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <button 
              onClick={() => {
                setSearchTerm("");
                setDifficultyFilter("all");
              }}
              className="p-2.5 bg-white border border-gray-200 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm"
              title="필터 초기화"
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 문제 그리드 */}
        {problems.length === 0 && !isLoading ? (
          <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300">
            <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>검색 결과가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {problems.map((problem) => (
              <div key={problem.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                {/* 이미지 영역 */}
                <div className="relative h-48 bg-slate-100 border-b border-slate-100 cursor-pointer" onClick={() => handleEdit(problem)}>
                  {problem.imgUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={problem.imgUrl} alt={problem.filename} className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      <PhotoIcon className="w-10 h-10" />
                    </div>
                  )}
                  {/* 호버 시 수정 오버레이 */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-bold flex items-center gap-2">
                      <PencilSquareIcon className="w-5 h-5" /> 수정하기
                    </span>
                  </div>
                </div>

                {/* 정보 영역 */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      problem.difficulty === '킬러' ? 'bg-red-50 text-red-600 border-red-100' : 
                      problem.difficulty === '상' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                      'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      {problem.difficulty}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[100px]" title={problem.filename}>
                      {problem.filename}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1 line-clamp-1" title={problem.minorTopic}>
                    {problem.minorTopic || "단원 미분류"}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-1">
                    {problem.majorTopic}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 더보기 버튼 */}
        {hasMore && searchTerm === "" && problems.length > 0 && (
          <div className="mt-8 text-center">
            <button 
              onClick={() => fetchProblems()} 
              disabled={isLoading}
              className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
            >
              {isLoading ? "로딩 중..." : "더 불러오기"}
            </button>
          </div>
        )}

        {/* 수정 모달 */}
        {isModalOpen && selectedProblem && (
          <AdminProblemEditModal 
            problem={selectedProblem} 
            onClose={handleCloseModal} 
          />
        )}

        {/* [신규] 전체 이력 모달 */}
        {showFullHistory && (
          <ProblemLogHistoryModal onClose={() => setShowFullHistory(false)} />
        )}

      </div>
    </div>
  );
}