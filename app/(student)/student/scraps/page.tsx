"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, Timestamp } from "firebase/firestore";
import { 
  BookmarkIcon, 
  PrinterIcon, 
  TrashIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  LightBulbIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolid } from "@heroicons/react/24/solid";
import { useReactToPrint } from "react-to-print";
import { toast } from "react-hot-toast";
import ExamPaperLayout, { ExamProblem } from "@/components/ExamPaperLayout";
import { TEMPLATES } from "@/types/examTemplates";

interface ScrappedProblem {
  id: string; // doc id (problemId)
  problemId: string;
  content: string;
  imgUrl: string | null;
  answer: string;
  explanation: string | null;
  solutionUrl: string | null;
  majorTopic: string | null;
  scrappedAt: Timestamp;
  sourceExamTitle: string;
}

export default function ScrapbookPage() {
  const { user } = useAuth();
  const [scraps, setScraps] = useState<ScrappedProblem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 정답/해설 토글 상태 관리
  const [openSolutions, setOpenSolutions] = useState<Set<string>>(new Set());

  // PDF 출력용
  const printRef = useRef<HTMLDivElement>(null);

  // 1. 데이터 로드 (실시간 구독)
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "scraps"),
      orderBy("scrappedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ScrappedProblem));
      setScraps(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. 삭제 핸들러
  const handleDelete = async (problemId: string) => {
    if (!user) return;
    if (!confirm("스크랩북에서 삭제하시겠습니까?")) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "scraps", problemId));
      toast.success("삭제되었습니다.");
    } catch (e) {
      console.error(e);
      toast.error("삭제 실패");
    }
  };

  // 3. 해설 토글
  const toggleSolution = (id: string) => {
    const newSet = new Set(openSolutions);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setOpenSolutions(newSet);
  };

  // 4. PDF 출력 핸들러
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "나만의_스크랩북",
  });

  // 5. PDF용 데이터 변환 (페이지네이션 제거)
  const pdfProblems = scraps.map((s, idx) => ({
    id: s.problemId,
    number: idx + 1,
    content: s.content,
    imageUrl: s.imgUrl,
    answer: s.answer,
    solutionUrl: s.solutionUrl,
    difficulty: "Scrap",
    majorTopic: s.majorTopic || ""
  }));

  if (loading) return <div className="p-10 text-center text-slate-400">불러오는 중...</div>;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto min-h-screen bg-slate-50 font-sans">
      
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <BookmarkSolid className="w-8 h-8 text-yellow-500" />
            나만의 스크랩북
          </h1>
          <p className="text-slate-500 mt-1">저장해둔 중요한 문제들을 다시 확인하세요.</p>
        </div>
        
        {scraps.length > 0 && (
          <button 
            onClick={() => handlePrint && handlePrint()}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          >
            <PrinterIcon className="w-5 h-5" /> PDF로 인쇄하기
          </button>
        )}
      </div>

      {/* 목록 */}
      {scraps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
          <BookmarkIcon className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg font-bold">스크랩한 문제가 없습니다.</p>
          <p className="text-sm mt-2">시험 결과 페이지에서 중요한 문제를 저장해보세요!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {scraps.map((item, idx) => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group hover:border-yellow-300 transition-colors">
              
              {/* 문제 헤더 */}
              <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white font-black text-sm">
                    {idx + 1}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-500">출처: {item.sourceExamTitle}</span>
                    <span className="text-xs text-slate-400">{item.scrappedAt?.toDate().toLocaleDateString()} 저장됨</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="삭제"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 문제 본문 */}
              <div className="p-6">
                {item.imgUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imgUrl} alt="문제 이미지" className="max-w-full max-h-[400px] object-contain mx-auto" />
                ) : (
                  <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{item.content}</p>
                )}
              </div>

              {/* 하단 컨트롤 (해설 보기) */}
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
                <button 
                  onClick={() => toggleSolution(item.id)}
                  className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 w-full justify-center"
                >
                  {openSolutions.has(item.id) ? (
                    <>해설 접기 <ChevronUpIcon className="w-4 h-4" /></>
                  ) : (
                    <>정답 및 해설 보기 <ChevronDownIcon className="w-4 h-4" /></>
                  )}
                </button>

                {/* 해설 영역 (아코디언) */}
                {openSolutions.has(item.id) && (
                  <div className="mt-4 pt-4 border-t border-slate-200 animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold bg-slate-800 text-white px-2 py-1 rounded">정답</span>
                      <span className="text-lg font-black text-slate-900">{item.answer}</span>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex gap-3">
                      <LightBulbIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        {item.solutionUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.solutionUrl} alt="해설" className="max-w-full rounded-lg shadow-sm border border-yellow-200" />
                        ) : (
                          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {item.explanation || "해설이 없습니다."}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* [Hidden] PDF 출력용 */}
      <div style={{ display: "none" }}>
        <ExamPaperLayout
          ref={printRef}
          problems={pdfProblems} // [수정] pages -> problems
          title="나만의 스크랩북 (오답노트)"
          instructor={user?.displayName || "학생"}
          template={TEMPLATES[0]}
          printOptions={{ 
            questions: true, 
            answers: true, 
            solutions: true,
            // [수정] 필수값 추가
            questionPadding: 40,
            solutionPadding: 20
          }} 
          isTeacherVersion={false}
        />
      </div>

    </div>
  );
}