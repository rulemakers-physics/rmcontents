// components/AdminNoticeModal.tsx

"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Notice, NoticeCategory } from "@/types/notice";

interface Props {
  notice: Notice | null;
  onClose: (refresh?: boolean) => void;
}

export default function AdminNoticeModal({ notice, onClose }: Props) {
  const [title, setTitle] = useState(notice?.title || "");
  const [content, setContent] = useState(notice?.content || "");
  const [category, setCategory] = useState<NoticeCategory>(notice?.category || "공지");
  const [isImportant, setIsImportant] = useState(notice?.isImportant || false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title || !content) return toast.error("내용을 입력해주세요.");
    
    setIsSaving(true);
    try {
      const data = {
        title,
        content,
        category,
        isImportant,
        authorName: "관리자",
        // createdAt은 수정 시 업데이트 하지 않음 (필요 시 updatedAt 추가)
      };

      if (notice) {
        await updateDoc(doc(db, "notices", notice.id), data);
        toast.success("수정되었습니다.");
      } else {
        await addDoc(collection(db, "notices"), {
          ...data,
          createdAt: serverTimestamp(),
          views: 0
        });
        toast.success("등록되었습니다.");
      }
      onClose(true);
    } catch (e) {
      console.error(e);
      toast.error("저장 실패");
    }
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-slate-900">{notice ? "공지 수정" : "새 공지 작성"}</h3>
          <button onClick={() => onClose()}><XMarkIcon className="w-6 h-6 text-slate-400" /></button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex gap-4">
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value as NoticeCategory)}
              className="p-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600"
            >
              <option value="공지">공지</option>
              <option value="업데이트">업데이트</option>
              <option value="점검">점검</option>
              <option value="이벤트">이벤트</option>
            </select>
            <label className="flex items-center gap-2 cursor-pointer p-2 border border-slate-200 rounded-lg hover:bg-slate-50">
              <input type="checkbox" checked={isImportant} onChange={(e) => setIsImportant(e.target.checked)} className="rounded text-blue-600" />
              <span className="text-sm font-bold text-slate-600">상단 고정 (중요)</span>
            </label>
          </div>

          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력하세요..."
            className="w-full p-3 h-64 border border-slate-200 rounded-xl text-slate-700 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
          <button onClick={() => onClose()} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-lg">취소</button>
          <button 
            onClick={handleSubmit} 
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? "저장 중..." : "저장하기"}
          </button>
        </div>
      </div>
    </div>
  );
}