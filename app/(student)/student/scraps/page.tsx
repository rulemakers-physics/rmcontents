// app/(student)/student/scraps/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from "firebase/firestore";
import { 
  BookmarkIcon, TrashIcon, FunnelIcon, ArrowTopRightOnSquareIcon 
} from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolid } from "@heroicons/react/24/solid";
import { toast } from "react-hot-toast";

interface ScrapProblem {
  id: string; // scrap doc id
  problemId: string;
  content: string;
  imgUrl?: string;
  answer: string;
  explanation?: string;
  majorTopic: string;
  examTitle: string; // 어느 시험에서 틀렸는지
  createdAt: any;
}

export default function ScrapbookPage() {
  const { user } = useAuth();
  const [scraps, setScraps] = useState<ScrapProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTopic, setFilterTopic] = useState("All");

  useEffect(() => {
    if (!user) return;
    const fetchScraps = async () => {
      // 실제로는 scraps 컬렉션을 따로 관리하거나, student_exams 내의 wrong answers를 쿼리해야 함.
      // 여기서는 'scraps'라는 별도 컬렉션에 저장된다고 가정 (리포트 페이지에서 '스크랩하기' 버튼 동작 시 저장)
      try {
        const q = query(
          collection(db, "student_scraps"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        setScraps(snap.docs.map(d => ({ id: d.id, ...d.data() } as ScrapProblem)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchScraps();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("스크랩북에서 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, "student_scraps", id));
      setScraps(prev => prev.filter(s => s.id !== id));
      toast.success("삭제되었습니다.");
    } catch (e) {
      toast.error("삭제 실패");
    }
  };

  const filteredScraps = filterTopic === "All" 
    ? scraps 
    : scraps.filter(s => s.majorTopic === filterTopic);

  const uniqueTopics = Array.from(new Set(scraps.map(s => s.majorTopic)));

  if (loading) return <div className="p-10 text-center">로딩 중...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen font-sans">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <BookmarkSolid className="w-8 h-8 text-yellow-400" /> 오답 노트 & 스크랩
          </h1>
          <p className="text-slate-500 mt-2">내가 틀렸거나 중요하게 표시한 문제들을 다시 풀어보세요.</p>
        </div>
        
        {/* 필터 */}
        <div className="relative">
          <select 
            value={filterTopic}
            onChange={(e) => setFilterTopic(e.target.value)}
            className="appearance-none bg-white border border-slate-200 pl-10 pr-8 py-2 rounded-xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm cursor-pointer"
          >
            <option value="All">모든 단원</option>
            {uniqueTopics.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <FunnelIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {scraps.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <BookmarkIcon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">스크랩한 문제가 없습니다.</p>
          <p className="text-xs text-slate-300 mt-1">시험 결과 페이지에서 중요한 문제를 저장해보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredScraps.map((scrap) => (
            <div key={scrap.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                  {scrap.majorTopic}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 truncate max-w-[100px]">{scrap.examTitle}</span>
                  <button onClick={() => handleDelete(scrap.id)} className="text-slate-300 hover:text-red-500 p-1">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="min-h-[150px] mb-4 flex items-center justify-center bg-white">
                   {scrap.imgUrl ? (
                     /* eslint-disable-next-line @next/next/no-img-element */
                     <img src={scrap.imgUrl} alt="문제" className="max-h-[200px] object-contain" />
                   ) : (
                     <p className="text-sm text-slate-700 line-clamp-4">{scrap.content}</p>
                   )}
                </div>
                
                {/* 하단 액션: 정답 보기 / 다시 풀기 (모달 등 연동 가능) */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50">
                   <button className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors">
                     정답/해설 보기
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}