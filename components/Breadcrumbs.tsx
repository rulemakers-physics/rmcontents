// components/Breadcrumbs.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/solid";

// 경로를 한글 이름으로 변환하는 맵
const ROUTE_NAME_MAP: Record<string, string> = {
  dashboard: "대시보드",
  request: "작업 요청",
  service: "서비스",
  maker: "문제은행",
  profile: "프로필",
  settings: "설정",
  admin: "관리자",
  active: "접수된 작업",
  completed: "완료/반려 내역",
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  
  // 경로 쪼개기 (빈 문자열 제거)
  const pathSegments = pathname.split("/").filter((segment) => segment !== "");

  return (
    <nav className="flex items-center text-sm text-slate-500 mb-6">
      <Link href="/dashboard" className="hover:text-slate-900 transition-colors">
        <HomeIcon className="w-4 h-4" />
      </Link>
      
      {pathSegments.map((segment, index) => {
        // 현재 세그먼트까지의 경로 생성
        const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
        const isLast = index === pathSegments.length - 1;
        const name = ROUTE_NAME_MAP[segment] || segment; // 매핑된 이름이 없으면 영어 그대로 표시

        return (
          <div key={href} className="flex items-center">
            <ChevronRightIcon className="w-3 h-3 mx-2 text-slate-300" />
            {isLast ? (
              <span className="font-bold text-slate-900">{name}</span>
            ) : (
              <Link href={href} className="hover:text-slate-900 transition-colors">
                {name}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}