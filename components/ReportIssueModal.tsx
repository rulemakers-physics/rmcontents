// components/ReportIssueModal.tsx

"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { XMarkIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

interface ReportIssueModalProps {
  problemId: string;
  problemContent?: string; // 문제 내용 요약 (식별용)
  onClose: () => void;
}

const REPORT_TYPES = [
  "오타/탈자",
  "정답 오류",
  "이미지 깨짐/안 보임",
  "단원/난이도 분류 오류",
  "기타"
];

export default function ReportIssueModal({ problemId, problemContent, onClose }: ReportIssueModalProps) {
  const { user } = useAuth();
  const [reportType, setReportType] = useState(REPORT_TYPES[0]);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    if (!description.trim()) {
      toast.error("상세 내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "reports"), {
        problemId,
        problemContent: problemContent || "내용 없음",
        reporterId: user.uid,
        reporterName: user.displayName || user.email || "익명",
        type: reportType,
        description,
        status: "pending", // pending(대기) -> resolved(처리완료) -> ignored(무시)
        createdAt: serverTimestamp(),
      });
      
      toast.success("소중한 제보 감사합니다. 검토 후 반영하겠습니다.");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("신고 접수 중 오류가 발생했습니다.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        {/* 헤더 */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-red-50">
          <div className="flex items-center gap-2 text-red-600">
            <ExclamationTriangleIcon className="w-6 h-6" />
            <h3 className="text-lg font-bold">문항 오류 신고</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* 바디 */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">오류 유형</label>
            <div className="grid grid-cols-2 gap-2">
              {REPORT_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setReportType(type)}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                    reportType === type 
                      ? "bg-red-600 text-white border-red-600" 
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">상세 내용</label>
            <textarea
              className="w-full h-32 p-3 text-sm border border-slate-200 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none"
              placeholder="오류 내용을 자세히 적어주시면 수정에 큰 도움이 됩니다."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* 푸터 */}
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
          >
            취소
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? "접수 중..." : "신고하기"}
          </button>
        </div>
      </div>
    </div>
  );
}