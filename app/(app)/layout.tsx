// app/(app)/layout.tsx
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation"; 
import AppSidebar from "@/components/AppSidebar";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSetupPage = pathname === "/profile/setup";

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  if (isSetupPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  return (
    // [핵심 수정] fixed inset-0 z-0 추가
    // 화면에 레이아웃을 고정시켜 바깥쪽(Body) 스크롤 발생을 원천 차단합니다.
    <div className="fixed inset-0 z-0 flex bg-gray-50 overflow-hidden">
      
      <AppSidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={toggleSidebar} 
      />
      
      <div 
        className="flex-1 flex flex-col h-full transition-all duration-300 ease-in-out min-w-0"
      >
        <header className="h-16 bg-white/50 backdrop-blur-sm border-b border-slate-200 flex items-center px-8 sticky top-0 z-40 flex-shrink-0">
          <Breadcrumbs />
        </header>

        {/* 컨텐츠 영역: flex-1로 남은 공간 채움 */}
        <main className="flex-1 overflow-y-auto p-0 scrollbar-hide flex flex-col bg-gray-50 relative">
          {children}
        </main>
      </div>
    </div>
  );
}