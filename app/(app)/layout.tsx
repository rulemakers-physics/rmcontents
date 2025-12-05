// app/(app)/layout.tsx
"use client";

import { useState } from "react";
// [추가] 경로 확인을 위한 훅 import
import { usePathname } from "next/navigation"; 
import AppSidebar from "@/components/AppSidebar";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // [추가] 현재 경로 확인
  const pathname = usePathname();
  const isSetupPage = pathname === "/profile/setup";

  // 사이드바 접힘 상태 관리
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  // [추가] 프로필 셋업 페이지라면 사이드바와 헤더 없이 컨텐츠만 반환
  if (isSetupPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  // 그 외 일반 페이지는 기존 레이아웃 유지
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 사이드바 */}
      <AppSidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={toggleSidebar} 
      />
      
      {/* 메인 컨텐츠 영역 */}
      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "ml-20" : "ml-64"
        }`}
      >
        {/* 상단 헤더 영역 (Breadcrumbs) */}
        <header className="h-16 bg-white/50 backdrop-blur-sm border-b border-slate-200 flex items-center px-8 sticky top-0 z-40">
          <Breadcrumbs />
        </header>

        {/* 페이지 컨텐츠 */}
        <main className="flex-1 p-0">
          {children}
        </main>
      </div>
    </div>
  );
}