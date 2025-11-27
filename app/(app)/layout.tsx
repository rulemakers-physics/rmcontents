// app/(app)/layout.tsx
import AppSidebar from "@/components/AppSidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 사이드바 (고정) */}
      <AppSidebar />
      
      {/* 메인 컨텐츠 영역 (사이드바 너비만큼 왼쪽 여백) */}
      <div className="flex-1 ml-64">
        {children}
      </div>
    </div>
  );
}