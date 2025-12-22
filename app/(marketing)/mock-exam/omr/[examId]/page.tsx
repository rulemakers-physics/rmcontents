// app/(marketing)/mock-exam/omr/[examId]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { CheckCircleIcon, PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { MarketingExam } from "@/types/marketing";

export default function MarketingOMRPage() {
  const params = useParams();
  const examId = params.examId as string;
  const router = useRouter();

  const [userInfo, setUserInfo] = useState<{ phone: string; marketing: boolean } | null>(null);
  const [examData, setExamData] = useState<MarketingExam | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. 유저 정보 및 시험지 데이터 로드
  useEffect(() => {
    // 세션 스토리지 체크
    const phone = sessionStorage.getItem("mock_user_phone");
    const marketing = sessionStorage.getItem("mock_marketing_agree") === "true";

    if (!phone) {
      toast.error("잘못된 접근입니다. 정보를 먼저 입력해주세요.");
      router.replace("/mock-exam/enter");
      return;
    }
    setUserInfo({ phone, marketing });

    // 시험지 데이터 로드 (DB 연동)
    const fetchExam = async () => {
      try {
        const docRef = doc(db, "marketing_exams", examId);
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
           const data = snap.data() as MarketingExam;
           if (!data.isActive) {
             toast.error("현재 응시할 수 없는 시험입니다.");
             router.push("/mock-exam");
             return;
           }
           setExamData({ id: snap.id, ...data });
        } else {
           toast.error("존재하지 않는 시험입니다.");
           router.push("/mock-exam");
        }
      } catch (e) {
        console.error(e);
        toast.error("시험 정보를 불러오는데 실패했습니다.");
      }
    };
    fetchExam();
  }, [examId, router]);

  const handleSelect = (qNum: number, choice: number) => {
    setAnswers(prev => ({ ...prev, [qNum]: choice }));
  };

  const handleSubmit = async () => {
    if (!examData || !userInfo) return;

    const answeredCount = Object.keys(answers).length;
    if (answeredCount < examData.problems.length) {
      if (!confirm(`아직 ${examData.problems.length - answeredCount}문제를 풀지 않았습니다. 정말 제출하시겠습니까?`)) return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("채점 중입니다...");

    try {
      let totalScore = 0;
      const results: Record<number, boolean> = {}; 

      examData.problems.forEach((p) => {
        const userAns = answers[p.number] || 0;
        const isCorrect = Number(userAns) === Number(p.answer);
        results[p.number] = isCorrect;
        if (isCorrect) totalScore += p.score;
      });

      const docRef = await addDoc(collection(db, "marketing_exam_results"), {
        examId: examId,
        examTitle: examData.title,
        phone: userInfo.phone,
        marketingAgree: userInfo.marketing,
        score: totalScore,
        answers: answers,
        results: results,
        submittedAt: serverTimestamp(),
      });

      toast.success("채점 완료!", { id: toastId });
      router.replace(`/mock-exam/result/${docRef.id}`);

    } catch (e) {
      console.error(e);
      toast.error("제출 중 오류가 발생했습니다.", { id: toastId });
      setIsSubmitting(false);
    }
  };

  if (!examData) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">시험지 정보를 불러오는 중...</div>;

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 font-sans">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        
        <div className="bg-slate-900 p-6 text-white text-center relative">
          <h1 className="text-xl font-bold mb-1">{examData.title}</h1>
          <p className="text-sm text-slate-400">빠른 정답 입력 & 채점</p>
          <div className="absolute top-6 right-6 text-xs bg-indigo-600 px-2 py-1 rounded font-bold">
            {userInfo?.phone}
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-5 gap-x-2 gap-y-4 sm:gap-x-4">
            <div className="col-span-5 grid grid-cols-6 mb-2 border-b border-slate-200 pb-2 text-center text-xs font-bold text-slate-400">
              <span>No.</span>
              <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
            </div>

            {examData.problems.map((p) => (
              <div key={p.number} className="col-span-5 grid grid-cols-6 items-center py-1 border-b border-slate-50 hover:bg-slate-50">
                <span className="text-center font-bold text-slate-700 text-sm">{p.number}</span>
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleSelect(p.number, num)}
                    className={`mx-auto w-8 h-8 rounded-full text-sm font-bold transition-all ${
                      answers[p.number] === num
                        ? "bg-slate-800 text-white shadow-md scale-110"
                        : "bg-white border border-slate-200 text-slate-400 hover:border-slate-400"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200">
          <div className="flex justify-between items-center mb-4 text-sm text-slate-500">
            <span>입력된 답안: <strong className="text-indigo-600">{Object.keys(answers).length}</strong> / {examData.problems.length}</span>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "채점 중..." : <><PaperAirplaneIcon className="w-5 h-5"/> 채점 결과 확인하기</>}
          </button>
        </div>

      </div>
    </div>
  );
}