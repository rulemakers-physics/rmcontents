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
  ShieldCheckIcon // [추가] 관리자용 아이콘
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

export default function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth(); // 유저 정보 가져오기

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-50">
      {/* 로고 영역 */}
      <div className="p-6 border-b border-slate-800">
        <Link href="/" className="text-xl font-extrabold tracking-tighter text-white">
          RuleMakers <span className="text-blue-500 text-xs font-normal">App</span>
        </Link>
      </div>

      {/* 메뉴 영역 */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}

        {/* ▼▼▼ [추가] 관리자 메뉴 영역 ▼▼▼ */}
        {user?.isAdmin && (
          <>
            <div className="my-4 border-t border-slate-800 mx-2" />
            <p className="px-4 text-xs font-bold text-slate-500 mb-2 uppercase">Admin</p>
            
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                pathname.startsWith("/admin")
                  ? "bg-red-600 text-white shadow-lg shadow-red-900/50"
                  : "text-red-400 hover:bg-slate-800 hover:text-red-300"
              }`}
            >
              <ShieldCheckIcon className="w-5 h-5" />
              관리자 페이지
            </Link>
          </>
        )}
        {/* ▲▲▲ [추가] ▲▲▲ */}
      </nav>

      {/* 하단 유저 정보 */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
            {user?.email?.[0].toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold truncate">{user?.email?.split('@')[0]}</p>
            <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 mt-0.5">
              <ArrowLeftOnRectangleIcon className="w-3 h-3" /> 로그아웃
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}