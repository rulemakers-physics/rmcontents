// components/NotificationBell.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  limit, 
  updateDoc, 
  doc,
  Timestamp 
} from "firebase/firestore";

interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: Timestamp;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 읽지 않은 알림 개수
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Firestore 실시간 구독
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(10) // 최근 10개만 가져오기
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(newNotifications);
    });

    return () => unsubscribe();
  }, [user]);

  // 알림 클릭 시 '읽음' 처리 핸들러
  const handleNotificationClick = async (notificationId: string, link: string) => {
    setIsOpen(false);
    try {
      const notiRef = doc(db, "notifications", notificationId);
      await updateDoc(notiRef, { isRead: true });
    } catch (error) {
      console.error("알림 읽음 처리 실패:", error);
    }
  };

  // 시간 포맷팅 함수 (예: '방금 전', '2시간 전')
  const formatTimeAgo = (timestamp: Timestamp) => {
    if (!timestamp) return "";
    const now = new Date();
    const date = timestamp.toDate();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "방금 전";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    return `${Math.floor(diffInSeconds / 86400)}일 전`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-50 origin-top-right animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-5 py-4 border-b border-slate-50 flex justify-between items-center bg-white">
            <h3 className="font-bold text-slate-800">알림</h3>
            {unreadCount > 0 && (
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                {unreadCount}개의 새 알림
              </span>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <BellIcon className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">새로운 알림이 없습니다.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-50">
                {notifications.map((noti) => (
                  <li key={noti.id} className={`transition-colors ${!noti.isRead ? 'bg-blue-50/30 hover:bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                    <Link 
                      href={noti.link || '#'} 
                      onClick={() => handleNotificationClick(noti.id, noti.link)}
                      className="block px-5 py-4"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          noti.type === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 
                          noti.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' :
                          'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {noti.title}
                        </span>
                        <span className="text-[11px] text-slate-400 shrink-0 ml-2">
                          {formatTimeAgo(noti.createdAt)}
                        </span>
                      </div>
                      <p className={`text-sm mt-1.5 leading-relaxed ${!noti.isRead ? 'text-slate-800 font-semibold' : 'text-slate-500'}`}>
                        {noti.message}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <Link href="/dashboard" onClick={() => setIsOpen(false)} className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
              전체 알림 보기
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}