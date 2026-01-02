// app/(marketing)/layout.tsx

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MarketingChatbot from "@/components/MarketingChatbot"; // [신규] 임포트

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-grow relative"> {/* relative 추가 권장 */}
        {children}
      </main>
      <Footer />
      
      {/* 챗봇 위젯 추가 */}
      <MarketingChatbot />
    </>
  );
}