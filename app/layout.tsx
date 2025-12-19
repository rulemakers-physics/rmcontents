// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast"; // [추가]
import RouteGuard from "@/components/RouteGuard"; // 방금 만든 컴포넌트 import

export const metadata: Metadata = {
  title: "PASS by RuleMakers",
  description: "프리미엄 통합과학 문제은행과 맞춤형 컨텐츠 제작 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="flex min-h-screen flex-col font-sans">
        <AuthProvider>
          <RouteGuard>
            {children}
          </RouteGuard>
          <Toaster 
            position="top-center" 
            toastOptions={{
              duration: 3000,
              style: {
                background: '#333',
                color: '#fff',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e', // green-500
                  secondary: 'white',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}