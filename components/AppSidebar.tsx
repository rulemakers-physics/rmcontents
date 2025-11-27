// components/AppSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  BeakerIcon,
  DocumentPlusIcon,
  UserCircleIcon,
  ArrowLeftOnRectangleIcon,
  ShieldCheckIcon,
  ChevronLeftIcon, // [추가] 접기 아이콘
  ChevronRightIcon // [추가] 펼치기 아이콘
} from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const MENU_ITEMS = [
  { name: "대시보드", href: "/dashboard", icon: HomeIcon },
  { name: "문제은행", href: "/service/maker", icon: BeakerIcon },
  { name: "작업 요청", href: "/request", icon: DocumentPlusIcon },
  { name: "프로필", href: "/profile/settings", icon: UserCircleIcon },
];

// [추가] Props 타입 정의
interface AppSidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export default function AppSidebar({ isCollapsed, toggleSidebar }: AppSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  return (
    <aside 
      className={`${
        isCollapsed ? "w-20" : "w-64"
      } bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out border-r border-slate-800`}
    >
      {/* 로고 영역 */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        {!isCollapsed && (
          <Link href="/" className="text-lg font-extrabold tracking-tighter text-white truncate">
            RuleMakers <span className="text-blue-500 text-xs font-normal">App</span>
          </Link>
        )}
        {/* 사이드바 토글 버튼 */}
        <button 
          onClick={toggleSidebar} 
          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors mx-auto"
        >
          {isCollapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
        </button>
      </div>

      {/* 메뉴 영역 */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.name : ""} // 접혔을 때 툴팁처럼 이름 표시
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              } ${isCollapsed ? "justify-center" : ""}`}
            >
              <item.icon className="w-6 h-6 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium truncate">{item.name}</span>}
            </Link>
          );
        })}

        {/* 관리자 메뉴 */}
        {user?.isAdmin && (
          <>
            <div className={`my-4 border-t border-slate-800 ${isCollapsed ? "mx-1" : "mx-2"}`} />
            {!isCollapsed && <p className="px-4 text-xs font-bold text-slate-500 mb-2 uppercase">Admin</p>}
            
            <Link
              href="/admin"
              title="관리자 페이지"
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                pathname.startsWith("/admin")
                  ? "bg-red-600 text-white shadow-lg shadow-red-900/50"
                  : "text-red-400 hover:bg-slate-800 hover:text-red-300"
              } ${isCollapsed ? "justify-center" : ""}`}
            >
              <ShieldCheckIcon className="w-6 h-6 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium truncate">관리자</span>}
            </Link>
          </>
        )}
      </nav>

      {/* 하단 유저 정보 */}
      <div className="p-4 border-t border-slate-800">
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} px-2 py-2 rounded-xl bg-slate-800/50`}>
          <div className="w-8 h-8 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center text-xs font-bold">
            {user?.email?.[0].toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden min-w-0">
              <p className="text-sm font-bold truncate">{user?.email?.split('@')[0]}</p>
              <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 mt-0.5 truncate">
                <ArrowLeftOnRectangleIcon className="w-3 h-3" /> 로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}