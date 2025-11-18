// components/Header.tsx

"use client";

import Link from "next/link";
import Image from "next/image"; // [수정] Image 컴포넌트 import
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
        {/* ▼▼▼ [수정] 로고 ▼▼▼
          Link 태그에 flex와 items-center를 추가하고,
          Image 컴포넌트와 텍스트를 <span>으로 묶습니다.
        */}
        <Link
          href="/"
          className="flex items-center text-2xl font-bold text-gray-900"
        >
          <Image
            src="/favicon.ico" // public 폴더에 있는 favicon.ico 경로
            alt="RuleMakers 로고"
            width={28} // 로고 너비 (조절 가능)
            height={28} // 로고 높이 (조절 가능)
            className="mr-2" // 텍스트와의 오른쪽 간격
          />
          <span>RuleMakers</span>
        </Link>
        {/* ▲▲▲ [수정] 여기까지 ▲▲▲ */}

        {/* 네비게이션 메뉴 */}
        <nav className="flex items-center space-x-6">
          {/* [신규] 서비스 소개 링크 추가 */}
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
          {/* [신규] 여기까지 */}

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

                  {/* 관리자(Admin) 전용 메뉴 */}
                  {user.isAdmin && (
                    <Link
                      href="/admin"
                      className="rounded-md bg-red-100 px-3 py-1 text-sm font-medium text-red-700 transition-colors hover:bg-red-200"
                    >
                      (관리자)
                    </Link>
                  )}

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