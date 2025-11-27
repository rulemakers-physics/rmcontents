// components/NotificationBell.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

// 더미 데이터 (실제로는 Firestore 'notifications' 컬렉션 연동)
const MOCK_NOTIFICATIONS = [
  { 
    id: 1, 
    type: 'success', 
    title: "제작 완료", 
    message: "'2024 수능특강 변형' 작업이 완료되었습니다. 결과물을 확인하세요.", 
    link: '/dashboard', // 클릭 시 이동할 곳
    isRead: false, 
    time: "방금 전" 
  },
  { 
    id: 2, 
    type: 'info', 
    title: "공지사항", 
    message: "Maker's Plan 기능이 업데이트 되었습니다.", 
    link: '/service/maker',
    isRead: true, 
    time: "2시간 전" 
  }
];

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-colors ${isOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 z-50 origin-top-right animate-in fade-in zoom-in-95 duration-100">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">알림 센터</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs font-medium text-blue-600 hover:underline">
                모두 읽음
              </button>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-slate-400">새로운 알림이 없습니다.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-50">
                {notifications.map((noti) => (
                  <li key={noti.id} className={`hover:bg-slate-50 transition-colors ${!noti.isRead ? 'bg-blue-50/40' : ''}`}>
                    <Link 
                      href={noti.link} 
                      onClick={() => setIsOpen(false)}
                      className="block px-5 py-4"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          noti.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {noti.title}
                        </span>
                        <span className="text-[11px] text-slate-400">{noti.time}</span>
                      </div>
                      <p className={`text-sm mt-1 leading-relaxed ${!noti.isRead ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                        {noti.message}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="p-2 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl text-center">
            <Link href="/dashboard" onClick={() => setIsOpen(false)} className="text-xs font-bold text-slate-500 hover:text-slate-800">
              전체 내역 보기
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}