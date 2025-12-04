// components/StudentBottomNav.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  HomeIcon, 
  BookOpenIcon, 
  ChartBarIcon, 
  UserCircleIcon 
} from "@heroicons/react/24/outline";
import { 
  HomeIcon as HomeSolid, 
  BookOpenIcon as BookSolid, 
  ChartBarIcon as ChartSolid, 
  UserCircleIcon as UserSolid 
} from "@heroicons/react/24/solid";

const NAV_ITEMS = [
  { name: "홈", href: "/student/dashboard", icon: HomeIcon, activeIcon: HomeSolid },
  { name: "학습하기", href: "/student/study", icon: BookOpenIcon, activeIcon: BookSolid },
  { name: "오답노트", href: "/student/report", icon: ChartBarIcon, activeIcon: ChartSolid },
  { name: "내 정보", href: "/student/profile", icon: UserCircleIcon, activeIcon: UserSolid },
];

export default function StudentBottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pb-safe z-50 md:hidden shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
      <div className="flex justify-around items-center h-16 px-2">
        {NAV_ITEMS.map((item) => {
          // 현재 경로가 해당 메뉴의 경로로 시작하면 활성화
          const isActive = pathname.startsWith(item.href);
          const Icon = isActive ? item.activeIcon : item.icon;
          
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center h-full active:scale-95 transition-transform"
            >
              <div className={`relative p-1.5 rounded-xl transition-colors ${isActive ? 'bg-emerald-50' : 'bg-transparent'}`}>
                <Icon className={`w-6 h-6 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                {isActive && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full border border-white"></span>
                )}
              </div>
              <span className={`text-[10px] font-medium mt-0.5 ${isActive ? "text-emerald-700" : "text-slate-400"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}