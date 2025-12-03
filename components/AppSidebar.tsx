"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon, BeakerIcon, DocumentPlusIcon, UserCircleIcon, ArrowLeftOnRectangleIcon,
  ShieldCheckIcon, ChevronLeftIcon, ChevronRightIcon, FolderIcon, CreditCardIcon,
  UsersIcon, MegaphoneIcon, UserGroupIcon, ChartBarIcon, IdentificationIcon,
  BuildingOffice2Icon, BanknotesIcon, ArchiveBoxIcon, ExclamationTriangleIcon,
  SparklesIcon, AcademicCapIcon
} from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

// 메뉴 구조를 계층화합니다.
const MENU_GROUPS = [
  {
    id: "studio",
    label: "CONTENT STUDIO", // 컨텐츠 제작 영역
    items: [
      { name: "문제은행 (Maker)", href: "/service/maker", icon: BeakerIcon },
      { name: "내 보관함", href: "/service/storage", icon: FolderIcon },
      { name: "작업 요청", href: "/request", icon: DocumentPlusIcon },
    ]
  },
  {
    id: "lms",
    label: "ACADEMY LMS", // 학원 관리 영역
    items: [
      { name: "반/학생 관리", href: "/manage/classes", icon: UserGroupIcon },
      { name: "성적 리포트", href: "/manage/reports", icon: ChartBarIcon },
      { name: "강사 관리", href: "/manage/instructors", icon: IdentificationIcon, role: "director" }, // Role 체크 필요
    ]
  },
  {
    id: "support",
    label: "GENERAL", // 일반/지원 영역
    items: [
      { name: "대시보드", href: "/dashboard", icon: HomeIcon },
      { name: "공지사항", href: "/board/notices", icon: MegaphoneIcon },
      { name: "결제/세금", href: "/profile/billing", icon: CreditCardIcon },
      { name: "프로필 설정", href: "/profile/settings", icon: UserCircleIcon },
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
      } bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out border-r border-slate-800 shadow-2xl`}
    >
      {/* 로고 영역 */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950/50">
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tighter text-white truncate">
            <span className="text-blue-500 text-xl">R</span>uleMakers
          </Link>
        )}
        <button 
          onClick={toggleSidebar} 
          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors mx-auto"
        >
          {isCollapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
        </button>
      </div>

      {/* 메뉴 영역 */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar py-4">
        
        {MENU_GROUPS.map((group) => (
          <div key={group.id} className="mb-6">
            {/* 섹션 헤더 (접혀있지 않을 때만 표시) */}
            {!isCollapsed && (
              <h3 className="px-6 mb-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                {group.label}
              </h3>
            )}
            
            <div className="px-3 space-y-1">
              {group.items.map((item) => {
                // 권한 체크 (role 필드가 있는데 권한이 안 맞으면 렌더링 안 함)
                if (item.role === "director" && userData?.role !== "director") return null;

                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.name : ""}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? "bg-blue-600 text-white shadow-md shadow-blue-900/20 translate-x-1" 
                        : "text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1"
                    } ${isCollapsed ? "justify-center" : ""}`}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? "text-white" : "text-slate-500 group-hover:text-white"}`} />
                    {!isCollapsed && <span className="text-sm font-medium truncate">{item.name}</span>}
                    
                    {/* Active Indicator (우측 점) */}
                    {!isCollapsed && isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/50" />
                    )}
                  </Link>
                );
              })}
            </div>
            {/* 그룹 간 구분선 (접힌 상태에서 시각적 분리) */}
            {isCollapsed && <div className="mx-4 my-4 border-t border-slate-800" />}
          </div>
        ))}

        {/* 관리자 메뉴 (기존 로직 유지하되 스타일 통일) */}
        {user?.isAdmin && (
          <div className="mb-6">
            {!isCollapsed && (
              <h3 className="px-6 mb-2 text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest">
                ADMINISTRATION
              </h3>
            )}
            <div className="px-3 space-y-1">
              <Link
                href="/admin"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  pathname.startsWith("/admin") && !pathname.startsWith("/admin/") // 메인만
                    ? "bg-emerald-600 text-white shadow-lg"
                    : "text-emerald-500 hover:bg-slate-800 hover:text-emerald-400"
                } ${isCollapsed ? "justify-center" : ""}`}
              >
                <ShieldCheckIcon className="w-5 h-5" />
                {!isCollapsed && <span className="text-sm font-medium">관리자 홈</span>}
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

            {/* 5. 결제/세금 관리 (신규) */}
            <Link
              href="/admin/billing"
              title="결제 및 세금 관리"
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                pathname.startsWith("/admin/billing")
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/50" // 초록색(돈) 테마
                  : "text-emerald-400 hover:bg-slate-800 hover:text-emerald-300"
              } ${isCollapsed ? "justify-center" : ""}`}
            >
              <BanknotesIcon className="w-6 h-6 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium truncate">결제/세금 관리</span>}
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
          </div>
          </div>
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