"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  HomeIcon, BeakerIcon, DocumentPlusIcon, UserCircleIcon, ArrowLeftOnRectangleIcon,
  ShieldCheckIcon, ChevronLeftIcon, ChevronRightIcon, FolderIcon, CreditCardIcon,
  UsersIcon, MegaphoneIcon, UserGroupIcon, ChartBarIcon, IdentificationIcon,
  BuildingOffice2Icon, BanknotesIcon, ArchiveBoxIcon, ExclamationTriangleIcon,
  AcademicCapIcon, ArrowTopRightOnSquareIcon
} from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

// --- [설정] 메뉴 그룹 및 테마 정의 ---
// 순서: GENERAL -> STUDIO -> LMS
const MENU_GROUPS = [
  {
    id: "support",
    label: "GENERAL",
    // 테마: 차분한 인디고/슬레이트 (기본)
    theme: {
      activeBg: "bg-indigo-600",
      activeText: "text-white",
      activeShadow: "shadow-indigo-900/20",
      hoverText: "group-hover:text-indigo-400",
      iconColor: "text-indigo-500",
    },
    items: [
      { name: "대시보드", href: "/dashboard", icon: HomeIcon },
      { name: "공지사항", href: "/board/notices", icon: MegaphoneIcon },
      //{ name: "결제/세금", href: "/profile/billing", icon: CreditCardIcon },
      { name: "프로필 설정", href: "/profile/settings", icon: UserCircleIcon },
    ]
  },
  {
    id: "studio",
    label: "CONTENT STUDIO",
    // 테마: 창의적인 바이올렛/퍼플 (제작/생성)
    theme: {
      activeBg: "bg-violet-600",
      activeText: "text-white",
      activeShadow: "shadow-violet-900/20",
      hoverText: "group-hover:text-violet-400",
      iconColor: "text-violet-500",
    },
    items: [
      { name: "문제은행 (Maker)", href: "/service/maker", icon: BeakerIcon },
      { name: "내 보관함", href: "/service/storage", icon: FolderIcon },
      { name: "작업 요청", href: "/request", icon: DocumentPlusIcon },
    ]
  },
  {
    id: "lms",
    label: "ACADEMY LMS",
    // 테마: 신뢰감 있는 틸/에메랄드 (관리/데이터)
    theme: {
      activeBg: "bg-teal-600",
      activeText: "text-white",
      activeShadow: "shadow-teal-900/20",
      hoverText: "group-hover:text-teal-400",
      iconColor: "text-teal-500",
    },
    items: [
      { name: "반/학생 관리", href: "/manage/classes", icon: UserGroupIcon },
      { name: "성적 리포트", href: "/manage/reports", icon: ChartBarIcon },
      { name: "강사 관리", href: "/manage/instructors", icon: IdentificationIcon, role: "director" },
    ]
  }
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
      } bg-[#0F172A] text-slate-300 flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out border-r border-slate-800 shadow-2xl`}
    >
      {/* 1. 로고 영역 */}
      <div className={`
        flex border-b border-slate-800/80 bg-[#0F172A] transition-all duration-300
        ${isCollapsed ? 'flex-col items-center justify-center py-4 gap-4' : 'flex-row items-center justify-between h-16 px-5'}
      `}>
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-8 h-8 flex-shrink-0 transition-transform group-hover:scale-110 duration-200">
            <Image 
              src="/images/logo.png" 
              alt="RuleMakers" 
              fill 
              className="object-contain" 
            />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              RuleMakers
            </span>
          )}
        </Link>

        {/* 토글 버튼 */}
        <button 
          onClick={toggleSidebar} 
          className="p-1.5 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-all duration-200"
        >
          {isCollapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
        </button>
      </div>

      {/* 2. 네비게이션 영역 */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar py-6 space-y-8">
        
        {MENU_GROUPS.map((group) => (
          <div key={group.id}>
            {/* 섹션 헤더 */}
            {!isCollapsed && (
              <h3 className="px-6 mb-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                {group.label}
                <span className="h-px flex-1 bg-slate-800/50"></span>
              </h3>
            )}
            
            <div className="px-3 space-y-1">
              {group.items.map((item) => {
                if (item.role === "director" && userData?.role !== "director") return null;

                const isActive = pathname.startsWith(item.href);
                // 테마 적용 로직
                const { theme } = group;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.name : ""}
                    className={`
                      group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                      ${isCollapsed ? "justify-center" : ""}
                      ${isActive 
                        ? `${theme.activeBg} ${theme.activeText} shadow-lg ${theme.activeShadow}` 
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                      }
                    `}
                  >
                    <item.icon 
                      className={`
                        w-5 h-5 flex-shrink-0 transition-colors duration-200
                        ${isActive ? "text-white" : `${theme.iconColor} opacity-70 group-hover:opacity-100 group-hover:text-white`}
                      `} 
                    />
                    {!isCollapsed && <span className="text-sm font-medium truncate">{item.name}</span>}
                    
                    {/* Active Indicator (Glow Dot) */}
                    {!isCollapsed && isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* 3. 관리자 메뉴 (하단 배치, 별도 섹션) */}
        {user?.isAdmin && (
          <div className="pt-2">
             {!isCollapsed && (
              <h3 className="px-6 mb-3 text-[11px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-2">
                ADMINISTRATION
                <span className="h-px flex-1 bg-rose-900/20"></span>
              </h3>
            )}
            <div className="px-3 space-y-1">
              {[
                { name: "관리자 홈", href: "/admin", icon: ShieldCheckIcon, color: "rose" },
                { name: "회원 관리", href: "/admin/users", icon: UsersIcon, color: "violet" },
                { name: "문제 DB", href: "/admin/problems", icon: ArchiveBoxIcon, color: "indigo" },
                { name: "오류 신고", href: "/admin/reports", icon: ExclamationTriangleIcon, color: "amber" },
                { name: "학원 현황", href: "/admin/academies", icon: BuildingOffice2Icon, color: "slate" },
                { name: "결제/세금", href: "/admin/billing", icon: BanknotesIcon, color: "emerald" },
                { name: "공지 관리", href: "/admin/notices", icon: MegaphoneIcon, color: "sky" },
              ].map((item) => {
                 // 정확한 경로 매칭을 위해 로직 분리 (관리자 홈 vs 하위 메뉴)
                 const isExactAdmin = item.href === "/admin";
                 const isActive = isExactAdmin 
                    ? pathname === "/admin" 
                    : pathname.startsWith(item.href);

                 // Tailwind 클래스 동적 생성 방지를 위한 매핑 (안전한 방법)
                 const activeColors: Record<string, string> = {
                   rose: "bg-rose-600 shadow-rose-900/20",
                   violet: "bg-violet-600 shadow-violet-900/20",
                   indigo: "bg-indigo-600 shadow-indigo-900/20",
                   amber: "bg-amber-600 shadow-amber-900/20",
                   slate: "bg-slate-600 shadow-slate-900/20",
                   emerald: "bg-emerald-600 shadow-emerald-900/20",
                   sky: "bg-sky-600 shadow-sky-900/20",
                 };
                 const textColors: Record<string, string> = {
                   rose: "text-rose-400 group-hover:text-rose-300",
                   violet: "text-violet-400 group-hover:text-violet-300",
                   indigo: "text-indigo-400 group-hover:text-indigo-300",
                   amber: "text-amber-400 group-hover:text-amber-300",
                   slate: "text-slate-400 group-hover:text-slate-300",
                   emerald: "text-emerald-400 group-hover:text-emerald-300",
                   sky: "text-sky-400 group-hover:text-sky-300",
                 };

                 return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.name : ""}
                    className={`
                      group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                      ${isCollapsed ? "justify-center" : ""}
                      ${isActive 
                        ? `${activeColors[item.color]} text-white shadow-lg` 
                        : `hover:bg-slate-800 ${textColors[item.color]}`
                      }
                    `}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "currentColor"}`} />
                    {!isCollapsed && <span className="text-sm font-medium truncate">{item.name}</span>}
                  </Link>
                 )
              })}

              {/* 학생 뷰 바로가기 */}
              <div className="pt-2 mt-2 border-t border-slate-800/50">
                <Link
                  href="/student/dashboard"
                  target="_blank"
                  className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-all border border-dashed border-slate-700 hover:border-emerald-500 hover:bg-slate-800/50 ${
                    isCollapsed ? "justify-center" : ""
                  }`}
                >
                  <AcademicCapIcon className="w-5 h-5 flex-shrink-0 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  {!isCollapsed && (
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-slate-400 group-hover:text-emerald-400">
                        학생 모드 (미리보기)
                      </span>
                    </div>
                  )}
                  {!isCollapsed && (
                    <ArrowTopRightOnSquareIcon className="w-3 h-3 text-slate-600 ml-auto group-hover:text-emerald-500" />
                  )}
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* 4. 유저 프로필 영역 */}
      <div className="p-4 border-t border-slate-800 bg-[#0F172A]">
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} px-2 py-2 rounded-xl transition-colors hover:bg-slate-800/50`}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex-shrink-0 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-blue-900/20 ring-2 ring-slate-800">
            {user?.email?.[0].toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden min-w-0">
              <p className="text-sm font-bold truncate text-slate-200">{user?.email?.split('@')[0]}</p>
              <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-rose-400 flex items-center gap-1 mt-0.5 transition-colors">
                <ArrowLeftOnRectangleIcon className="w-3 h-3" /> 로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}