// app/(app)/board/notices/page.tsx

"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { MegaphoneIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Notice } from "@/types/notice";

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Notice));
      
      // 중요 공지 상단 정렬
      list.sort((a, b) => (Number(b.isImportant) - Number(a.isImportant)));
      setNotices(list);
    };
    fetch();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-8 min-h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <MegaphoneIcon className="w-7 h-7 text-blue-600" /> 공지사항
        </h1>
        <p className="text-slate-500 mt-1">RuleMakers의 새로운 소식을 확인하세요.</p>
      </div>

      <div className="space-y-4">
        {notices.map((notice) => (
          <div key={notice.id} className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${
            notice.isImportant ? 'border-blue-200 shadow-sm' : 'border-slate-200'
          }`}>
            <div 
              onClick={() => setExpandedId(expandedId === notice.id ? null : notice.id)}
              className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50"
            >
              <div className="flex items-center gap-4">
                <span className={`text-xs font-bold px-2 py-1 rounded border ${
                  notice.isImportant ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                  'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {notice.isImportant ? '중요' : notice.category}
                </span>
                <span className={`text-sm md:text-base ${notice.isImportant ? 'font-bold text-slate-800' : 'font-medium text-slate-700'}`}>
                  {notice.title}
                </span>
              </div>
              <div className="flex items-center gap-4 text-slate-400">
                <span className="text-xs hidden md:block">{notice.createdAt?.toDate().toLocaleDateString()}</span>
                <ChevronRightIcon className={`w-4 h-4 transition-transform ${expandedId === notice.id ? 'rotate-90' : ''}`} />
              </div>
            </div>
            
            {/* 내용 확장 (아코디언) */}
            {expandedId === notice.id && (
              <div className="px-6 pb-6 pt-2 bg-slate-50 border-t border-slate-100">
                <div className="prose prose-sm max-w-none text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {notice.content}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {notices.length === 0 && (
          <div className="text-center py-20 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
            등록된 공지사항이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}