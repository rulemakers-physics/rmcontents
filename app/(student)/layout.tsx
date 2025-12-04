// app/(student)/layout.tsx

"use client";

import StudentBottomNav from "@/components/StudentBottomNav";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      {/* 데스크탑에서는 중앙 정렬된 모바일 뷰처럼 보여줌 (선택사항) */}
      <div className="mx-auto max-w-md min-h-screen bg-white shadow-2xl md:my-8 md:rounded-[3rem] md:overflow-hidden md:border-8 md:border-slate-900 relative">
        
        {/* 상태바 영역 (데스크탑 뷰 꾸미기용) */}
        <div className="hidden md:block absolute top-0 left-0 right-0 h-7 bg-slate-900 z-50">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-xl"></div>
        </div>

        <main className="h-full overflow-y-auto scrollbar-hide pt-safe md:pt-8 bg-slate-50/50">
          {children}
        </main>
        
        <StudentBottomNav />
      </div>
    </div>
  );
}