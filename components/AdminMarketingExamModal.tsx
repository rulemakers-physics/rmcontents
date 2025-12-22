// components/AdminMarketingExamModal.tsx

"use client";

import { useState, useEffect } from "react";
import { db, storage } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { MarketingExam, ExamProblemData } from "@/types/marketing";

interface Props {
  exam: MarketingExam | null;
  onClose: () => void;
}

export default function AdminMarketingExamModal({ exam, onClose }: Props) {
  const [id, setId] = useState(exam?.id || "");
  const [title, setTitle] = useState(exam?.title || "");
  const [isActive, setIsActive] = useState(exam?.isActive ?? true);
  
  const [answerText, setAnswerText] = useState("");
  
  const [qFile, setQFile] = useState<File | null>(null);
  const [sFile, setSFile] = useState<File | null>(null);
  const [lectureLink, setLectureLink] = useState(exam?.lectureUrl || "");

  useEffect(() => {
    if (exam && exam.problems) {
      const text = exam.problems.map(p => `${p.number}-${p.answer}-${p.score}`).join('\n');
      setAnswerText(text);
    } else {
      // 1~20번 기본 템플릿
      const template = Array.from({ length: 20 }, (_, i) => `${i + 1}-1-2`).join('\n');
      setAnswerText(template);
    }
  }, [exam]);

  const handleSave = async () => {
    if (!id || !title) return toast.error("ID와 제목은 필수입니다.");

    const problems: ExamProblemData[] = [];
    try {
      const lines = answerText.trim().split('\n');
      lines.forEach(line => {
        const parts = line.split('-');
        if (parts.length < 3) return;
        const num = Number(parts[0]);
        const ans = Number(parts[1]);
        const scr = Number(parts[2]);
        if (!isNaN(num)) problems.push({ number: num, answer: ans, score: scr });
      });
    } catch (e) {
      return toast.error("정답 형식을 확인해주세요.");
    }

    const toastId = toast.loading("저장 중...");

    try {
      let qUrl = exam?.questionPaperUrl || "";
      let sUrl = exam?.solutionPaperUrl || "";

      if (qFile) {
        const fileRef = ref(storage, `marketing_exams/${id}/question_paper.pdf`);
        await uploadBytes(fileRef, qFile);
        qUrl = await getDownloadURL(fileRef);
      }
      if (sFile) {
        const fileRef = ref(storage, `marketing_exams/${id}/solution_paper.pdf`);
        await uploadBytes(fileRef, sFile);
        sUrl = await getDownloadURL(fileRef);
      }

      const totalScore = problems.reduce((acc, p) => acc + p.score, 0);

      const examData = {
        title,
        isActive,
        problems,
        totalQuestions: problems.length,
        totalScore,
        questionPaperUrl: qUrl,
        solutionPaperUrl: sUrl,
        lectureUrl: lectureLink,
        updatedAt: serverTimestamp(),
      };

      // 생성 시에만 createdAt 추가 (병합)
      if (!exam) {
        Object.assign(examData, { createdAt: serverTimestamp() });
      }

      await setDoc(doc(db, "marketing_exams", id), examData, { merge: true });
      
      toast.success("저장되었습니다!", { id: toastId });
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("저장 실패", { id: toastId });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg">{exam ? "시험 수정" : "새 모의고사 생성"}</h3>
          <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-slate-400" /></button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">시험 ID (영문/숫자)</label>
              <input 
                type="text" value={id} onChange={e => setId(e.target.value)} disabled={!!exam}
                className="w-full p-2 border rounded-lg disabled:bg-gray-100 font-mono text-sm" placeholder="예: 2025_march_mock" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">시험 제목</label>
              <input 
                type="text" value={title} onChange={e => setTitle(e.target.value)}
                className="w-full p-2 border rounded-lg text-sm" placeholder="예: 2025학년도 3월 모의고사" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">정답 및 배점 (번호-정답-배점)</label>
            <textarea 
              value={answerText} onChange={e => setAnswerText(e.target.value)}
              className="w-full h-40 p-3 border rounded-lg font-mono text-sm leading-relaxed bg-slate-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">문제지 PDF</label>
              <input type="file" accept=".pdf" onChange={e => setQFile(e.target.files?.[0] || null)} className="text-sm w-full" />
              {exam?.questionPaperUrl && <p className="text-xs text-green-600 mt-1">✓ 파일 등록됨</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">해설지 PDF</label>
              <input type="file" accept=".pdf" onChange={e => setSFile(e.target.files?.[0] || null)} className="text-sm w-full" />
              {exam?.solutionPaperUrl && <p className="text-xs text-green-600 mt-1">✓ 파일 등록됨</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">해설 강의 링크</label>
            <input 
              type="text" value={lectureLink} onChange={e => setLectureLink(e.target.value)}
              className="w-full p-2 border rounded-lg text-sm" placeholder="https://..." 
            />
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" id="isActive" 
              checked={isActive} onChange={e => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-teal-600" 
            />
            <label htmlFor="isActive" className="text-sm font-bold text-slate-700">이 시험을 활성화 (응시 가능)</label>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-200 rounded-lg">취소</button>
          <button onClick={handleSave} className="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800">
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}