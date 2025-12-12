// components/ReviewExamBuilderModal.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, limit } from "firebase/firestore";
import { 
  SparklesIcon, XMarkIcon, ArrowPathIcon
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { DBProblem } from "@/types/problem";

interface Props {
  studentName: string;
  sourceExamTitle: string;
  wrongProblems: { id: string, number: number }[]; // [수정] 타입 명시
  onClose: () => void;
}

export default function ReviewExamBuilderModal({ studentName, sourceExamTitle, wrongProblems, onClose }: Props) {
  const { user } = useAuth();
  const router = useRouter();

  const [includeOriginal, setIncludeOriginal] = useState(true);
  const [multiplier, setMultiplier] = useState(1); 
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCreate = async () => {
    if (!user) return;
    if (wrongProblems.length === 0) return toast.error("틀린 문제가 없습니다.");

    setIsProcessing(true);
    const toastId = toast.loading("문제 분석 및 클리닉 생성 중...");

    try {
      const newProblems: any[] = [];
      // [신규] 중복 방지를 위한 ID Set
      const addedProblemIds = new Set<string>();
      
      let problemCounter = 1;

      for (const wp of wrongProblems) {
        const pDoc = await getDoc(doc(db, "problems", wp.id));
        if (!pDoc.exists()) continue;
        const pData = { id: pDoc.id, ...pDoc.data() } as DBProblem;

        // (A) 틀린 문제 포함 (원본)
        if (includeOriginal) {
          // [체크] 이미 추가된 문제라면 건너뜀 (한 시험지 내 중복 방지)
          if (!addedProblemIds.has(pData.id)) {
            newProblems.push({
              id: pData.id,
              number: problemCounter++,
              content: pData.content || "",
              imageUrl: pData.imgUrl || null,
              answer: pData.answer || "",
              solutionUrl: pData.solutionUrl || null,
              difficulty: pData.difficulty || "중",
              majorTopic: pData.majorTopic || "",
              minorTopic: pData.minorTopic || "",
              height: pData.imgHeight || 100, 
              solutionHeight: pData.solutionHeight || 50,
              customLabel: `[오답] ${sourceExamTitle} Q.${wp.number}`,
              tag: "오답"
            });
            addedProblemIds.add(pData.id);
          }
        }

        // (B) 유사 문항 검색 (배수만큼)
        let addedSimilarCount = 0; // 현재 문제에 대해 추가된 유사 문항 수
        let tryIndex = 0; // similarProblems 배열 탐색 인덱스

        // 목표 개수(multiplier)만큼 채우거나, 시도 횟수가 너무 많아지면 중단
        while (addedSimilarCount < multiplier && tryIndex < 10) { // 안전장치: 최대 10번 시도
          let similarData: DBProblem | null = null;
          
          // 1. DB에 저장된 유사 문항 리스트 활용
          if (pData.similarProblems && pData.similarProblems.length > tryIndex) {
            const targetSim = pData.similarProblems[tryIndex];
            
            // [최적화] 여기서 targetFilename이 이미 있는지 체크할 순 없지만(ID를 모르므로),
            // 일단 가져와서 체크합니다.
            const simQ = query(collection(db, "problems"), where("filename", "==", targetSim.targetFilename));
            const simSnap = await getDocs(simQ);
            
            if (!simSnap.empty) {
              const candidate = { id: simSnap.docs[0].id, ...simSnap.docs[0].data() } as DBProblem;
              
              // [핵심] 중복 체크: 이미 추가된 ID거나, 원본 문제 ID와 같다면 사용 불가
              if (!addedProblemIds.has(candidate.id) && candidate.id !== pData.id) {
                similarData = candidate;
              }
            }
          }
          
          // 2. 유사 문항이 없거나 중복이어서 실패했다면 -> Fallback 검색 (같은 단원 & 난이도)
          if (!similarData) {
            const fallbackQ = query(
              collection(db, "problems"),
              where("minorTopic", "==", pData.minorTopic),
              where("difficulty", "==", pData.difficulty),
              limit(20) // 넉넉히 가져와서 필터링
            );
            const fallbackSnap = await getDocs(fallbackQ);
            
            const candidates = fallbackSnap.docs.map(d => ({ id: d.id, ...d.data() } as DBProblem));
            
            // 사용 가능한(중복되지 않은) 후보들만 필터링
            const validCandidates = candidates.filter(c => 
              c.id !== pData.id && !addedProblemIds.has(c.id)
            );
            
            if (validCandidates.length > 0) {
              // 랜덤 선택
              similarData = validCandidates[Math.floor(Math.random() * validCandidates.length)];
            }
          }

          // 3. 최종 추가
          if (similarData) {
            newProblems.push({
              id: similarData.id,
              number: problemCounter++,
              content: similarData.content || "",
              imageUrl: similarData.imgUrl || null,
              answer: similarData.answer || "",
              solutionUrl: similarData.solutionUrl || null,
              difficulty: similarData.difficulty || "중",
              majorTopic: similarData.majorTopic || "",
              minorTopic: similarData.minorTopic || "",
              height: similarData.imgHeight || 100,
              solutionHeight: similarData.solutionHeight || 50,
              customLabel: `[유사] ${sourceExamTitle} Q.${wp.number} 변형`,
              tag: "유사"
            });
            addedProblemIds.add(similarData.id); // ID 등록
            addedSimilarCount++; // 카운트 증가
          }
          
          tryIndex++; // 다음 인덱스 시도
        }
      }

      if (newProblems.length === 0) {
        toast.error("생성할 문제가 없습니다.", { id: toastId });
        setIsProcessing(false);
        return;
      }

      const newTitle = `[클리닉] ${studentName} - ${sourceExamTitle}`;
      
      const docRef = await addDoc(collection(db, "saved_exams"), {
        userId: user.uid,
        title: newTitle,
        instructorName: user.displayName || "선생님",
        problems: newProblems,
        problemCount: newProblems.length,
        createdAt: serverTimestamp(),
        templateId: "math-pro",
        layoutMode: "dense",
        questionPadding: 40,
        isClinic: true 
      });

      toast.success("클리닉 시험지가 생성되었습니다!", { id: toastId });
      router.push(`/service/maker?id=${docRef.id}`);

    } catch (e) {
      console.error("클리닉 생성 오류:", e);
      toast.error("생성 중 오류가 발생했습니다.", { id: toastId });
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-indigo-600" />
              AI 오답 클리닉 생성
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {studentName} 학생의 오답 {wrongProblems.length}개 분석
            </p>
          </div>
          <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-slate-400" /></button>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-bold text-slate-700 text-sm">틀린 문제 다시 풀기</span>
              <div 
                onClick={() => setIncludeOriginal(!includeOriginal)}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${includeOriginal ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${includeOriginal ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </label>
            <p className="text-xs text-slate-400 mt-2">체크 시, 시험지 앞부분에 학생이 틀렸던 원본 문제가 배치됩니다.</p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 text-sm mb-3">문항당 유사 문제 수</label>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(num => (
                <button
                  key={num}
                  onClick={() => setMultiplier(num)}
                  className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                    multiplier === num 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200' 
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {num}배수
                </button>
              ))}
            </div>
            <p className="text-xs text-center text-slate-400 mt-2">
              예상 문항 수: {(includeOriginal ? wrongProblems.length : 0) + (wrongProblems.length * multiplier)}문제
            </p>
          </div>

          <button 
            onClick={handleCreate}
            disabled={isProcessing}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isProcessing ? "생성 중..." : (
              <>
                <ArrowPathIcon className="w-5 h-5" /> 클리닉 생성하기
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}