// app/(student)/layout.tsx

"use client";

import { usePathname } from "next/navigation";
import StudentBottomNav from "@/components/StudentBottomNav";
import StudentSidebar from "@/components/StudentSidebar"; 

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // OMR 페이지인지 확인 ('/student/omr'로 시작하는 경로)
  const isOmrPage = pathname?.startsWith("/student/omr");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 1. Desktop Sidebar (md 이상에서만 보임) */}
      {/* OMR 페이지에서는 사이드바를 숨겨 다른 메뉴 접근 차단 */}
      {!isOmrPage && <StudentSidebar />}

      {/* 2. Main Content Area */}
      {/* 사이드바가 없을 때(OMR)는 왼쪽 여백(pl-64) 제거하여 전체 너비 사용 */}
      <div 
        className={`flex flex-col min-h-screen transition-all duration-300 ${
          !isOmrPage ? "md:pl-64" : ""
        }`}
      >
        
        {/* 페이지 컨텐츠 */}
        {/* 하단 네비가 없을 때(OMR)는 하단 여백(pb-20) 제거 */}
        <main className={`flex-1 ${!isOmrPage ? "pb-20 md:pb-0" : ""}`}>
          {children}
        </main>

        {/* 3. Mobile Bottom Nav (md 미만에서만 보임) */}
        {/* OMR 페이지에서는 하단 네비게이션 숨김 */}
        {!isOmrPage && <StudentBottomNav />}
        
      </div>
    </div>
  );
}