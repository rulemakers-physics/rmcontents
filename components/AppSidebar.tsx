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
  ChevronLeftIcon,
  ChevronRightIcon,
  FolderIcon,
  CreditCardIcon, 
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  MegaphoneIcon,
  UserGroupIcon,
  ChartBarIcon,
  IdentificationIcon,
  BuildingOffice2Icon
} from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const MENU_ITEMS = [
  { name: "대시보드", href: "/dashboard", icon: HomeIcon },
  { name: "공지사항", href: "/board/notices", icon: MegaphoneIcon },
  { name: "문제은행", href: "/service/maker", icon: BeakerIcon },
  { name: "내 보관함", href: "/service/storage", icon: FolderIcon },
  { name: "반/학생 관리", href: "/manage/classes", icon: UserGroupIcon },
  { name: "성적 리포트", href: "/manage/reports", icon: ChartBarIcon },
  { name: "작업 요청", href: "/request", icon: DocumentPlusIcon },
  { name: "결제/세금", href: "/profile/billing", icon: CreditCardIcon },
  { name: "프로필 설정", href: "/profile/settings", icon: UserCircleIcon },
];

interface AppSidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export default function AppSidebar({ isCollapsed, toggleSidebar }: AppSidebarProps) {
  const pathname = usePathname();
  const { user, userData } = useAuth();

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
              title={isCollapsed ? item.name : ""}
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

        {/* [신규] 원장님(Director) 전용 메뉴: 강사 관리 */}
        {userData?.role === 'director' && (
          <Link
            href="/manage/instructors"
            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
              pathname.startsWith("/manage/instructors")
                ? "bg-blue-600 text-white shadow-lg"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            } ${isCollapsed ? "justify-center" : ""}`}
          >
            <IdentificationIcon className="w-6 h-6 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium truncate">강사 관리</span>}
          </Link>
        )}

        {/* 관리자 메뉴 섹션 */}
        {user?.isAdmin && (
          <>
            <div className={`my-4 border-t border-slate-800 ${isCollapsed ? "mx-1" : "mx-2"}`} />
            {!isCollapsed && <p className="px-4 text-xs font-bold text-slate-500 mb-2 uppercase">Admin</p>}
            
            {/* 1. 관리자 대시보드 (메인) */}
            <Link
              href="/admin"
              title="관리자 대시보드"
              // [수정] 하위 메뉴 경로들(/admin/problems, /admin/reports)은 제외
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                (pathname.startsWith("/admin") && 
                 !pathname.startsWith("/admin/problems") && 
                 !pathname.startsWith("/admin/reports") &&
                 !pathname.startsWith("/admin/users")&&
                 !pathname.startsWith("/admin/notices"))

                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/50" // [수정] Green/Emerald 계열
                  : "text-emerald-400 hover:bg-slate-800 hover:text-emerald-300"
              } ${isCollapsed ? "justify-center" : ""}`}
            >
              <ShieldCheckIcon className="w-6 h-6 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium truncate">관리자 대시보드</span>}
            </Link>
            
            {/* 회원 관리 메뉴 */}
            <Link
              href="/admin/users"
              title="회원 관리 (CRM)"
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                pathname.startsWith("/admin/users")
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-900/50"
                  : "text-violet-400 hover:bg-slate-800 hover:text-violet-300"
              } ${isCollapsed ? "justify-center" : ""}`}
            >
              <UsersIcon className="w-6 h-6 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium truncate">회원 관리</span>}
            </Link>

            {/* 2. 문제 DB 관리 */}
            <Link
              href="/admin/problems"
              title="문제 DB 관리"
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                pathname.startsWith("/admin/problems")
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50"
                  : "text-indigo-400 hover:bg-slate-800 hover:text-indigo-300"
              } ${isCollapsed ? "justify-center" : ""}`}
            >
              <ArchiveBoxIcon className="w-6 h-6 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium truncate">문제 DB 관리</span>}
            </Link>

            {/* 3. 오류 신고 관리 (신규) */}
            <Link
              href="/admin/reports"
              title="오류 신고 관리"
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                pathname.startsWith("/admin/reports")
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-900/50"
                  : "text-rose-400 hover:bg-slate-800 hover:text-rose-300"
              } ${isCollapsed ? "justify-center" : ""}`}
            >
              <ExclamationTriangleIcon className="w-6 h-6 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium truncate">오류 신고 관리</span>}
            </Link>

            {/* 4. 학원 현황 (신규) */}
            <Link
              href="/admin/academies"
              title="학원 현황"
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                pathname.startsWith("/admin/academies")
                  ? "bg-slate-700 text-white shadow-lg"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-300"
              } ${isCollapsed ? "justify-center" : ""}`}
            >
              <BuildingOffice2Icon className="w-6 h-6 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium truncate">학원 현황</span>}
            </Link>

            {/* 공지사항 관리 메뉴 추가 */}
            <Link
              href="/admin/notices"
              title="공지사항 관리"
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                pathname.startsWith("/admin/notices")
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-900/50"
                  : "text-amber-500 hover:bg-slate-800 hover:text-amber-300"
              } ${isCollapsed ? "justify-center" : ""}`}
            >
              <MegaphoneIcon className="w-6 h-6 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium truncate">공지사항 관리</span>}
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