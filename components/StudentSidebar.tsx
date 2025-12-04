// components/StudentSidebar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  HomeIcon,
  BookOpenIcon,
  ChartBarIcon,
  UserCircleIcon,
  ArrowLeftOnRectangleIcon,
  SparklesIcon,
  BookmarkIcon // [수정] 추가됨
} from "@heroicons/react/24/outline";
import { 
  HomeIcon as HomeSolid, 
  BookOpenIcon as BookSolid, 
  ChartBarIcon as ChartSolid, 
  UserCircleIcon as UserSolid,
  BookmarkIcon as BookmarkSolid // [수정] 추가됨
} from "@heroicons/react/24/solid";

const NAV_ITEMS = [
  { name: "홈", href: "/student/dashboard", icon: HomeIcon, activeIcon: HomeSolid },
  { name: "학습하기", href: "/student/study", icon: BookOpenIcon, activeIcon: BookSolid },
  { name: "성적 리포트", href: "/student/report", icon: ChartBarIcon, activeIcon: ChartSolid },
  { name: "나의 스크랩북", href: "/student/scraps", icon: BookmarkIcon, activeIcon: BookmarkSolid },
  { name: "내 정보", href: "/student/profile", icon: UserCircleIcon, activeIcon: UserSolid },
];

export default function StudentSidebar() {
  const pathname = usePathname();
  const { user, userData } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white border-r border-slate-200 z-50">
      {/* 1. 로고 영역 */}
      <div className="h-20 flex items-center px-6 border-b border-slate-100">
        <Link href="/student/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <SparklesIcon className="w-5 h-5" />
          </div>
          <span className="text-lg font-extrabold text-slate-800 tracking-tight">
            RuleMakers
          </span>
        </Link>
      </div>

      {/* 2. 네비게이션 메뉴 */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <p className="px-4 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Menu</p>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = isActive ? item.activeIcon : item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* 3. 하단 프로필 및 로그아웃 */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 mb-2">
          <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
            <UserCircleIcon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{userData?.name || "학생"}</p>
            <p className="text-xs text-slate-500 truncate">{userData?.school || "학교 미설정"}</p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <ArrowLeftOnRectangleIcon className="w-4 h-4" /> 로그아웃
        </button>
      </div>
    </aside>
  );
}