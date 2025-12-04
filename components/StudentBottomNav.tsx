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
  { name: "성적분석", href: "/student/report", icon: ChartBarIcon, activeIcon: ChartSolid },
  { name: "내 정보", href: "/student/profile", icon: UserCircleIcon, activeIcon: UserSolid },
];

export default function StudentBottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:hidden">
      <div className="flex justify-around items-center h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = isActive ? item.activeIcon : item.icon;
          
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? "text-teal-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}