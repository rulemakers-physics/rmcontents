// components/Header.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
// [추가] 모바일 햄버거 메뉴 아이콘
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

export default function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // [수정] 모바일 메뉴 토글 상태 관리
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 알림 상태 관리
  const [unreadDashboard, setUnreadDashboard] = useState(0); // 강사용
  const [unreadActive, setUnreadActive] = useState(0);       // 관리자용 (접수/진행중)
  const [unreadCompleted, setUnreadCompleted] = useState(0); // 관리자용 (완료/반려)

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
      setIsMenuOpen(false); // 로그아웃 후 메뉴 닫기
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };
  
  // [신규] 메뉴 클릭 시 메뉴 닫는 핸들러
  const handleMenuClick = (href: string) => {
    setIsMenuOpen(false);
    router.push(href);
  }

  // 실시간 알림 리스너
  useEffect(() => {
    if (loading || !user) return;

    // 1. 강사인 경우: 내 요청 중 강사용 안 읽은 메시지가 있는 것 카운트
    if (!user.isAdmin) {
      const q = query(
        collection(db, "requests"),
        where("instructorId", "==", user.uid),
        where("unreadCountInstructor", ">", 0)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setUnreadDashboard(snapshot.size);
      });
      return () => unsubscribe();
    }

    // 2. 관리자인 경우: 관리자용 안 읽은 메시지가 있는 모든 요청 가져와서 분류
    if (user.isAdmin) {
      const q = query(
        collection(db, "requests"),
        where("unreadCountAdmin", ">", 0)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        let activeCount = 0;
        let completedCount = 0;

        snapshot.forEach((doc) => {
          const status = doc.data().status;
          if (status === "requested" || status === "in_progress") {
            activeCount++;
          } else if (status === "completed" || status === "rejected") {
            completedCount++;
          }
        });

        setUnreadActive(activeCount);
        setUnreadCompleted(completedCount);
      });
      return () => unsubscribe();
    }
  }, [user, loading]);

  // [신규] PC/모바일에서 사용될 공통 메뉴 목록을 배열로 정의
  const navItems = (isMobile = false) => (
    <>
      <NavItem href="/basic-service" isMobile={isMobile}>
        베이직 서비스
      </NavItem>
      <NavItem href="/premium-service" isMobile={isMobile}>
        프리미엄 서비스
      </NavItem>
      <NavItem href="/showcase" isMobile={isMobile}>
        컨텐츠 샘플
      </NavItem>
    </>
  );

  // [신규] 로그인 상태에 따른 사용자 메뉴 목록을 배열로 정의
  const userItems = (isMobile = false) => {
    if (loading) return null;

    if (!user) {
      // 비로그인 시
      return (
        <button
          onClick={() => handleMenuClick("/login")}
          className={`${isMobile ? 'mt-4 w-full' : ''} rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 whitespace-nowrap`}
        >
          로그인
        </button>
      );
    }

    // 로그인 시
    return (
      <>
        <NavItem href="/dashboard" isMobile={isMobile} className="relative">
          대시보드
          {unreadDashboard > 0 && (
            <span className="absolute -top-2 -right-3 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {unreadDashboard > 9 ? "9+" : unreadDashboard}
            </span>
          )}
        </NavItem>
        <NavItem href="/request" isMobile={isMobile}>
          작업 요청하기
        </NavItem>

        {/* 관리자 전용 메뉴 */}
        {user.isAdmin && (
          <>
            <NavItem href="/admin/completed" isMobile={isMobile} className="relative rounded-md bg-green-100 px-3 py-1 text-green-700 hover:bg-green-200">
              [완료된 작업]
              {unreadCompleted > 0 && (
                <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                  {unreadCompleted > 9 ? "9+" : unreadCompleted}
                </span>
              )}
            </NavItem>
            <NavItem href="/admin" isMobile={isMobile} className="relative rounded-md bg-red-100 px-3 py-1 text-red-700 hover:bg-red-200">
              [접수된 작업]
              {unreadActive > 0 && (
                <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                  {unreadActive > 9 ? "9+" : unreadActive}
                </span>
              )}
            </NavItem>
          </>
        )}

        <button
          onClick={handleLogout}
          className={`${isMobile ? 'mt-4 w-full text-left' : 'whitespace-nowrap'} text-sm font-medium text-gray-600 transition-colors hover:text-red-600`}
        >
          로그아웃
        </button>
      </>
    );
  };
  
  // [수정] NavItem 컴포넌트: Link와 스타일을 통합하고, isMobile에 따라 스타일 분기 처리
  const NavItem = ({ href, children, isMobile, className = '' }: { href: string; children: React.ReactNode; isMobile: boolean; className?: string }) => (
    <Link
      href={href}
      onClick={() => setIsMenuOpen(false)} // 클릭 시 메뉴 닫기
      className={`text-sm font-medium transition-colors hover:text-blue-600 whitespace-nowrap ${
        isMobile ? 'block w-full py-2 text-gray-800 border-b border-gray-100' : 'text-gray-600'
      } ${className}`}
    >
      {children}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        
        {/* 로고 */}
        <Link
          href="/"
          className="flex items-center text-2xl font-bold text-gray-900 flex-shrink-0" // flex-shrink-0 추가
          onClick={() => setIsMenuOpen(false)}
        >
          <Image
            src="/favicon.ico"
            alt="RuleMakers 로고"
            width={28}
            height={28}
            className="mr-2"
          />
          <span className="text-xl">RuleMakers</span> {/* 모바일에서 로고 폰트 크기 조정 */}
        </Link>

        {/* PC 네비게이션 메뉴 (md 이상에서 보임) */}
        <nav className="hidden md:flex items-center space-x-6">
          {navItems(false)}
          {userItems(false)}
        </nav>

        {/* 모바일 햄버거 버튼 (md 미만에서 보임) */}
        <div className="md:hidden flex items-center">
          {/* 비로그인 시 로그인 버튼 노출 */}
          {!user && !loading && (
             <button
                onClick={() => handleMenuClick("/login")}
                className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-blue-700 mr-4"
              >
                로그인
             </button>
          )}

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-600 hover:text-blue-600 p-1"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* 모바일 메뉴 오버레이 (isMenuOpen 상태에 따라 토글) */}
      <div
        className={`md:hidden absolute w-full bg-white/95 backdrop-blur-sm shadow-xl transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'max-h-screen opacity-100 border-t' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="flex flex-col px-6 py-4 space-y-2">
          {navItems(true)}
          
          {/* 구분선 */}
          <div className="py-2">
            <div className="h-px bg-gray-200" />
          </div>

          {/* 사용자 메뉴 (대시보드, 요청하기, 관리자 메뉴, 로그아웃) */}
          <div className="flex flex-col space-y-2">
            {userItems(true)}
          </div>
        </div>
      </div>
    </header>
  );
}