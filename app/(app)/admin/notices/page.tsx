// app/(app)/admin/notices/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, query, orderBy, getDocs, 
  addDoc, deleteDoc, doc, serverTimestamp, updateDoc 
} from "firebase/firestore";
import { 
  MegaphoneIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  PlusIcon,
  CheckBadgeIcon
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { Notice, NoticeCategory } from "@/types/notice";
import AdminNoticeModal from "@/components/AdminNoticeModal"; // 아래에서 만들 컴포넌트

export default function AdminNoticesPage() {
  const { user, loading } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const fetchNotices = async () => {
    try {
      const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notice));
      setNotices(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user?.isAdmin) fetchNotices();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, "notices", id));
      toast.success("삭제되었습니다.");
      fetchNotices();
    } catch (e) {
      toast.error("삭제 실패");
    }
  };

  const handleOpenModal = (notice?: Notice) => {
    setSelectedNotice(notice || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = (refresh = false) => {
    setIsModalOpen(false);
    setSelectedNotice(null);
    if (refresh) fetchNotices();
  };

  if (loading || !user?.isAdmin) return null;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <MegaphoneIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">공지사항 관리</h1>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
          >
            <PlusIcon className="w-5 h-5" /> 새 공지 작성
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">상태</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">제목</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">작성일</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {notices.map((notice) => (
                <tr key={notice.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <span className={`px-2 py-0.5 text-xs font-bold rounded border ${
                        notice.category === '점검' ? 'bg-red-50 text-red-600 border-red-100' :
                        notice.category === '업데이트' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        'bg-gray-50 text-gray-600 border-gray-200'
                      }`}>
                        {notice.category}
                      </span>
                      {notice.isImportant && (
                        <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded bg-yellow-50 text-yellow-700 border border-yellow-100">
                          <CheckBadgeIcon className="w-3 h-3" /> 필독
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {notice.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {notice.createdAt?.toDate().toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenModal(notice)} className="p-2 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50">
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(notice.id)} className="p-2 text-slate-400 hover:text-red-600 rounded hover:bg-red-50">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {notices.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-400">등록된 공지사항이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <AdminNoticeModal 
          notice={selectedNotice} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
}