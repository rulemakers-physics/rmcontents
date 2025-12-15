// app/(app)/board/notices/page.tsx

"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { MegaphoneIcon, ChevronRightIcon, InboxIcon } from "@heroicons/react/24/outline";
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
    <div className="max-w-6xl mx-auto p-8 min-h-full">
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
          <div className="w-full flex flex-col items-center justify-center min-h-[50vh] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 mt-6">
            {/* 변경 핵심:
              1. w-full: 박스를 무조건 가로 100%로 늘립니다. (가장 중요)
              2. border-2: 테두리를 조금 더 두껍게 해서 영역을 확실히 보여줍니다.
              3. min-h-[50vh]: 높이는 유지하여 시원한 공간감을 줍니다.
            */}
            <div className="p-5 bg-white rounded-full shadow-sm border border-slate-100 mb-4">
              <InboxIcon className="w-10 h-10 text-slate-400" />
            </div>
            <div className="text-center max-w-sm px-4">
              <h3 className="text-lg font-bold text-slate-900 mb-1">등록된 공지사항이 없습니다</h3>
              <p className="text-slate-400 text-sm break-keep">
                새로운 소식이 올라오면 이곳에서 가장 먼저 확인하실 수 있습니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}