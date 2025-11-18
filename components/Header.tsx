// components/Header.tsx

"use client";

import Link from "next/link";
import Image from "next/image"; 
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/"); // 로그아웃 후 메인 페이지로 이동
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center text-2xl font-bold text-gray-900"
        >
          <Image
            src="/favicon.ico" 
            alt="RuleMakers 로고"
            width={28} 
            height={28} 
            className="mr-2" 
          />
          <span>RuleMakers</span>
        </Link>

        {/* 네비게이션 메뉴 */}
        <nav className="flex items-center space-x-6">
          <Link
            href="/basic-service"
            className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
          >
            베이직 서비스
          </Link>
          <Link
            href="/premium-service"
            className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
          >
            프리미엄 서비스
          </Link>

          <Link
            href="/showcase"
            className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
          >
            컨텐츠 샘플
          </Link>

          {/* 로딩 중일 때는 메뉴를 숨김 */}
          {!loading && (
            <>
              {/* 로그아웃 상태 */}
              {!user && (
                <button
                  onClick={() => router.push("/login")}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  로그인
                </button>
              )}

              {/* 로그인 상태 */}
              {user && (
                <>
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
                  >
                    대시보드
                  </Link>
                  <Link
                    href="/request"
                    className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
                  >
                    작업 요청하기
                  </Link>
                  
                  {/* [수정] 관리자(Admin) 전용 메뉴 */}
                  {user.isAdmin && (
                    <>
                      {/* [신규] 완료된 작업 목록 링크 */}
                      <Link
                        href="/admin/completed"
                        className="rounded-md bg-green-100 px-3 py-1 text-sm font-medium text-green-700 transition-colors hover:bg-green-200"
                      >
                        [완료된 작업]
                      </Link>
                      <Link
                        href="/admin"
                        className="rounded-md bg-red-100 px-3 py-1 text-sm font-medium text-red-700 transition-colors hover:bg-red-200"
                      >
                        [접수된 작업]
                      </Link>
                    </>
                  )}
                  {/* [수정] */}

                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-gray-600 transition-colors hover:text-red-600"
                  >
                    로그아웃
                  </button>
                </>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}