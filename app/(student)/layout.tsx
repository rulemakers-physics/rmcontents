// app/(student)/layout.tsx

"use client";

import StudentBottomNav from "@/components/StudentBottomNav";
import StudentSidebar from "@/components/StudentSidebar"; // 위에서 만든 컴포넌트

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* 1. Desktop Sidebar (md 이상에서만 보임) */}
      <StudentSidebar />

      {/* 2. Main Content Area */}
      {/* md:pl-64는 사이드바 너비만큼 왼쪽 여백 확보 */}
      <div className="flex flex-col min-h-screen md:pl-64 transition-all duration-300">
        
        {/* 페이지 컨텐츠 */}
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>

        {/* 3. Mobile Bottom Nav (md 미만에서만 보임) */}
        <StudentBottomNav />
        
      </div>
    </div>
  );
}