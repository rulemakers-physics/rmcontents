// app/(app)/layout.tsx
"use client";

import { useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 사이드바 접힘 상태 관리
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

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